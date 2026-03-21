import { Request, Response, NextFunction } from 'express';
import { conversationService } from '../services/conversationService';

export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || req.query.userId;
    const formatted = await conversationService.getConversations(userId as string);
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
    const data = { ...req.body };
    if (!data.senderId && (req as any).user) {
      data.senderId = (req as any).user.id;
    }
    const formattedMessage = await conversationService.sendMessage(req.params.id, data, io);
    res.json(formattedMessage);
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const io = req.app.get('io');
    const data = { ...req.body };
    if (!data.senderId && (req as any).user) {
      data.senderId = (req as any).user.id;
    }
    const formatted = await conversationService.createConversation(data, io);
    res.json(formatted);
  } catch (error) {
    next(error);
  }
};
