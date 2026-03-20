import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

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

      return res.json({ totalStudents, pendingGrading, totalCourses, totalAssignments });
    }

    // Fallback global stats
    const [totalStudents, pendingGrading, totalCourses, totalAssignments] = await Promise.all([
      prisma.user.count({ where: { role: 'student' } }),
      prisma.submission.count({ where: { status: 'submitted' } }),
      prisma.course.count(),
      prisma.assignment.count()
    ]);

    res.json({ totalStudents, pendingGrading, totalCourses, totalAssignments });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy thống kê' });
  }
};

// GET /api/teacher/submissions?courseId=xxx  – All submissions for teacher's course
export const getCourseSubmissions = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.query;
    if (!courseId) return res.status(400).json({ error: 'Missing courseId' });

    const submissions = await prisma.submission.findMany({
      where: { assignment: { courseId: String(courseId) } },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        assignment: { select: { id: true, title: true, type: true, starsReward: true } }
      },
      orderBy: { id: 'desc' }
    });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách nộp bài' });
  }
};
