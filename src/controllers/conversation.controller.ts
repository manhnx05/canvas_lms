import { Request, Response, NextFunction } from 'express';
import { conversationService } from '../services/conversationService';

export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formatted = await conversationService.getConversations(req.query.userId as string);
    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formatted = await conversationService.getMessages(req.params.id);
    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const io = req.app.get('io');
    const formattedMessage = await conversationService.sendMessage(req.params.id, req.body, io);
    res.json(formattedMessage);
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const io = req.app.get('io');
    const formatted = await conversationService.createConversation(req.body, io);
    res.json(formatted);
  } catch (error) {
    next(error);
  }
};
