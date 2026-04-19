/**
 * @vitest-environment node
 *
 * UNIT/INTEGRATION TESTS — plickersService
 * Cung cấp độ phủ cho luồng xử lý Kết Thúc Phiên,
 * tạo Sổ điểm, nộp bài, cộng sao.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { plickersService } from '../plickersService';
import prisma from '@/src/lib/prisma';

vi.mock('@/src/lib/prisma', () => ({
  default: {
    enrollment: { findMany: vi.fn() },
    course: { findUnique: vi.fn() },
    assignment: { create: vi.fn() },
    submission: { create: vi.fn() },
    user: { update: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

describe('[INTEGRATION] plickersService.processSessionEnd', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSession = {
    id: 'session-123',
    title: 'Test Plickers',
    courseId: 'course-[test]',
    status: 'ended',
    questions: [
      { id: 'q1', correctAnswer: 'A' },
      { id: 'q2', correctAnswer: 'B' }
    ],
    responses: [
      { cardNumber: 1, questionId: 'q1', answer: 'A' }, // User 1 đúng Q1
      { cardNumber: 1, questionId: 'q2', answer: 'C' }, // User 1 sai Q2
      { cardNumber: 2, questionId: 'q1', answer: 'B' }, // User 2 sai Q1
      { cardNumber: 2, questionId: 'q2', answer: 'B' }  // User 2 đúng Q2
    ]
  };

  it('TC-PLICKERS-001: Không xử lý nếu status chưa phải "ended"', async () => {
    await plickersService.processSessionEnd({ ...mockSession, status: 'active' });
    expect(prisma.enrollment.findMany).not.toHaveBeenCalled();
  });

  it('TC-PLICKERS-002: Xử lý chấm điểm và tạo Assignment chính xác', async () => {
    (prisma.enrollment.findMany as any).mockResolvedValue([
      { userId: 'u1', plickerCardId: 1 },
      { userId: 'u2', plickerCardId: 2 },
    ]);
    (prisma.course.findUnique as any).mockResolvedValue({ id: 'course-[test]', title: 'Lớp Test' });
    (prisma.assignment.create as any).mockResolvedValue({ id: 'assign_123' });
    
    // Lưu tạm các argument của transaction vào mảng
    (prisma.$transaction as any).mockImplementation((ops: any[]) => Promise.resolve(ops));

    await plickersService.processSessionEnd(mockSession);

    // Verify
    expect(prisma.assignment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        title: '[Plickers] Test Plickers',
        starsReward: 10, // 2 questions * 5
      })
    }));

    expect(prisma.$transaction).toHaveBeenCalled();
    const ops = (prisma.$transaction as any).mock.calls[0][0];
    // Ops bao gồm 2 submission tạo mới, và những user có score > 0 sẽ được update(stars) & notification
    // User 1 đúng 1 câu -> 1 sub, 1 userUpdate, 1 noti
    // User 2 đúng 1 câu -> 1 sub, 1 userUpdate, 1 noti
    // Tổng cộng 6 thao tác DB trong Transaction
    expect(ops).toHaveLength(6);
  });

  it('TC-PLICKERS-003: Xử lý đúng nếu có user bị sai hoàn toàn cả 2 câu', async () => {
    const customSession = {
      ...mockSession,
      responses: [
        { cardNumber: 1, questionId: 'q1', answer: 'D' }, // Sai
        { cardNumber: 1, questionId: 'q2', answer: 'D' }, // Sai
      ]
    };
    (prisma.enrollment.findMany as any).mockResolvedValue([{ userId: 'u1', plickerCardId: 1 }]);
    (prisma.course.findUnique as any).mockResolvedValue({ id: 'course-[test]' });
    (prisma.assignment.create as any).mockResolvedValue({ id: 'assign_123' });

    await plickersService.processSessionEnd(customSession);
    const ops = (prisma.$transaction as any).mock.calls[0][0];
    
    // Chỉ có tạo 1 Submission (có score 0) nhưng không có thưởng sao / thông báo
    expect(ops).toHaveLength(1);
    
    // Không ai được thưởng vì sai hết
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('TC-PLICKERS-004: ACID - Ném lỗi nếu Database gặp vấn đề, bảo toàn dữ liệu', async () => {
    (prisma.course.findUnique as any).mockRejectedValueOnce(new Error('DB Connection Lost'));
    (prisma.enrollment.findMany as any).mockResolvedValue([{ userId: 'u1', plickerCardId: 1 }]);

    await expect(plickersService.processSessionEnd(mockSession)).rejects.toThrow('DB Connection Lost');
    expect(prisma.$transaction).not.toHaveBeenCalled(); // Đảm bảo chưa lưu ghi
  });
});
