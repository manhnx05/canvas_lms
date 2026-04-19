/**
 * @vitest-environment node
 *
 * UNIT TESTS — teacherService
 * Coverage: getStats, getTeacherStats, getStudentStats, getCourseSubmissions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/prisma', () => ({
  default: {
    enrollment: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    submission: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      count: vi.fn(),
      findUnique: vi.fn(),
      groupBy: vi.fn(),
    },
    course: {
      count: vi.fn(),
    },
    assignment: {
      count: vi.fn(),
    },
  },
}));

import { teacherService } from '../teacherService';
import prisma from '@/src/lib/prisma';

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — getStats
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] teacherService.getStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-TEACHER-001: trả về global stats khi không có userId', async () => {
    (prisma.user.count as any).mockResolvedValue(100);
    (prisma.submission.count as any).mockResolvedValue(25);
    (prisma.course.count as any).mockResolvedValue(10);
    (prisma.assignment.count as any).mockResolvedValue(50);

    const result = await teacherService.getStats();
    expect(result).toEqual({
      totalStudents: 100,
      pendingGrading: 25,
      totalCourses: 10,
      totalAssignments: 50,
    });
  });

  it('TC-TEACHER-002: trả về teacher-specific stats khi có userId', async () => {
    (prisma.enrollment.findMany as any).mockResolvedValue([
      { courseId: 'c1', course: { id: 'c1' } },
      { courseId: 'c2', course: { id: 'c2' } },
    ]);
    (prisma.enrollment.count as any).mockResolvedValue(45);
    (prisma.submission.count as any).mockResolvedValue(12);
    (prisma.assignment.count as any).mockResolvedValue(30);

    const result = await teacherService.getStats('teacher-1');
    expect(result.totalCourses).toBe(2);
    expect(result.totalStudents).toBe(45);
    expect(result.pendingGrading).toBe(12);
    expect(result.totalAssignments).toBe(30);
  });

  it('TC-TEACHER-003: trả về stats = 0 khi teacher không có courses', async () => {
    (prisma.enrollment.findMany as any).mockResolvedValue([]);
    (prisma.enrollment.count as any).mockResolvedValue(0);
    (prisma.submission.count as any).mockResolvedValue(0);
    (prisma.assignment.count as any).mockResolvedValue(0);

    const result = await teacherService.getStats('teacher-no-course');
    expect(result.totalCourses).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — getTeacherStats
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] teacherService.getTeacherStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-TEACHER-004: ném HttpError 400 khi thiếu teacherId', async () => {
    await expect(teacherService.getTeacherStats('')).rejects.toMatchObject({
      status: 400,
      message: 'Missing teacherId',
    });
  });

  it('TC-TEACHER-005: trả về stats đầy đủ cho teacher', async () => {
    (prisma.enrollment.findMany as any).mockResolvedValue([
      { courseId: 'c1', course: { id: 'c1' } },
    ]);
    (prisma.user.count as any).mockResolvedValue(30);
    (prisma.submission.count as any).mockResolvedValue(5);
    (prisma.assignment.count as any).mockResolvedValue(15);
    (prisma.user.groupBy as any).mockResolvedValue([
      { className: '3A', _count: { id: 20 } },
      { className: '3B', _count: { id: 15 } },
    ]);

    const result = await teacherService.getTeacherStats('t1');
    expect(result.totalStudents).toBe(30);
    expect(result.pendingGrading).toBe(5);
    expect(result.totalCourses).toBe(1);
    expect(result.totalAssignments).toBe(15);
    expect(result.studentsByClass!).toHaveLength(2);
    expect(result.studentsByClass![0].name).toBe('3A');
    expect(result.completionRate).toBe(85);
    expect(result.activityTrend).toHaveLength(7);
  });

  it('TC-TEACHER-006: trả về stats = 0 khi teacher không có courses', async () => {
    (prisma.enrollment.findMany as any).mockResolvedValue([]);
    const result = await teacherService.getTeacherStats('t-no-course');
    expect(result).toEqual({
      totalStudents: 0,
      pendingGrading: 0,
      totalCourses: 0,
      totalAssignments: 0,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — getStudentStats
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] teacherService.getStudentStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-TEACHER-007: ném HttpError 400 khi thiếu studentId', async () => {
    await expect(teacherService.getStudentStats('')).rejects.toMatchObject({
      status: 400,
      message: 'Missing studentId',
    });
  });

  it('TC-TEACHER-008: trả về stats đầy đủ cho student', async () => {
    (prisma.enrollment.count as any).mockResolvedValue(5);
    (prisma.assignment.count as any).mockResolvedValue(20);
    (prisma.submission.count as any).mockResolvedValue(15);
    (prisma.user.findUnique as any).mockResolvedValue({ stars: 120 });

    const result = await teacherService.getStudentStats('s1');
    expect(result.totalCourses).toBe(5);
    expect(result.totalAssignments).toBe(20);
    expect(result.completedAssignments).toBe(15);
    expect(result.totalStars).toBe(120);
    expect(result.completionRate).toBe(75); // 15/20 * 100
  });

  it('TC-TEACHER-009: tính completionRate = 0 khi không có assignments', async () => {
    (prisma.enrollment.count as any).mockResolvedValue(2);
    (prisma.assignment.count as any).mockResolvedValue(0);
    (prisma.submission.count as any).mockResolvedValue(0);
    (prisma.user.findUnique as any).mockResolvedValue({ stars: 0 });

    const result = await teacherService.getStudentStats('s-new');
    expect(result.completionRate).toBe(0);
  });

  it('TC-TEACHER-010: xử lý student không có stars', async () => {
    (prisma.enrollment.count as any).mockResolvedValue(3);
    (prisma.assignment.count as any).mockResolvedValue(10);
    (prisma.submission.count as any).mockResolvedValue(8);
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const result = await teacherService.getStudentStats('s-no-stars');
    expect(result.totalStars).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — getCourseSubmissions
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] teacherService.getCourseSubmissions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-TEACHER-011: ném HttpError 400 khi thiếu courseId', async () => {
    await expect(teacherService.getCourseSubmissions()).rejects.toMatchObject({
      status: 400,
      message: 'Missing courseId',
    });
  });

  it('TC-TEACHER-012: trả về danh sách submissions của course', async () => {
    (prisma.submission.findMany as any).mockResolvedValue([
      {
        id: 'sub1',
        user: { id: 'u1', name: 'An', email: 'an@test.com', avatar: null },
        assignment: { id: 'a1', title: 'Bài tập 1', type: 'quiz', starsReward: 10 },
        status: 'submitted',
      },
      {
        id: 'sub2',
        user: { id: 'u2', name: 'Bình', email: 'binh@test.com', avatar: '/avatar.png' },
        assignment: { id: 'a2', title: 'Bài tập 2', type: 'writing', starsReward: 15 },
        status: 'graded',
      },
    ]);

    const result = await teacherService.getCourseSubmissions('c1');
    expect(result).toHaveLength(2);
    expect(result[0].user.name).toBe('An');
    expect(result[1].assignment.title).toBe('Bài tập 2');
  });

  it('TC-TEACHER-013: trả về mảng rỗng khi course không có submissions', async () => {
    (prisma.submission.findMany as any).mockResolvedValue([]);
    const result = await teacherService.getCourseSubmissions('c-empty');
    expect(result).toHaveLength(0);
  });
});
