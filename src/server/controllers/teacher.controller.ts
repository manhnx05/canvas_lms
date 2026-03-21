import { Request, Response, NextFunction } from 'express';
import { teacherService } from '../services/teacherService';

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await teacherService.getStats(req.query.userId as string);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

export const getCourseSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const submissions = await teacherService.getCourseSubmissions(req.query.courseId as string);
    res.json(submissions);
  } catch (error) {
    next(error);
  }
};
