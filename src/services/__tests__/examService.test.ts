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
    examAttempt: {
      findUnique: vi.fn(),
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

describe('examService.submitExamAttempt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('phải tính toán đúng số điểm khi câu hỏi dùng correctOptionId', async () => {
    const mockAttemptId = 'attempt-1';
    const mockUserId = 'user-1';
    
    // Giả lập đề thi có 2 câu, 1 câu dùng 'answer', 1 câu dùng 'correctOptionId'
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

    const mockAnswers = [
      { questionId: 'q1', optionId: 'A' }, // Đúng
      { questionId: 'q2', optionId: 'B' }  // Đúng (theo correctOptionId)
    ];

    (aiService.evaluateSubmission as any).mockResolvedValue('Good job');

    (prisma.examAttempt.update as any).mockImplementation((args: any) => Promise.resolve({
       id: mockAttemptId,
       score: args.data.score
    }));

    const result = await examService.submitExamAttempt(mockAttemptId, mockUserId, mockAnswers);

    // Điểm phải là 10 vì học sinh đã làm đúng cả 2 câu
    expect(result.score).toBe(10);
    
    // Xác minh Prisma được gọi lưu kết quả học sinh trả lời đúng cả 2 (isCorrect = true)
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

    const mockAnswers = [
      { questionId: 'q1', optionId: 'A' }, // Đúng
      { questionId: 'q2', optionId: 'D' }  // Sai
    ];

    (aiService.evaluateSubmission as any).mockResolvedValue('Need improve');
    
    (prisma.examAttempt.update as any).mockImplementation((args: any) => Promise.resolve({
       id: mockAttemptId,
       score: args.data.score
    }));

    const result = await examService.submitExamAttempt(mockAttemptId, mockUserId, mockAnswers);

    // Đúng 1/2 câu = 5 điểm
    expect(result.score).toBe(5);
    
    // Câu 2 phải được đánh dấu là sai (isCorrect: false)
    expect(prisma.examAnswer.createMany).toHaveBeenCalledWith({
      data: [
        { attemptId: mockAttemptId, questionId: 'q1', optionId: 'A', isCorrect: true },
        { attemptId: mockAttemptId, questionId: 'q2', optionId: 'D', isCorrect: false }
      ]
    });
  });
});
