import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.assignment.findMany();
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách bài tập' });
  }
};

export const getAssignmentById = async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id }
    });
    if (!assignment) return res.status(404).json({ error: "Không tìm thấy bài tập" });
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy bài tập' });
  }
};

export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: { status: 'submitted' }
    });
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi nộp bài' });
  }
};

export const gradeAssignment = async (req: Request, res: Response) => {
  try {
    const { stars } = req.body;
    const assignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: { 
        status: 'graded',
        starsReward: parseInt(stars) || 0
      }
    });
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi chấm bài' });
  }
};

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { title, courseId, courseName, dueDate, starsReward, type, description } = req.body;
    const assignment = await prisma.assignment.create({
      data: {
        title, courseId, courseName, dueDate, type, description,
        starsReward: parseInt(starsReward) || 0,
        status: 'pending'
      }
    });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi giao bài tập' });
  }
};
