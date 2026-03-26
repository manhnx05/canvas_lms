import prisma from '@/src/lib/prisma';
import { HttpError } from '@/src/utils/errorHandler';

export const courseService = {
  getCourses: async (userId?: string) => {
    if (userId) {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: String(userId) },
        include: { course: true }
      });
      return enrollments.map(e => e.course);
    }
    return prisma.course.findMany({ orderBy: { title: 'asc' } });
  },

  getCourseById: async (id: string) => {
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
          include: { user: { select: { id: true, name: true, email: true, role: true, avatar: true } } }
        }
      }
    });

    if (!course) throw new HttpError(404, "Không tìm thấy khóa học");

    return {
      ...course,
      people: course.enrollments.map(e => e.user)
    };
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

    if (teacherId) {
      await prisma.enrollment.create({
        data: { userId: teacherId, courseId: course.id }
      }).catch(() => {});
    }
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
    
    return prisma.course.update({
      where: { id },
      data: updateData
    });
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
