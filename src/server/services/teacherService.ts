import prisma from '../../shared/lib/prisma';
import { HttpError } from '../middleware/errorHandler';

export const teacherService = {
  getStats: async (userId?: string) => {
    if (userId) {
      // Teacher-specific stats based on their courses
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: String(userId), user: { role: 'teacher' } },
        include: { course: true }
      });
      const courseIds = enrollments.map(e => e.courseId);

      const totalStudents = await prisma.enrollment.count({
        where: { courseId: { in: courseIds }, user: { role: 'student' } }
      });
      const pendingGrading = await prisma.submission.count({
        where: { assignment: { courseId: { in: courseIds } }, status: 'submitted' }
      });
      const totalCourses = courseIds.length;
      const totalAssignments = await prisma.assignment.count({
        where: { courseId: { in: courseIds } }
      });

      return { totalStudents, pendingGrading, totalCourses, totalAssignments };
    }

    // Fallback global stats
    const [totalStudents, pendingGrading, totalCourses, totalAssignments] = await Promise.all([
      prisma.user.count({ where: { role: 'student' } }),
      prisma.submission.count({ where: { status: 'submitted' } }),
      prisma.course.count(),
      prisma.assignment.count()
    ]);

    return { totalStudents, pendingGrading, totalCourses, totalAssignments };
  },

  getCourseSubmissions: async (courseId?: string) => {
    if (!courseId) throw new HttpError(400, 'Missing courseId');

    return prisma.submission.findMany({
      where: { assignment: { courseId: String(courseId) } },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        assignment: { select: { id: true, title: true, type: true, starsReward: true } }
      },
      orderBy: { id: 'desc' }
    });
  }
};
