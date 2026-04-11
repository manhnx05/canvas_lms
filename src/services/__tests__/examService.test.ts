/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { examService } from '../examService';
import prisma from '@/src/lib/prisma';
import { aiService } from '@/src/services/aiService';

// Mock dependencies
vi.mock('@/src/lib/prisma', () => ({
  default: {
    exam: {
      findUnique: vi.fn(),
    },
    examAttempt: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    examAnswer: {
      createMany: vi.fn(),
    }
  }
}));

vi.mock('@/src/services/aiService', () => ({
  aiService: {
    evaluateSubmission: vi.fn(),
  }
}));

// ────────────────────────────────────────
// submitExamAttempt
// ────────────────────────────────────────
describe('examService.submitExamAttempt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('phải tính toán đúng số điểm khi câu hỏi dùng correctOptionId', async () => {
    const mockAttemptId = 'attempt-1';
    const mockUserId = 'user-1';
    
    (prisma.examAttempt.findUnique as any).mockResolvedValue({
      id: mockAttemptId,
      userId: mockUserId,
      status: 'in_progress',
      exam: {
        totalScore: 10,
        questions: [
          { id: 'q1', answer: 'A' },
          { id: 'q2', correctOptionId: 'B' }
        ]
      },
      user: { name: 'Student 1' }
    });

    (aiService.evaluateSubmission as any).mockResolvedValue('Good job');

    (prisma.examAttempt.update as any).mockImplementation((args: any) => Promise.resolve({
       id: mockAttemptId,
       score: args.data.score
    }));

    const result = await examService.submitExamAttempt(mockAttemptId, mockUserId, [
      { questionId: 'q1', optionId: 'A' }, // Đúng
      { questionId: 'q2', optionId: 'B' }  // Đúng (theo correctOptionId)
    ]);

    expect(result.score).toBe(10);
    expect(prisma.examAnswer.createMany).toHaveBeenCalledWith({
      data: [
        { attemptId: mockAttemptId, questionId: 'q1', optionId: 'A', isCorrect: true },
        { attemptId: mockAttemptId, questionId: 'q2', optionId: 'B', isCorrect: true }
      ]
    });
  });

  it('phải tính đúng số điểm khi học sinh trả lời sai', async () => {
    const mockAttemptId = 'attempt-1';
    const mockUserId = 'user-1';
    
    (prisma.examAttempt.findUnique as any).mockResolvedValue({
      id: mockAttemptId,
      userId: mockUserId,
      status: 'in_progress',
      exam: {
        totalScore: 10,
        questions: [
          { id: 'q1', answer: 'A' },
          { id: 'q2', correctOptionId: 'C' }
        ]
      },
      user: { name: 'Student 1' }
    });

    (aiService.evaluateSubmission as any).mockResolvedValue('Need improve');
    
    (prisma.examAttempt.update as any).mockImplementation((args: any) => Promise.resolve({
       id: mockAttemptId,
       score: args.data.score
    }));

    const result = await examService.submitExamAttempt(mockAttemptId, mockUserId, [
      { questionId: 'q1', optionId: 'A' }, // Đúng
      { questionId: 'q2', optionId: 'D' }  // Sai
    ]);

    expect(result.score).toBe(5);
    expect(prisma.examAnswer.createMany).toHaveBeenCalledWith({
      data: [
        { attemptId: mockAttemptId, questionId: 'q1', optionId: 'A', isCorrect: true },
        { attemptId: mockAttemptId, questionId: 'q2', optionId: 'D', isCorrect: false }
      ]
    });
  });

  it('phải từ chối nộp bài nếu bài đã được nộp trước đó', async () => {
    (prisma.examAttempt.findUnique as any).mockResolvedValue({
      id: 'attempt-1',
      userId: 'user-1',
      status: 'completed',
      exam: { totalScore: 10, questions: [] },
      user: { name: 'Student 1' }
    });

    await expect(
      examService.submitExamAttempt('attempt-1', 'user-1', [])
    ).rejects.toThrow('Bài thi này đã được nộp');
  });

  it('phải từ chối nếu user khác cố nộp bài không phải của mình', async () => {
    (prisma.examAttempt.findUnique as any).mockResolvedValue({
      id: 'attempt-1',
      userId: 'user-A',
      status: 'in_progress',
      exam: { totalScore: 10, questions: [] },
      user: { name: 'Student A' }
    });

    await expect(
      examService.submitExamAttempt('attempt-1', 'user-B', [])
    ).rejects.toThrow('Không có quyền nộp bài này');
  });
});

// ────────────────────────────────────────
// startExamAttempt
// ────────────────────────────────────────
describe('examService.startExamAttempt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockExam = {
    id: 'exam-1',
    status: 'published',
    deadline: null,
    maxAttempts: 2,
    questions: []
  };

  it('phải cho phép học sinh bắt đầu đề thi đang published', async () => {
    (prisma.exam.findUnique as any).mockResolvedValue(mockExam);
    (prisma.examAttempt.findFirst as any).mockResolvedValue(null);
    (prisma.examAttempt.count as any).mockResolvedValue(1);
    (prisma.examAttempt.create as any).mockResolvedValue({
      id: 'at-1', examId: 'exam-1', userId: 'u-1', status: 'in_progress', answers: []
    });

    const result = await examService.startExamAttempt('exam-1', 'u-1', 'student');
    expect(result.maxAttempts).toBe(2);
  });

  it('phải từ chối học sinh khi đề thi là draft', async () => {
    (prisma.exam.findUnique as any).mockResolvedValue({ ...mockExam, status: 'draft' });

    await expect(
      examService.startExamAttempt('exam-1', 'u-1', 'student')
    ).rejects.toThrow('Bài thi chưa được công khai');
  });

  it('phải cho phép giáo viên xem thử đề thi draft', async () => {
    (prisma.exam.findUnique as any).mockResolvedValue({ ...mockExam, status: 'draft' });
    (prisma.examAttempt.findFirst as any).mockResolvedValue(null);
    (prisma.examAttempt.count as any).mockResolvedValue(1);
    (prisma.examAttempt.create as any).mockResolvedValue({
      id: 'at-2', examId: 'exam-1', userId: 'teacher-1', status: 'in_progress', answers: []
    });

    const result = await examService.startExamAttempt('exam-1', 'teacher-1', 'teacher');
    expect(result).toBeDefined();
  });

  it('phải từ chối học sinh khi đề thi đã quá hạn', async () => {
    const pastDeadline = new Date(Date.now() - 60_000).toISOString();
    (prisma.exam.findUnique as any).mockResolvedValue({ ...mockExam, deadline: pastDeadline });

    await expect(
      examService.startExamAttempt('exam-1', 'u-1', 'student')
    ).rejects.toThrow('Bài thi đã hết hạn');
  });
});
