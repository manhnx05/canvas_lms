import { Request, Response, NextFunction } from 'express';
import { examService } from '../services/examService';

export const getExams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exams = await examService.getExams(req.query);
    res.json(exams);
  } catch (error) {
    next(error);
  }
};

export const getExamById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exam = await examService.getExamById(req.params.id);
    res.json(exam);
  } catch (error) {
    next(error);
  }
};

export const createExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exam = await examService.createExam(req.body);
    res.status(201).json(exam);
  } catch (error) {
    next(error);
  }
};

export const updateExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exam = await examService.updateExam(req.params.id, req.body);
    res.json(exam);
  } catch (error) {
    next(error);
  }
};

export const deleteExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await examService.deleteExam(req.params.id);
    res.json({ message: 'Xóa đề thi thành công' });
  } catch (error) {
    next(error);
  }
};

export const downloadExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exam = await examService.downloadExam(req.params.id);
    res.json(exam);
  } catch (error) {
    next(error);
  }
};

export const uploadExamFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const examFile = await examService.uploadExamFile((req as any).file, req.body.examId);
    res.status(201).json(examFile);
  } catch (error) {
    next(error);
  }
};

export const deleteExamFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await examService.deleteExamFile(req.params.fileId);
    res.json({ message: 'Xóa file thành công' });
  } catch (error) {
    next(error);
  }
};

export const generateExamAI = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await examService.generateExamAI(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const generateExamAIQuick = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await examService.generateExamAIQuick(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const startExamAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }
    const attempt = await examService.startExamAttempt(req.params.id, userId as string);
    res.json(attempt);
  } catch (error) {
    next(error);
  }
};

export const submitExamAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { attemptId, userId, answers } = req.body;
    if (!userId || !attemptId || !answers) {
      return res.status(400).json({ error: 'Missing attemptId, userId, or answers' });
    }
    const attempt = await examService.submitExamAttempt(attemptId, userId as string, answers);
    res.json(attempt);
  } catch (error) {
    next(error);
  }
};

export const getExamAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }
    const attempt = await examService.getExamAttempt(req.params.id, userId as string);
    res.json(attempt);
  } catch (error) {
    next(error);
  }
};
