import prisma from '@/src/lib/prisma';
import { HttpError } from '@/src/utils/errorHandler';

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

  getTeacherStats: async (teacherId: string) => {
    if (!teacherId) throw new HttpError(400, 'Missing teacherId');

    // Get courses where teacher is enrolled
    const enrollments = await prisma.enrollment.findMany({
      where: { 
        userId: teacherId,
        user: { role: 'teacher' }
      },
      include: { course: true }
    });
    
    const courseIds = enrollments.map(e => e.courseId);

    if (courseIds.length === 0) {
      return { totalStudents: 0, pendingGrading: 0, totalCourses: 0, totalAssignments: 0 };
    }

    const [totalStudents, pendingGrading, totalAssignments] = await Promise.all([
      prisma.enrollment.count({
        where: { 
          courseId: { in: courseIds }, 
          user: { role: 'student' } 
        }
      }),
      prisma.submission.count({
        where: { 
          assignment: { courseId: { in: courseIds } }, 
          status: 'submitted' 
        }
      }),
      prisma.assignment.count({
        where: { courseId: { in: courseIds } }
      })
    ]);

    return { 
      totalStudents, 
      pendingGrading, 
      totalCourses: courseIds.length, 
      totalAssignments,
      activityTrend: [45, 52, 38, 65, 89, 75, 92],
      completionRate: 85,
    };
  },

  getStudentStats: async (studentId: string) => {
    if (!studentId) throw new HttpError(400, 'Missing studentId');

    const [totalCourses, totalAssignments, completedAssignments, totalStars] = await Promise.all([
      prisma.enrollment.count({
        where: { 
          userId: studentId,
          user: { role: 'student' }
        }
      }),
      prisma.assignment.count({
        where: {
          course: {
            enrollments: {
              some: { userId: studentId }
            }
          }
        }
      }),
      prisma.submission.count({
        where: { 
          userId: studentId,
          status: { in: ['submitted', 'graded'] }
        }
      }),
      prisma.user.findUnique({
        where: { id: studentId },
        select: { stars: true }
      }).then(user => user?.stars || 0)
    ]);

    return {
      totalCourses,
      totalAssignments,
      completedAssignments,
      totalStars,
      completionRate: totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0
    };
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
