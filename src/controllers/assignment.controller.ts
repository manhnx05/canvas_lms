import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.assignment.findMany({
      orderBy: { id: 'desc' }
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách bài tập' });
  }
};

export const getAssignmentById = async (req: Request, res: Response) => {
  try {
    // Để mock user, thay vì auth thực tế, ta truyền role mock từ req query hoặc lấy tất cả cho dễ
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id },
      include: {
        submissions: {
          include: { user: true }
        }
      }
    });

    if (!assignment) return res.status(404).json({ error: "Không tìm thấy bài tập" });
    
    // Nếu là student (stu1 mock), ta có thể lấy submission của nó
    const mySubmission = assignment.submissions.find(s => s.userId === 'stu1');

    res.json({
      ...assignment,
      mySubmission
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy bài tập' });
  }
};

export const submitAssignment = async (req: Request, res: Response) => {
  try {
    // MOCK UserId = stu1
    const { answers } = req.body;
    
    // Tìm hoặc tạo submission mới
    const submission = await prisma.submission.upsert({
      where: { assignmentId_userId: { assignmentId: req.params.id, userId: 'stu1' } },
      update: { answers, status: 'submitted', timestamp: new Date().toISOString() },
      create: { 
        assignmentId: req.params.id, 
        userId: 'stu1', 
        answers, 
        status: 'submitted',
        timestamp: new Date().toISOString()
      }
    });
    
    // Vẫn update status ở assignment cho code cũ không bị lỗi hoàn toàn (Backward compatibility for UI mock)
    await prisma.assignment.update({
      where: { id: req.params.id },
      data: { status: 'submitted' }
    });

    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi nộp bài' });
  }
};

export const gradeAssignment = async (req: Request, res: Response) => {
  try {
    // Chấm grading cho một submission cụ thể hoặc toàn assignment
    const { stars, feedback, submissionId } = req.body;
    
    if (submissionId) {
       await prisma.submission.update({
         where: { id: submissionId },
         data: { status: 'graded', score: parseInt(stars) || 0, aiFeedback: feedback }
       });
    }

    const currentAssn = await prisma.assignment.findUnique({ where: { id: req.params.id }});

    // Luôn update Global assignment cho code mock UI cũ chạy được
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
