import prisma from '../../shared/lib/prisma';
import { HttpError } from '../middleware/errorHandler';

export const assignmentService = {
  getAssignments: async (query: any) => {
    const { userId, courseId } = query;
    const where: any = {};
    if (courseId) where.courseId = String(courseId);

    const assignments = await prisma.assignment.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        submissions: userId ? { where: { userId: String(userId) } } : false
      }
    });

    return assignments.map((a: any) => ({
      ...a,
      mySubmission: userId ? (a.submissions?.[0] || null) : undefined,
      submissions: undefined
    }));
  },

  getAssignmentById: async (id: string, userId?: string) => {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        submissions: { include: { user: true } }
      }
    });

    if (!assignment) throw new HttpError(404, 'Không tìm thấy bài tập');

    const mySubmission = userId
      ? assignment.submissions.find(s => s.userId === String(userId))
      : null;

    return { ...assignment, mySubmission };
  },

  submitAssignment: async (id: string, data: any) => {
    const { userId, answers, fileUrl } = data;
    if (!userId) throw new HttpError(400, 'Thiếu thông tin người dùng (userId)');

    let updatedAnswers = {};
    if (answers) {
      try {
        updatedAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers;
      } catch(e) {}
    }
    if (fileUrl) {
      updatedAnswers = { ...updatedAnswers, fileUrl };
    }

    return prisma.submission.upsert({
      where: { assignmentId_userId: { assignmentId: id, userId } },
      update: { answers: updatedAnswers, status: 'submitted', timestamp: new Date().toISOString() },
      create: {
        assignmentId: id,
        userId,
        answers: updatedAnswers,
        status: 'submitted',
        timestamp: new Date().toISOString()
      }
    });
  },

  gradeAssignment: async (id: string, data: any) => {
    const { stars, feedback, submissionId } = data;
    
    if (submissionId) {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'graded', score: parseInt(stars) || 0, aiFeedback: feedback }
      });
    }

    const currentAssn = await prisma.assignment.findUnique({ where: { id } });
    return prisma.assignment.update({
      where: { id },
      data: {
        status: 'graded',
        starsReward: parseInt(stars) || Number(currentAssn?.starsReward) || 10
      }
    });
  },

  createAssignment: async (data: any) => {
    const { title, courseId, courseName, dueDate, starsReward, type, description, questions } = data;
    return prisma.assignment.create({
      data: {
        title, courseId, courseName, dueDate, type, description, questions,
        starsReward: parseInt(starsReward) || 0,
        status: 'pending'
      }
    });
  },

  deleteAssignment: async (id: string) => {
    return prisma.assignment.delete({ where: { id } });
  }
};
