import prisma from '@/src/lib/prisma';
import { HttpError } from '@/src/utils/errorHandler';
import { aiService } from './aiService';

export const assignmentService = {
  getAssignments: async (query: any) => {
    const { userId, courseId } = query;
    const where: any = {};
    if (courseId) where.courseId = String(courseId);

    const assignments = await prisma.assignment.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        _count: { select: { submissions: true } },
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
      } catch (e) {
        console.warn('Invalid answers format', e);
      }
    }
    if (fileUrl) {
      updatedAnswers = { ...updatedAnswers, fileUrl };
    }

    const assignment = await prisma.assignment.findUnique({ where: { id } });
    if (!assignment) throw new HttpError(404, 'Không tìm thấy bài tập để chấm ngầm');

    let score: number | null = null;
    let aiFeedback: string | null = null;
    let finalStatus = 'submitted';

    // Auto AI Evaluation For Quizzes
    if (assignment.questions && Array.isArray(assignment.questions) && assignment.questions.length > 0) {
      const qs = assignment.questions as any[];
      let correctCount = 0;
      
      qs.forEach((q: any) => {
         const correctOpt = q.answer || q.correctOptionId;
         if (updatedAnswers && (updatedAnswers as any)[q.id] === correctOpt) correctCount++;
      });
      
      const maxReward = assignment.starsReward || 10;
      score = Math.floor((correctCount / (qs.length || 1)) * maxReward);
      
      try {
        // Find user name internally to give personalized feedback
        const submitTheUser = await prisma.user.findUnique({ where: { id: userId } });
        const aiRes = await aiService.evaluateSubmission({
          questions: qs, 
          answers: updatedAnswers, 
          studentName: submitTheUser?.name || "Bé", 
          assignmentTitle: assignment.title, 
          assignmentContext: assignment.description || "Bài tập trắc nghiệm trên lớp học."
        });
        
        if (typeof aiRes === 'string' && aiRes.length > 0) {
           aiFeedback = aiRes;
           finalStatus = 'graded';
        }
      } catch (err) {
        console.error("AI đánh giá thất bại trong lúc nộp bài:", err);
      }
    }

    return prisma.submission.upsert({
      where: { assignmentId_userId: { assignmentId: id, userId } },
      update: { answers: updatedAnswers, status: finalStatus, score, aiFeedback },
      create: {
        assignmentId: id,
        userId,
        answers: updatedAnswers,
        status: finalStatus,
        score,
        aiFeedback
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
