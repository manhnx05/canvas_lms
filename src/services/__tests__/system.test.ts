/**
 * @vitest-environment node
 *
 * SMOKE / SANITY / PERFORMANCE / SYSTEM / REGRESSION TESTS
 *
 * Smoke    — Các chức năng cốt lõi hoạt động không bị lỗi nghiêm trọng
 * Sanity   — Kiểm tra nhanh hậu deploy: đúng đầu ra cơ bản
 * System   — Luồng end-to-end liên kết nhiều service (mock DB)
 * Regression — Các bug đã fix không tái xuất hiện
 * Performance — Thuật toán O-logic chạy đủ nhanh với dữ liệu lớn
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/prisma', () => ({
  default: {
    exam: { findUnique: vi.fn() },
    examAttempt: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    examAnswer: { createMany: vi.fn() },
    assignment: { findUnique: vi.fn(), findMany: vi.fn() },
    submission: { upsert: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

vi.mock('@/src/services/aiService', () => ({
  aiService: { evaluateSubmission: vi.fn().mockResolvedValue('AI feedback') },
}));

import { examService } from '../examService';
import { assignmentService } from '../assignmentService';
import prisma from '@/src/lib/prisma';

// ─────────────────────────────────────────────────────────────────────────────
// SMOKE — Core services khởi động và import thành công
// ─────────────────────────────────────────────────────────────────────────────
describe('[SMOKE] Core services import và shape đúng', () => {
  it('TC-SMOKE-001: examService export các method bắt buộc', () => {
    expect(typeof examService.getExams).toBe('function');
    expect(typeof examService.getExamById).toBe('function');
    expect(typeof examService.createExam).toBe('function');
    expect(typeof examService.updateExam).toBe('function');
    expect(typeof examService.deleteExam).toBe('function');
    expect(typeof examService.startExamAttempt).toBe('function');
    expect(typeof examService.submitExamAttempt).toBe('function');
    expect(typeof examService.retryExamAttempt).toBe('function');
    expect(typeof examService.getExamStatistics).toBe('function');
  });

  it('TC-SMOKE-002: assignmentService export các method bắt buộc', () => {
    expect(typeof assignmentService.getAssignments).toBe('function');
    expect(typeof assignmentService.getAssignmentById).toBe('function');
    expect(typeof assignmentService.submitAssignment).toBe('function');
    expect(typeof assignmentService.gradeAssignment).toBe('function');
    expect(typeof assignmentService.createAssignment).toBe('function');
    expect(typeof assignmentService.deleteAssignment).toBe('function');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SANITY — Kiểm tra nhanh kết quả tính điểm cơ bản
// ─────────────────────────────────────────────────────────────────────────────
describe('[SANITY] Scoring logic — kết quả cơ bản đúng', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-SANITY-001: 10/10 câu đúng → điểm = totalScore', async () => {
    const questions = Array.from({ length: 10 }, (_, i) => ({
      id: `q${i}`, answer: 'A',
    }));
    const answers = questions.map(q => ({ questionId: q.id, optionId: 'A' }));

    (prisma.examAttempt.findUnique as any).mockResolvedValue({
      id: 'at-1', userId: 'u1', status: 'in_progress',
      exam: { totalScore: 10, questions, title: 'Bài test', subject: 'Toán', standard: '' },
      user: { name: 'An' },
    });
    (prisma.examAttempt.update as any).mockImplementation((args: any) =>
      Promise.resolve({ id: 'at-1', score: args.data.score })
    );

    const result = await examService.submitExamAttempt('at-1', 'u1', answers);
    expect(result.score).toBe(10);
  });

  it('TC-SANITY-002: 0/10 câu đúng → điểm = 0', async () => {
    const questions = Array.from({ length: 10 }, (_, i) => ({
      id: `q${i}`, answer: 'A',
    }));
    const answers = questions.map(q => ({ questionId: q.id, optionId: 'D' }));

    (prisma.examAttempt.findUnique as any).mockResolvedValue({
      id: 'at-2', userId: 'u1', status: 'in_progress',
      exam: { totalScore: 10, questions, title: 'Bài test', subject: 'Toán', standard: '' },
      user: { name: 'Bình' },
    });
    (prisma.examAttempt.update as any).mockImplementation((args: any) =>
      Promise.resolve({ score: args.data.score })
    );

    const result = await examService.submitExamAttempt('at-2', 'u1', answers);
    expect(result.score).toBe(0);
  });

  it('TC-SANITY-003: điểm làm tròn đến 2 chữ số thập phân', async () => {
    const questions = Array.from({ length: 3 }, (_, i) => ({ id: `q${i}`, answer: 'A' }));
    const answers = [
      { questionId: 'q0', optionId: 'A' }, // đúng
      { questionId: 'q1', optionId: 'B' }, // sai
      { questionId: 'q2', optionId: 'B' }, // sai
    ];

    (prisma.examAttempt.findUnique as any).mockResolvedValue({
      id: 'at-3', userId: 'u1', status: 'in_progress',
      exam: { totalScore: 10, questions, title: 'B', subject: 'T', standard: '' },
      user: { name: 'C' },
    });
    (prisma.examAttempt.update as any).mockImplementation((args: any) =>
      Promise.resolve({ score: args.data.score })
    );

    const result = await examService.submitExamAttempt('at-3', 'u1', answers);
    // 1/3 * 10 = 3.333... → 3.33
    expect(result.score).toBe(3.33);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM — Luồng end-to-end: start → submit → verify score
// ─────────────────────────────────────────────────────────────────────────────
describe('[SYSTEM] End-to-end exam flow: start → submit → verify', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-SYS-001: học sinh bắt đầu đề thi published → nộp bài → nhận điểm đúng', async () => {
    const mockExam = {
      id: 'exam-sys', status: 'published', deadline: null, maxAttempts: 3, totalScore: 10,
      title: 'Đề thi cuối kỳ', subject: 'Toán', standard: 'CTGDPT2018', questions: [
        { id: 'q1', answer: 'A' },
        { id: 'q2', correctOptionId: 'B' },
        { id: 'q3', answer: 'C' },
      ],
    };

    // Step 1: startExamAttempt
    (prisma.exam.findUnique as any).mockResolvedValue(mockExam);
    (prisma.examAttempt.findFirst as any).mockResolvedValue(null);
    (prisma.examAttempt.count as any).mockResolvedValue(0);
    (prisma.examAttempt.create as any).mockResolvedValue({
      id: 'attempt-sys-1', examId: 'exam-sys', userId: 'student-1',
      status: 'in_progress', answers: [], attemptNumber: 1,
    });

    const attempt = await examService.startExamAttempt('exam-sys', 'student-1', 'student');
    expect(attempt.examId ?? attempt.id).toBeTruthy();

    // Step 2: submitExamAttempt — 2/3 đúng
    (prisma.examAttempt.findUnique as any).mockResolvedValue({
      id: 'attempt-sys-1', userId: 'student-1', status: 'in_progress',
      exam: mockExam, user: { name: 'Học sinh' },
    });
    (prisma.examAttempt.update as any).mockImplementation((args: any) =>
      Promise.resolve({ id: 'attempt-sys-1', score: args.data.score, status: 'completed' })
    );

    const submitted = await examService.submitExamAttempt('attempt-sys-1', 'student-1', [
      { questionId: 'q1', optionId: 'A' }, // đúng
      { questionId: 'q2', optionId: 'B' }, // đúng (correctOptionId)
      { questionId: 'q3', optionId: 'D' }, // sai
    ]);

    // 2/3 * 10 = 6.67
    expect(submitted.score).toBe(6.67);
    expect(submitted.status).toBe('completed');
  });

  it('TC-SYS-002: học sinh không thể nộp bài đã complete', async () => {
    (prisma.examAttempt.findUnique as any).mockResolvedValue({
      id: 'at-done', userId: 'u1', status: 'completed',
      exam: { totalScore: 10, questions: [] }, user: { name: 'X' },
    });
    await expect(
      examService.submitExamAttempt('at-done', 'u1', [])
    ).rejects.toMatchObject({ status: 400 });
  });

  it('TC-SYS-003: user B không thể nộp bài của user A', async () => {
    (prisma.examAttempt.findUnique as any).mockResolvedValue({
      id: 'at-A', userId: 'user-A', status: 'in_progress',
      exam: { totalScore: 10, questions: [] }, user: { name: 'A' },
    });
    await expect(
      examService.submitExamAttempt('at-A', 'user-B', [])
    ).rejects.toMatchObject({ status: 403 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PERFORMANCE — Scoring không bị chậm với dataset lớn
// ─────────────────────────────────────────────────────────────────────────────
describe('[PERFORMANCE] Scoring với dataset lớn', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-PERF-001: tính điểm 500 câu hỏi hoàn thành trong < 100ms', async () => {
    const N = 500;
    const questions = Array.from({ length: N }, (_, i) => ({
      id: `q${i}`, answer: i % 2 === 0 ? 'A' : 'B',
    }));
    const answers = questions.map((q, i) => ({
      questionId: q.id,
      optionId: i % 3 === 0 ? q.answer : 'D', // 1/3 đúng
    }));

    (prisma.examAttempt.findUnique as any).mockResolvedValue({
      id: 'big-attempt', userId: 'u-perf', status: 'in_progress',
      exam: { totalScore: 10, questions, title: 'Big', subject: 'X', standard: '' },
      user: { name: 'Perf Tester' },
    });
    (prisma.examAttempt.update as any).mockImplementation((args: any) =>
      Promise.resolve({ score: args.data.score })
    );

    const start = Date.now();
    await examService.submitExamAttempt('big-attempt', 'u-perf', answers);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100); // Phải chạy dưới 100ms
  });

  it('TC-PERF-002: submitAssignment với 200 câu quiz trong < 50ms (pure computation)', async () => {
    const N = 200;
    const questions = Array.from({ length: N }, (_, i) => ({
      id: `q${i}`, correctOptionId: 'A',
    }));
    const answers: Record<string, string> = {};
    questions.forEach((q, i) => { answers[q.id] = i % 2 === 0 ? 'A' : 'B'; });

    (prisma.assignment.findUnique as any).mockResolvedValue({
      id: 'a-big', title: 'Big Quiz', starsReward: 10, questions,
    });
    (prisma.user.findUnique as any).mockResolvedValue({ name: 'Tester' });
    (prisma.submission.upsert as any).mockImplementation((args: any) =>
      Promise.resolve({ score: args.create.score })
    );

    const start = Date.now();
    await assignmentService.submitAssignment('a-big', { userId: 'u-perf', answers });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(50);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// REGRESSION — Bug fixes không tái xuất hiện
// ─────────────────────────────────────────────────────────────────────────────
describe('[REGRESSION] Bug fixes không tái xuất hiện', () => {
  beforeEach(() => vi.clearAllMocks());

  /**
   * Bug: correctOptionId không được nhận diện → điểm luôn về 0
   * Fix: examService.submitExamAttempt dùng `q.answer || q.correctOptionId`
   */
  it('TC-REG-001: correctOptionId được nhận diện đúng (không bị 0 điểm)', async () => {
    (prisma.examAttempt.findUnique as any).mockResolvedValue({
      id: 'r1', userId: 'u1', status: 'in_progress',
      exam: {
        totalScore: 10,
        questions: [{ id: 'q1', correctOptionId: 'C' }], // không có `answer` field
        title: 'Regression', subject: 'T', standard: '',
      },
      user: { name: 'X' },
    });
    (prisma.examAttempt.update as any).mockImplementation((args: any) =>
      Promise.resolve({ score: args.data.score })
    );

    const result = await examService.submitExamAttempt('r1', 'u1', [
      { questionId: 'q1', optionId: 'C' },
    ]);
    expect(result.score).toBe(10); // phải = 10, không được = 0
  });

  /**
   * Bug: Division by zero khi đề thi không có câu hỏi → NaN score
   * Fix: `totalQuestions = examQuestions.length || 1`
   */
  it('TC-REG-002: đề thi 0 câu hỏi không gây NaN (division-by-zero)', async () => {
    (prisma.examAttempt.findUnique as any).mockResolvedValue({
      id: 'r2', userId: 'u1', status: 'in_progress',
      exam: { totalScore: 10, questions: [], title: 'Empty', subject: 'T', standard: '' },
      user: { name: 'X' },
    });
    (prisma.examAttempt.update as any).mockImplementation((args: any) =>
      Promise.resolve({ score: args.data.score })
    );

    const result = await examService.submitExamAttempt('r2', 'u1', []);
    expect(isNaN(result.score)).toBe(false);
    expect(result.score).toBe(0);
  });

  /**
   * Bug: empty catch block trong submitAssignment gây mất lỗi parse
   * Fix: catch (e) { console.warn(...) }
   */
  it('TC-REG-003: answers là JSON string không hợp lệ không làm crash submitAssignment', async () => {
    (prisma.assignment.findUnique as any).mockResolvedValue({
      id: 'a1', title: 'BT', questions: null,
    });
    (prisma.submission.upsert as any).mockImplementation((args: any) =>
      Promise.resolve({ answers: args.create.answers, score: null })
    );

    // Không ném lỗi, chỉ warn
    await expect(
      assignmentService.submitAssignment('a1', { userId: 'u1', answers: '{BAD JSON' })
    ).resolves.toBeDefined();
  });

  /**
   * Bug: user khác có thể nộp bài không phải của mình
   * Fix: check `attempt.userId !== userId`
   */
  it('TC-REG-004: user không thể nộp bài của người khác (authorization check)', async () => {
    (prisma.examAttempt.findUnique as any).mockResolvedValue({
      id: 'r4', userId: 'owner-A', status: 'in_progress',
      exam: { totalScore: 10, questions: [] }, user: { name: 'A' },
    });
    await expect(
      examService.submitExamAttempt('r4', 'attacker-B', [])
    ).rejects.toMatchObject({ status: 403, message: 'Không có quyền nộp bài này' });
  });

  /**
   * Bug: student có thể làm đề thi draft
   * Fix: check `exam.status !== 'published'` cho student
   */
  it('TC-REG-005: student không thể bắt đầu đề thi draft', async () => {
    (prisma.exam.findUnique as any).mockResolvedValue({
      id: 'draft-exam', status: 'draft', deadline: null, maxAttempts: 1, questions: [],
    });
    await expect(
      examService.startExamAttempt('draft-exam', 'student-1', 'student')
    ).rejects.toMatchObject({ status: 403 });
  });

  /**
   * Bug: student có thể làm đề thi quá deadline
   * Fix: check `exam.deadline && new Date() > new Date(exam.deadline)`
   */
  it('TC-REG-006: student không thể bắt đầu đề thi đã hết deadline', async () => {
    (prisma.exam.findUnique as any).mockResolvedValue({
      id: 'expired-exam',
      status: 'published',
      deadline: new Date(Date.now() - 3600_000).toISOString(), // 1 tiếng trước
      maxAttempts: 3,
      questions: [],
    });
    await expect(
      examService.startExamAttempt('expired-exam', 'u1', 'student')
    ).rejects.toMatchObject({ status: 403 });
  });
});
