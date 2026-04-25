import prisma from '@/src/lib/prisma';
import { HttpError } from '@/src/utils/errorHandler';
import { cache, cacheKeys, cacheTags, cacheTTL, withCache } from '@/src/lib/cache';

export const courseService = {
  getCourses: async (userId?: string) => {
    if (userId) {
      return withCache(
        cacheKeys.userCourses(userId),
        async () => {
          const enrollments = await prisma.enrollment.findMany({
            where: { userId: String(userId) },
            include: { course: true }
          });
          return enrollments.map(e => e.course);
        },
        cacheTTL.medium,
        [cacheTags.user(userId)]
      );
    }
    
    return withCache(
      'courses:all',
      async () => prisma.course.findMany({ orderBy: { title: 'asc' } }),
      cacheTTL.long,
      ['courses']
    );
  },

  getCourseById: async (id: string) => {
    return withCache(
      cacheKeys.course(id),
      async () => {
        // 1. Validate course exists
        const baseCourse = await prisma.course.findUnique({ where: { id } });
        if (!baseCourse) throw new HttpError(404, "Không tìm thấy khóa học");

        // 2. Auto-sync students based on class name or fallback to all
        const allStudents = await prisma.user.findMany({ where: { role: 'student' } });
        let targetStudents = allStudents.filter(s => s.className && baseCourse.title.includes(s.className));
        if (targetStudents.length === 0) targetStudents = allStudents;

        if (targetStudents.length > 0) {
          await prisma.enrollment.createMany({
            data: targetStudents.map(s => ({ userId: s.id, courseId: id })),
            skipDuplicates: true
          });
          // Also ensure teacher is still enrolled
          const count = await prisma.enrollment.count({ where: { courseId: id } });
          await prisma.course.update({ where: { id }, data: { studentsCount: count - 1 > 0 ? count - 1 : count } });
        }

        // 3. Fetch detailed course data
        const course = await prisma.course.findUnique({
          where: { id },
          include: {
            assignments: { orderBy: { id: 'desc' } },
            announcements: { orderBy: { id: 'desc' } },
            modules: {
              orderBy: { order: 'asc' },
              include: { items: { orderBy: { order: 'asc' } } }
            },
            enrollments: {
              include: { user: { select: { id: true, name: true, email: true, role: true, avatar: true, className: true } } }
            }
          }
        });

        return {
          ...course,
          people: course?.enrollments.map(e => e.user) || []
        };
      },
      cacheTTL.short, // Short TTL due to auto-sync behavior
      [cacheTags.course(id)]
    );
  },

  createCourse: async (data: any) => {
    const { title, color, icon, description, teacher, teacherId } = data;
    const course = await prisma.course.create({
      data: {
        title, color, icon, description,
        teacher: teacher || 'Giáo viên',
        studentsCount: 0,
        progress: 0
      }
    });

    // Auto-sync students mapped to this course
    const allStudents = await prisma.user.findMany({ where: { role: 'student' } });
    let targetStudents = allStudents.filter(s => s.className && title.includes(s.className));
    if (targetStudents.length === 0) targetStudents = allStudents;

    if (targetStudents.length > 0) {
      await prisma.enrollment.createMany({
        data: targetStudents.map(s => ({ userId: s.id, courseId: course.id })),
        skipDuplicates: true
      });
      await prisma.course.update({ where: { id: course.id }, data: { studentsCount: targetStudents.length } });
    }

    if (teacherId) {
      await prisma.enrollment.create({
        data: { userId: teacherId, courseId: course.id }
      }).catch(() => {});
    }

    // Invalidate cache
    cache.invalidateByTag('courses');
    if (teacherId) {
      cache.invalidateByTag(cacheTags.user(teacherId));
    }
    targetStudents.forEach(student => {
      cache.invalidateByTag(cacheTags.user(student.id));
    });

    return course;
  },

  updateCourse: async (id: string, data: any) => {
    const { title, color, icon, description, teacher } = data;
    
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (description !== undefined) updateData.description = description;
    if (teacher !== undefined) updateData.teacher = teacher;
    
    const result = await prisma.course.update({
      where: { id },
      data: updateData
    });

    // Invalidate cache
    cache.invalidateByTag(cacheTags.course(id));
    cache.invalidateByTag('courses');

    return result;
  },

  deleteCourse: async (id: string) => {
    // Check if course exists
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new HttpError(404, 'Không tìm thấy lớp học');
    }

    // Delete in correct order to avoid foreign key constraints
    try {
      await prisma.$transaction(async (tx) => {
        // Delete submissions first (references assignments)
        await tx.submission.deleteMany({
          where: {
            assignment: { courseId: id }
          }
        });

        // Delete assignments
        await tx.assignment.deleteMany({ where: { courseId: id } });

        // Delete module items first (references modules)
        await tx.moduleItem.deleteMany({ 
          where: { 
            module: { courseId: id } 
          } 
        });

        // Delete modules
        await tx.courseModule.deleteMany({ where: { courseId: id } });

        // Delete announcements
        await tx.announcement.deleteMany({ where: { courseId: id } });

        // Delete enrollments
        await tx.enrollment.deleteMany({ where: { courseId: id } });

        // Finally delete the course
        await tx.course.delete({ where: { id } });
      });

      // Invalidate cache
      cache.invalidateByTag(cacheTags.course(id));
      cache.invalidateByTag('courses');
      
    } catch (error: any) {
      console.error('Error deleting course:', error);
      throw new HttpError(500, 'Không thể xóa lớp học. Vui lòng thử lại.');
    }
  },

  enrollUser: async (courseId: string, userId: string) => {
    const enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {},
      create: { userId, courseId }
    });
    const count = await prisma.enrollment.count({ where: { courseId } });
    await prisma.course.update({ where: { id: courseId }, data: { studentsCount: count } });
    return enrollment;
  },

  unenrollUser: async (courseId: string, userId: string) => {
    await prisma.enrollment.delete({
      where: { userId_courseId: { userId, courseId } }
    });
    const count = await prisma.enrollment.count({ where: { courseId } });
    return prisma.course.update({ where: { id: courseId }, data: { studentsCount: count } });
  },

  postAnnouncement: async (courseId: string, data: any) => {
    const { title, content } = data;
    return prisma.announcement.create({
      data: { title, content, courseId }
    });
  },

  updateAnnouncement: async (id: string, data: any) => {
    const { title, content } = data;
    return prisma.announcement.update({
      where: { id },
      data: { title, content }
    });
  },

  deleteAnnouncement: async (id: string) => {
    return prisma.announcement.delete({ where: { id } });
  },

  createModule: async (courseId: string, data: any) => {
    const { title } = data;
    const maxMod = await prisma.courseModule.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' }
    });
    const nextOrder = maxMod ? maxMod.order + 1 : 0;
    return prisma.courseModule.create({
      data: { title, order: nextOrder, courseId },
      include: { items: true }
    });
  },

  createModuleItem: async (moduleId: string, data: any) => {
    const { title, type, url, content } = data;
    const maxItem = await prisma.moduleItem.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' }
    });
    const nextOrder = maxItem ? maxItem.order + 1 : 0;
    return prisma.moduleItem.create({
      data: { title, type, url, content, order: nextOrder, moduleId }
    });
  },

  reorderModuleItems: async (items: any[]) => {
    await prisma.$transaction(
      items.map((item: any) =>
        prisma.moduleItem.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );
  },

  deleteModule: async (id: string) => {
    return prisma.courseModule.delete({ where: { id } });
  },

  deleteModuleItem: async (id: string) => {
    return prisma.moduleItem.delete({ where: { id } });
  }
};
