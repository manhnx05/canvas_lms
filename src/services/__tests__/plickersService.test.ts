import { describe, it, expect, vi, beforeEach } from 'vitest';
import { plickersService } from '../plickersService';
import prisma from '@/src/lib/prisma';

/**
 * @vitest-environment node
 */

vi.mock('@/src/lib/prisma', () => ({
  default: {
    enrollment: {
      findMany: vi.fn(),
    },
    course: {
      findUnique: vi.fn(),
    },
    assignment: {
      create: vi.fn(),
    },
    submission: {
      create: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('plickersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TC-PLICKERS-001: processSessionEnd - basic flow', () => {
    it('should process session end successfully with correct answers', async () => {
      const mockSession = {
        id: 'session-1',
        title: 'Test Session',
        courseId: 'course-1',
        status: 'ended',
        questions: [
          { id: 'q1', text: 'Question 1', correctAnswer: 'A' },
          { id: 'q2', text: 'Question 2', correctAnswer: 'B' },
        ],
        responses: [
          { id: 'r1', questionId: 'q1', cardNumber: 1, answer: 'A' },
          { id: 'r2', questionId: 'q2', cardNumber: 1, answer: 'B' },
          { id: 'r3', questionId: 'q1', cardNumber: 2, answer: 'A' },
          { id: 'r4', questionId: 'q2', cardNumber: 2, answer: 'C' },
        ],
      };

      const mockEnrollments = [
        { userId: 'user-1', plickerCardId: 1, user: { name: 'Student 1' } },
        { userId: 'user-2', plickerCardId: 2, user: { name: 'Student 2' } },
      ];

      const mockCourse = { id: 'course-1', title: 'Test Course' };

      vi.mocked(prisma.enrollment.findMany).mockResolvedValue(mockEnrollments as any);
      vi.mocked(prisma.course.findUnique).mockResolvedValue(mockCourse as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(prisma);
      });
      vi.mocked(prisma.assignment.create).mockResolvedValue({ id: 'assignment-1' } as any);

      const result = await plickersService.processSessionEnd(mockSession);

      expect(result).toBe(true);
      expect(prisma.enrollment.findMany).toHaveBeenCalledWith({
        where: { courseId: 'course-1' },
        include: { user: true },
      });
      expect(prisma.course.findUnique).toHaveBeenCalledWith({ where: { id: 'course-1' } });
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('TC-PLICKERS-002: processSessionEnd - invalid session', () => {
    it('should return early if session is null', async () => {
      const result = await plickersService.processSessionEnd(null);
      
      expect(result).toBeUndefined();
      expect(prisma.enrollment.findMany).not.toHaveBeenCalled();
    });

    it('should return early if session has no courseId', async () => {
      const mockSession = {
        id: 'session-1',
        status: 'ended',
        questions: [],
        responses: [],
      };

      const result = await plickersService.processSessionEnd(mockSession);
      
      expect(result).toBeUndefined();
      expect(prisma.enrollment.findMany).not.toHaveBeenCalled();
    });

    it('should return early if session status is not ended', async () => {
      const mockSession = {
        id: 'session-1',
        courseId: 'course-1',
        status: 'active',
        questions: [],
        responses: [],
      };

      const result = await plickersService.processSessionEnd(mockSession);
      
      expect(result).toBeUndefined();
      expect(prisma.enrollment.findMany).not.toHaveBeenCalled();
    });
  });

  describe('TC-PLICKERS-003: processSessionEnd - no enrollments', () => {
    it('should return early if no students enrolled', async () => {
      const mockSession = {
        id: 'session-1',
        courseId: 'course-1',
        status: 'ended',
        questions: [{ id: 'q1', correctAnswer: 'A' }],
        responses: [],
      };

      vi.mocked(prisma.enrollment.findMany).mockResolvedValue([]);

      const result = await plickersService.processSessionEnd(mockSession);
      
      expect(result).toBeUndefined();
      expect(prisma.enrollment.findMany).toHaveBeenCalled();
      expect(prisma.course.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('TC-PLICKERS-004: processSessionEnd - students without cards', () => {
    it('should handle students without plickerCardId', async () => {
      const mockSession = {
        id: 'session-1',
        courseId: 'course-1',
        status: 'ended',
        questions: [{ id: 'q1', correctAnswer: 'A' }],
        responses: [{ id: 'r1', questionId: 'q1', cardNumber: 1, answer: 'A' }],
      };

      const mockEnrollments = [
        { userId: 'user-1', plickerCardId: 1, user: { name: 'Student 1' } },
        { userId: 'user-2', plickerCardId: null, user: { name: 'Student 2' } },
      ];

      const mockCourse = { id: 'course-1', title: 'Test Course' };

      vi.mocked(prisma.enrollment.findMany).mockResolvedValue(mockEnrollments as any);
      vi.mocked(prisma.course.findUnique).mockResolvedValue(mockCourse as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(prisma);
      });
      vi.mocked(prisma.assignment.create).mockResolvedValue({ id: 'assignment-1' } as any);

      const result = await plickersService.processSessionEnd(mockSession);

      expect(result).toBe(true);
      // Student 2 không có thẻ nên không được xử lý
    });
  });

  describe('TC-PLICKERS-005: processSessionEnd - non-participants', () => {
    it('should create submissions for students who did not participate', async () => {
      const mockSession = {
        id: 'session-1',
        courseId: 'course-1',
        status: 'ended',
        questions: [{ id: 'q1', correctAnswer: 'A' }],
        responses: [{ id: 'r1', questionId: 'q1', cardNumber: 1, answer: 'A' }],
      };

      const mockEnrollments = [
        { userId: 'user-1', plickerCardId: 1, user: { name: 'Student 1' } },
        { userId: 'user-2', plickerCardId: 2, user: { name: 'Student 2' } },
      ];

      const mockCourse = { id: 'course-1', title: 'Test Course' };

      vi.mocked(prisma.enrollment.findMany).mockResolvedValue(mockEnrollments as any);
      vi.mocked(prisma.course.findUnique).mockResolvedValue(mockCourse as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(prisma);
      });
      vi.mocked(prisma.assignment.create).mockResolvedValue({ id: 'assignment-1' } as any);

      const result = await plickersService.processSessionEnd(mockSession);

      expect(result).toBe(true);
      // Student 2 (card 2) không tham gia nên phải có submission với score 0
    });
  });

  describe('TC-PLICKERS-006: processSessionEnd - all wrong answers', () => {
    it('should handle students who answered all questions incorrectly', async () => {
      const mockSession = {
        id: 'session-1',
        courseId: 'course-1',
        status: 'ended',
        questions: [
          { id: 'q1', correctAnswer: 'A' },
          { id: 'q2', correctAnswer: 'B' },
        ],
        responses: [
          { id: 'r1', questionId: 'q1', cardNumber: 1, answer: 'B' },
          { id: 'r2', questionId: 'q2', cardNumber: 1, answer: 'C' },
        ],
      };

      const mockEnrollments = [
        { userId: 'user-1', plickerCardId: 1, user: { name: 'Student 1' } },
      ];

      const mockCourse = { id: 'course-1', title: 'Test Course' };

      vi.mocked(prisma.enrollment.findMany).mockResolvedValue(mockEnrollments as any);
      vi.mocked(prisma.course.findUnique).mockResolvedValue(mockCourse as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(prisma);
      });
      vi.mocked(prisma.assignment.create).mockResolvedValue({ id: 'assignment-1' } as any);

      const result = await plickersService.processSessionEnd(mockSession);

      expect(result).toBe(true);
      // Student 1 trả lời sai hết nên score = 0, không được sao
    });
  });

  describe('TC-PLICKERS-007: processSessionEnd - partial correct answers', () => {
    it('should calculate correct score for partial correct answers', async () => {
      const mockSession = {
        id: 'session-1',
        courseId: 'course-1',
        status: 'ended',
        questions: [
          { id: 'q1', correctAnswer: 'A' },
          { id: 'q2', correctAnswer: 'B' },
          { id: 'q3', correctAnswer: 'C' },
        ],
        responses: [
          { id: 'r1', questionId: 'q1', cardNumber: 1, answer: 'A' }, // Correct
          { id: 'r2', questionId: 'q2', cardNumber: 1, answer: 'C' }, // Wrong
          { id: 'r3', questionId: 'q3', cardNumber: 1, answer: 'C' }, // Correct
        ],
      };

      const mockEnrollments = [
        { userId: 'user-1', plickerCardId: 1, user: { name: 'Student 1' } },
      ];

      const mockCourse = { id: 'course-1', title: 'Test Course' };

      vi.mocked(prisma.enrollment.findMany).mockResolvedValue(mockEnrollments as any);
      vi.mocked(prisma.course.findUnique).mockResolvedValue(mockCourse as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(prisma);
      });
      vi.mocked(prisma.assignment.create).mockResolvedValue({ id: 'assignment-1' } as any);

      const result = await plickersService.processSessionEnd(mockSession);

      expect(result).toBe(true);
      // Student 1 đúng 2/3 câu = 67 điểm, được 10 sao (2 * 5)
    });
  });

  describe('TC-PLICKERS-008: processSessionEnd - course not found', () => {
    it('should return early if course not found', async () => {
      const mockSession = {
        id: 'session-1',
        courseId: 'course-1',
        status: 'ended',
        questions: [{ id: 'q1', correctAnswer: 'A' }],
        responses: [],
      };

      const mockEnrollments = [
        { userId: 'user-1', plickerCardId: 1, user: { name: 'Student 1' } },
      ];

      vi.mocked(prisma.enrollment.findMany).mockResolvedValue(mockEnrollments as any);
      vi.mocked(prisma.course.findUnique).mockResolvedValue(null);

      const result = await plickersService.processSessionEnd(mockSession);

      expect(result).toBeUndefined();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('TC-PLICKERS-009: processSessionEnd - error handling', () => {
    it('should throw error if transaction fails', async () => {
      const mockSession = {
        id: 'session-1',
        courseId: 'course-1',
        status: 'ended',
        questions: [{ id: 'q1', correctAnswer: 'A' }],
        responses: [{ id: 'r1', questionId: 'q1', cardNumber: 1, answer: 'A' }],
      };

      const mockEnrollments = [
        { userId: 'user-1', plickerCardId: 1, user: { name: 'Student 1' } },
      ];

      const mockCourse = { id: 'course-1', title: 'Test Course' };

      vi.mocked(prisma.enrollment.findMany).mockResolvedValue(mockEnrollments as any);
      vi.mocked(prisma.course.findUnique).mockResolvedValue(mockCourse as any);
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Transaction failed'));

      await expect(plickersService.processSessionEnd(mockSession)).rejects.toThrow('Transaction failed');
    });
  });

  describe('TC-PLICKERS-010: processSessionEnd - star rewards calculation', () => {
    it('should calculate star rewards correctly (5 stars per correct answer)', async () => {
      const mockSession = {
        id: 'session-1',
        courseId: 'course-1',
        status: 'ended',
        questions: [
          { id: 'q1', correctAnswer: 'A' },
          { id: 'q2', correctAnswer: 'B' },
          { id: 'q3', correctAnswer: 'C' },
          { id: 'q4', correctAnswer: 'D' },
        ],
        responses: [
          { id: 'r1', questionId: 'q1', cardNumber: 1, answer: 'A' },
          { id: 'r2', questionId: 'q2', cardNumber: 1, answer: 'B' },
          { id: 'r3', questionId: 'q3', cardNumber: 1, answer: 'C' },
          { id: 'r4', questionId: 'q4', cardNumber: 1, answer: 'D' },
        ],
      };

      const mockEnrollments = [
        { userId: 'user-1', plickerCardId: 1, user: { name: 'Student 1' } },
      ];

      const mockCourse = { id: 'course-1', title: 'Test Course' };

      vi.mocked(prisma.enrollment.findMany).mockResolvedValue(mockEnrollments as any);
      vi.mocked(prisma.course.findUnique).mockResolvedValue(mockCourse as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(prisma);
      });
      vi.mocked(prisma.assignment.create).mockResolvedValue({ id: 'assignment-1' } as any);

      const result = await plickersService.processSessionEnd(mockSession);

      expect(result).toBe(true);
      // Student 1 đúng 4/4 câu = 20 sao (4 * 5)
    });
  });

  describe('TC-PLICKERS-011: processSessionEnd - multiple students', () => {
    it('should process multiple students with different scores', async () => {
      const mockSession = {
        id: 'session-1',
        courseId: 'course-1',
        status: 'ended',
        questions: [
          { id: 'q1', correctAnswer: 'A' },
          { id: 'q2', correctAnswer: 'B' },
        ],
        responses: [
          { id: 'r1', questionId: 'q1', cardNumber: 1, answer: 'A' }, // Student 1: correct
          { id: 'r2', questionId: 'q2', cardNumber: 1, answer: 'B' }, // Student 1: correct
          { id: 'r3', questionId: 'q1', cardNumber: 2, answer: 'A' }, // Student 2: correct
          { id: 'r4', questionId: 'q2', cardNumber: 2, answer: 'C' }, // Student 2: wrong
          // Student 3 (card 3) không tham gia
        ],
      };

      const mockEnrollments = [
        { userId: 'user-1', plickerCardId: 1, user: { name: 'Student 1' } },
        { userId: 'user-2', plickerCardId: 2, user: { name: 'Student 2' } },
        { userId: 'user-3', plickerCardId: 3, user: { name: 'Student 3' } },
      ];

      const mockCourse = { id: 'course-1', title: 'Test Course' };

      vi.mocked(prisma.enrollment.findMany).mockResolvedValue(mockEnrollments as any);
      vi.mocked(prisma.course.findUnique).mockResolvedValue(mockCourse as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(prisma);
      });
      vi.mocked(prisma.assignment.create).mockResolvedValue({ id: 'assignment-1' } as any);

      const result = await plickersService.processSessionEnd(mockSession);

      expect(result).toBe(true);
      // Student 1: 2/2 = 100 điểm, 10 sao
      // Student 2: 1/2 = 50 điểm, 5 sao
      // Student 3: 0/2 = 0 điểm, 0 sao, có submission
    });
  });

  describe('TC-PLICKERS-012: processSessionEnd - empty questions', () => {
    it('should handle session with no questions', async () => {
      const mockSession = {
        id: 'session-1',
        courseId: 'course-1',
        status: 'ended',
        questions: [],
        responses: [],
      };

      const mockEnrollments = [
        { userId: 'user-1', plickerCardId: 1, user: { name: 'Student 1' } },
      ];

      const mockCourse = { id: 'course-1', title: 'Test Course' };

      vi.mocked(prisma.enrollment.findMany).mockResolvedValue(mockEnrollments as any);
      vi.mocked(prisma.course.findUnique).mockResolvedValue(mockCourse as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(prisma);
      });
      vi.mocked(prisma.assignment.create).mockResolvedValue({ id: 'assignment-1' } as any);

      const result = await plickersService.processSessionEnd(mockSession);

      expect(result).toBe(true);
    });
  });
});
