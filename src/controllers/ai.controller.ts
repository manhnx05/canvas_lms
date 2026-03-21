import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/aiService';

export const generateQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const questions = await aiService.generateQuiz(req.body);
    res.json({ questions });
  } catch (error) {
    next(error);
  }
};

export const evaluateSubmission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const feedback = await aiService.evaluateSubmission(req.body);
    res.json({ feedback });
  } catch (error) {
    next(error);
  }
};

export const chat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reply = await aiService.chat(req.body);
    res.json({ reply });
  } catch (error) {
    next(error);
  }
};
