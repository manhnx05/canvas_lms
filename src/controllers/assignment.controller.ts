import { Request, Response, NextFunction } from 'express';
import { assignmentService } from '../services/assignmentService';

// GET /api/assignments?userId=xxx&courseId=yyy
export const getAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignments = await assignmentService.getAssignments(req.query);
    res.json(assignments);
  } catch (error) {
    next(error);
  }
};

// GET /api/assignments/:id?userId=xxx
export const getAssignmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await assignmentService.getAssignmentById(req.params.id, req.query.userId as string);
    res.json(assignment);
  } catch (error) {
    next(error);
  }
};

// POST /api/assignments/:id/submit   body: { userId, answers }
export const submitAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = { ...req.body };
    if (!data.userId && (req as any).user) {
      data.userId = (req as any).user.id;
    }
    if (req.file) {
      data.fileUrl = `/uploads/${req.file.filename}`;
    }
    const submission = await assignmentService.submitAssignment(req.params.id, data);
    res.json(submission);
  } catch (error) {
    next(error);
  }
};

// POST /api/assignments/:id/grade   body: { submissionId, score, feedback }
export const gradeAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await assignmentService.gradeAssignment(req.params.id, req.body);
    res.json(assignment);
  } catch (error) {
    next(error);
  }
};

// POST /api/assignments   body: { title, courseId, courseName, dueDate, ... }
export const createAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await assignmentService.createAssignment(req.body);
    res.status(201).json(assignment);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/assignments/:id
export const deleteAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assignmentService.deleteAssignment(req.params.id);
    res.json({ message: 'Xóa bài tập thành công' });
  } catch (error) {
    next(error);
  }
};
