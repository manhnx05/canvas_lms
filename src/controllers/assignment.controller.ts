import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// GET /api/assignments?userId=xxx&courseId=yyy
export const getAssignments = async (req: Request, res: Response) => {
  try {
    const { userId, courseId } = req.query;
    const where: any = {};
    if (courseId) where.courseId = String(courseId);

    const assignments = await prisma.assignment.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        submissions: userId
          ? { where: { userId: String(userId) } }
          : false
      }
    });

    // Attach submission status per user
    const formatted = assignments.map((a: any) => ({
      ...a,
      mySubmission: userId ? (a.submissions?.[0] || null) : undefined,
      submissions: undefined
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách bài tập' });
  }
};

// GET /api/assignments/:id?userId=xxx
export const getAssignmentById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id },
      include: {
        submissions: { include: { user: true } }
      }
    });

    if (!assignment) return res.status(404).json({ error: "Không tìm thấy bài tập" });

    const mySubmission = userId
      ? assignment.submissions.find(s => s.userId === String(userId))
      : null;

    res.json({ ...assignment, mySubmission });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy bài tập' });
  }
};

// POST /api/assignments/:id/submit   body: { userId, answers }
export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const { userId, answers } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const submission = await prisma.submission.upsert({
      where: { assignmentId_userId: { assignmentId: req.params.id, userId } },
      update: { answers, status: 'submitted', timestamp: new Date().toISOString() },
      create: {
        assignmentId: req.params.id,
        userId,
        answers,
        status: 'submitted',
        timestamp: new Date().toISOString()
      }
    });

    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi nộp bài' });
  }
};

// POST /api/assignments/:id/grade   body: { submissionId, score, feedback }
export const gradeAssignment = async (req: Request, res: Response) => {
  try {
    const { stars, feedback, submissionId } = req.body;
    
    if (submissionId) {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'graded', score: parseInt(stars) || 0, aiFeedback: feedback }
      });
    }

    const currentAssn = await prisma.assignment.findUnique({ where: { id: req.params.id } });
    const assignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: {
        status: 'graded',
        starsReward: parseInt(stars) || Number(currentAssn?.starsReward) || 10
      }
    });
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi chấm bài' });
  }
};

// POST /api/assignments   body: { title, courseId, courseName, dueDate, ... }
export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { title, courseId, courseName, dueDate, starsReward, type, description, questions } = req.body;
    const assignment = await prisma.assignment.create({
      data: {
        title, courseId, courseName, dueDate, type, description, questions,
        starsReward: parseInt(starsReward) || 0,
        status: 'pending'
      }
    });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi giao bài tập' });
  }
};

// DELETE /api/assignments/:id
export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    await prisma.assignment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Xóa bài tập thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xóa bài tập' });
  }
};
