/**
 * @vitest-environment node
 *
 * UNIT & INTEGRATION TESTS — assignmentService
 * Coverage: getAssignments, getAssignmentById, submitAssignment, gradeAssignment, createAssignment, deleteAssignment
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/prisma', () => ({
  default: {
    assignment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    submission: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/src/services/aiService', () => ({
  aiService: {
    evaluateSubmission: vi.fn(),
  },
}));

import { assignmentService } from '../assignmentService';
import prisma from '@/src/lib/prisma';
import { aiService } from '@/src/services/aiService';

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — getAssignments
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] assignmentService.getAssignments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-ASSIGN-001: trả về danh sách bài tập của khóa học', async () => {
    const mockData = [
      { id: 'a1', title: 'BT1', courseId: 'c1', submissions: [], _count: { submissions: 0 } },
    ];
    (prisma.assignment.findMany as any).mockResolvedValue(mockData);

    const result = await assignmentService.getAssignments({ courseId: 'c1' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a1');
    expect(prisma.assignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { courseId: 'c1' } })
    );
  });

  it('TC-ASSIGN-002: khi có userId, map mySubmission vào từng assignment', async () => {
    const mockData = [
      { id: 'a1', title: 'BT1', courseId: 'c1', submissions: [{ id: 's1', userId: 'u1' }], _count: { submissions: 1 } },
    ];
    (prisma.assignment.findMany as any).mockResolvedValue(mockData);

    const result = await assignmentService.getAssignments({ userId: 'u1' });
    expect(result[0].mySubmission).toEqual({ id: 's1', userId: 'u1' });
    // submissions field phải được set undefined
    expect(result[0].submissions).toBeUndefined();
  });

  it('TC-ASSIGN-003: khi không có userId, mySubmission là undefined', async () => {
    (prisma.assignment.findMany as any).mockResolvedValue([
      { id: 'a1', title: 'BT1', submissions: [], _count: { submissions: 0 } },
    ]);
    const result = await assignmentService.getAssignments({});
    expect(result[0].mySubmission).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — getAssignmentById
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] assignmentService.getAssignmentById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-ASSIGN-004: trả về assignment khi tìm thấy', async () => {
    (prisma.assignment.findUnique as any).mockResolvedValue({
      id: 'a1', title: 'BT1', submissions: []
    });
    const result = await assignmentService.getAssignmentById('a1');
    expect(result.id).toBe('a1');
  });

  it('TC-ASSIGN-005: ném HttpError 404 khi không tìm thấy assignment', async () => {
    (prisma.assignment.findUnique as any).mockResolvedValue(null);
    await expect(assignmentService.getAssignmentById('not-exist')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('TC-ASSIGN-006: gắn mySubmission của userId cụ thể', async () => {
    (prisma.assignment.findUnique as any).mockResolvedValue({
      id: 'a1',
      title: 'BT1',
      submissions: [
        { id: 's1', userId: 'u-target' },
        { id: 's2', userId: 'u-other' },
      ],
    });
    const result = await assignmentService.getAssignmentById('a1', 'u-target');
    expect(result.mySubmission?.id).toBe('s1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — submitAssignment
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] assignmentService.submitAssignment', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-ASSIGN-007: ném HttpError 400 khi thiếu userId', async () => {
    await expect(
      assignmentService.submitAssignment('a1', { answers: {} })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('TC-ASSIGN-008: ném HttpError 404 khi assignment không tồn tại', async () => {
    (prisma.assignment.findUnique as any).mockResolvedValue(null);
    await expect(
      assignmentService.submitAssignment('a1', { userId: 'u1' })
    ).rejects.toMatchObject({ status: 404 });
  });

  it('TC-ASSIGN-009: tính điểm ĐÚNG cho bài quiz trắc nghiệm (1/2 câu đúng → 50% điểm)', async () => {
    const mockAssignment = {
      id: 'a1',
      title: 'Quiz',
      starsReward: 10,
      questions: [
        { id: 'q1', correctOptionId: 'A' },
        { id: 'q2', correctOptionId: 'B' },
      ],
    };
    (prisma.assignment.findUnique as any).mockResolvedValue(mockAssignment);
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', name: 'Nam' });
    (aiService.evaluateSubmission as any).mockResolvedValue('Tốt lắm!');
    (prisma.submission.upsert as any).mockImplementation((args: any) =>
      Promise.resolve({ id: 'sub-1', score: args.create.score, status: args.create.status })
    );

    const result = await assignmentService.submitAssignment('a1', {
      userId: 'u1',
      answers: { q1: 'A', q2: 'C' }, // q1 đúng, q2 sai
    });

    expect(result.score).toBe(5); // 1/2 * 10 = 5
  });

  it('TC-ASSIGN-010: tính điểm ĐÚNG khi tất cả câu trả lời đúng → điểm tối đa', async () => {
    const qs = [
      { id: 'q1', answer: 'A' },
      { id: 'q2', answer: 'C' },
    ];
    (prisma.assignment.findUnique as any).mockResolvedValue({
      id: 'a1', title: 'Q', starsReward: 10, questions: qs,
    });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', name: 'Lan' });
    (aiService.evaluateSubmission as any).mockResolvedValue('Xuất sắc!');
    (prisma.submission.upsert as any).mockImplementation((args: any) =>
      Promise.resolve({ score: args.create.score })
    );

    const result = await assignmentService.submitAssignment('a1', {
      userId: 'u1',
      answers: { q1: 'A', q2: 'C' },
    });
    expect(result.score).toBe(10);
  });

  it('TC-ASSIGN-011: nộp bài không có câu hỏi (essay) → score = null, status = submitted', async () => {
    (prisma.assignment.findUnique as any).mockResolvedValue({
      id: 'a1', title: 'Essay', starsReward: 10, questions: null,
    });
    (prisma.submission.upsert as any).mockImplementation((args: any) =>
      Promise.resolve({ score: args.create.score, status: args.create.status })
    );

    const result = await assignmentService.submitAssignment('a1', {
      userId: 'u1',
    });
    expect(result.score).toBeNull();
    expect(result.status).toBe('submitted');
  });

  it('TC-ASSIGN-012: fileUrl được merge vào answers', async () => {
    (prisma.assignment.findUnique as any).mockResolvedValue({
      id: 'a1', title: 'File Assignment', questions: null,
    });
    (prisma.submission.upsert as any).mockImplementation((args: any) =>
      Promise.resolve({ answers: args.create.answers })
    );

    const result = await assignmentService.submitAssignment('a1', {
      userId: 'u1',
      fileUrl: '/uploads/hw.pdf',
    });
    expect(result.answers).toMatchObject({ fileUrl: '/uploads/hw.pdf' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — gradeAssignment
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] assignmentService.gradeAssignment', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-ASSIGN-013: cập nhật điểm submission khi có submissionId', async () => {
    (prisma.submission.update as any).mockResolvedValue({});
    (prisma.assignment.findUnique as any).mockResolvedValue({ id: 'a1', starsReward: 10 });
    (prisma.assignment.update as any).mockResolvedValue({ id: 'a1', status: 'graded', starsReward: 8 });

    const result = await assignmentService.gradeAssignment('a1', {
      stars: '8',
      feedback: 'Tốt',
      submissionId: 'sub-1',
    });

    expect(prisma.submission.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sub-1' } })
    );
    expect(result.starsReward).toBe(8);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — createAssignment & deleteAssignment
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] assignmentService.createAssignment', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-ASSIGN-014: tạo bài tập mới với status = pending', async () => {
    (prisma.assignment.create as any).mockResolvedValue({
      id: 'new-1', title: 'BT Mới', status: 'pending', starsReward: 5,
    });

    const result = await assignmentService.createAssignment({
      title: 'BT Mới', courseId: 'c1', starsReward: '5',
    });
    expect(result.status).toBe('pending');
    expect(result.starsReward).toBe(5);
  });

  it('TC-ASSIGN-015: starsReward không hợp lệ → mặc định 0', async () => {
    (prisma.assignment.create as any).mockImplementation((args: any) =>
      Promise.resolve({ starsReward: args.data.starsReward })
    );

    const result = await assignmentService.createAssignment({
      title: 'BT', starsReward: 'abc',
    });
    expect(result.starsReward).toBe(0);
  });
});

describe('[UNIT] assignmentService.deleteAssignment', () => {
  it('TC-ASSIGN-016: xóa assignment theo id thành công', async () => {
    (prisma.assignment.delete as any).mockResolvedValue({ id: 'a1' });
    const result = await assignmentService.deleteAssignment('a1');
    expect(result.id).toBe('a1');
    expect(prisma.assignment.delete).toHaveBeenCalledWith({ where: { id: 'a1' } });
  });
});
