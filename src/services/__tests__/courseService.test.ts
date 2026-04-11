/**
 * @vitest-environment node
 *
 * UNIT TESTS — courseService
 * Coverage: getCourses, getCourseById, createCourse, updateCourse, deleteCourse,
 *           enrollUser, unenrollUser, postAnnouncement, createModule, createModuleItem
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/prisma', () => ({
  default: {
    course: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    enrollment: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    announcement: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    courseModule: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    moduleItem: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    assignment: { deleteMany: vi.fn() },
    submission: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { courseService } from '../courseService';
import prisma from '@/src/lib/prisma';

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — getCourses
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] courseService.getCourses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-COURSE-001: không có userId → trả về tất cả courses', async () => {
    (prisma.course.findMany as any).mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);
    const result = await courseService.getCourses();
    expect(result).toHaveLength(2);
    expect(prisma.course.findMany).toHaveBeenCalled();
  });

  it('TC-COURSE-002: có userId → trả về courses theo enrollment', async () => {
    (prisma.enrollment.findMany as any).mockResolvedValue([
      { course: { id: 'c1', title: 'Toán' } },
    ]);
    const result = await courseService.getCourses('u1');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: 'c1', title: 'Toán' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — getCourseById
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] courseService.getCourseById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-COURSE-003: ném HttpError 404 nếu course không tồn tại', async () => {
    (prisma.course.findUnique as any).mockResolvedValueOnce(null);
    await expect(courseService.getCourseById('no-exist')).rejects.toMatchObject({ status: 404 });
  });

  it('TC-COURSE-004: trả về course với danh sách people từ enrollments', async () => {
    const baseCourse = { id: 'c1', title: 'Toán 3' };
    (prisma.course.findUnique as any).mockResolvedValueOnce(baseCourse);
    (prisma.user.findMany as any).mockResolvedValue([]);
    (prisma.enrollment.createMany as any).mockResolvedValue({});
    (prisma.enrollment.count as any).mockResolvedValue(0);
    (prisma.course.update as any).mockResolvedValue({});
    (prisma.course.findUnique as any).mockResolvedValueOnce({
      ...baseCourse,
      assignments: [],
      announcements: [],
      modules: [],
      enrollments: [
        { user: { id: 'u1', name: 'An', role: 'student' } },
        { user: { id: 'u2', name: 'Bình', role: 'teacher' } },
      ],
    });

    const result = await courseService.getCourseById('c1');
    expect(result.people).toHaveLength(2);
    expect(result.people[0].name).toBe('An');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — createCourse
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] courseService.createCourse', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-COURSE-005: tạo course mới với dữ liệu hợp lệ', async () => {
    (prisma.course.create as any).mockResolvedValue({ id: 'c-new', title: 'Khoa học 4' });
    (prisma.user.findMany as any).mockResolvedValue([]);
    (prisma.enrollment.create as any).mockResolvedValue({});
    (prisma.course.update as any).mockResolvedValue({});

    const result = await courseService.createCourse({
      title: 'Khoa học 4', color: '#4CAF50', teacherId: 't1',
    });
    expect(result.id).toBe('c-new');
    expect(prisma.course.create).toHaveBeenCalled();
  });

  it('TC-COURSE-006: teacher field mặc định là "Giáo viên" nếu không truyền', async () => {
    (prisma.course.create as any).mockImplementation((args: any) =>
      Promise.resolve({ id: 'c-t', teacher: args.data.teacher })
    );
    (prisma.user.findMany as any).mockResolvedValue([]);

    const result = await courseService.createCourse({ title: 'Lịch sử' });
    expect(result.teacher).toBe('Giáo viên');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — updateCourse
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] courseService.updateCourse', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-COURSE-007: cập nhật title và color thành công', async () => {
    (prisma.course.update as any).mockResolvedValue({ id: 'c1', title: 'Toán mới', color: '#fff' });
    const result = await courseService.updateCourse('c1', { title: 'Toán mới', color: '#fff' });
    expect(result.title).toBe('Toán mới');
  });

  it('TC-COURSE-008: không truyền field nào → update với object rỗng', async () => {
    (prisma.course.update as any).mockResolvedValue({ id: 'c1' });
    await courseService.updateCourse('c1', {});
    expect(prisma.course.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: {},
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — deleteCourse
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] courseService.deleteCourse', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-COURSE-009: ném 404 nếu course không tồn tại', async () => {
    (prisma.course.findUnique as any).mockResolvedValue(null);
    await expect(courseService.deleteCourse('no-exist')).rejects.toMatchObject({ status: 404 });
  });

  it('TC-COURSE-010: xóa course thành công (transaction thực thi)', async () => {
    (prisma.course.findUnique as any).mockResolvedValue({ id: 'c1' });
    (prisma.$transaction as any).mockResolvedValue(undefined);
    await courseService.deleteCourse('c1');
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — enrollUser & unenrollUser
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] courseService.enrollUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-COURSE-011: enroll user vào course và cập nhật studentsCount', async () => {
    (prisma.enrollment.upsert as any).mockResolvedValue({ userId: 'u1', courseId: 'c1' });
    (prisma.enrollment.count as any).mockResolvedValue(25);
    (prisma.course.update as any).mockResolvedValue({ studentsCount: 25 });

    const result = await courseService.enrollUser('c1', 'u1');
    expect(result.userId).toBe('u1');
    expect(prisma.course.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { studentsCount: 25 } })
    );
  });
});

describe('[UNIT] courseService.unenrollUser', () => {
  it('TC-COURSE-012: unenroll user và cập nhật studentsCount', async () => {
    (prisma.enrollment.delete as any).mockResolvedValue({});
    (prisma.enrollment.count as any).mockResolvedValue(10);
    (prisma.course.update as any).mockResolvedValue({ studentsCount: 10 });

    const result = await courseService.unenrollUser('c1', 'u1');
    expect(result.studentsCount).toBe(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — postAnnouncement
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] courseService.postAnnouncement', () => {
  it('TC-COURSE-013: tạo announcement mới cho course', async () => {
    (prisma.announcement.create as any).mockResolvedValue({
      id: 'ann-1', title: 'Thông báo', content: 'Nghỉ học', courseId: 'c1',
    });
    const result = await courseService.postAnnouncement('c1', {
      title: 'Thông báo', content: 'Nghỉ học',
    });
    expect(result.id).toBe('ann-1');
    expect(result.courseId).toBe('c1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — Module management
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] courseService.createModule', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-COURSE-014: tạo module đầu tiên với order = 0', async () => {
    (prisma.courseModule.findFirst as any).mockResolvedValue(null);
    (prisma.courseModule.create as any).mockResolvedValue({
      id: 'm1', title: 'Chương 1', order: 0, courseId: 'c1', items: [],
    });

    const result = await courseService.createModule('c1', { title: 'Chương 1' });
    expect(result.order).toBe(0);
  });

  it('TC-COURSE-015: tạo module tiếp theo với order = maxOrder + 1', async () => {
    (prisma.courseModule.findFirst as any).mockResolvedValue({ order: 2 });
    (prisma.courseModule.create as any).mockImplementation((args: any) =>
      Promise.resolve({ id: 'm-new', order: args.data.order })
    );

    const result = await courseService.createModule('c1', { title: 'Chương 4' });
    expect(result.order).toBe(3);
  });
});

describe('[UNIT] courseService.createModuleItem', () => {
  it('TC-COURSE-016: tạo module item với order đúng', async () => {
    (prisma.moduleItem.findFirst as any).mockResolvedValue({ order: 1 });
    (prisma.moduleItem.create as any).mockImplementation((args: any) =>
      Promise.resolve({ id: 'item-1', order: args.data.order })
    );

    const result = await courseService.createModuleItem('m1', {
      title: 'Bài 3', type: 'pdf', url: '/docs/bai3.pdf',
    });
    expect(result.order).toBe(2);
  });
});
