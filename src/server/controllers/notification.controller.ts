import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await notificationService.getNotifications(req.query.userId as string);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await notificationService.markAsRead(req.params.id);
    res.json({ message: 'Đã đánh dấu đọc', data: result });
  } catch (error) {
    next(error);
  }
};

export const createNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await notificationService.createNotification(req.body);
    res.json(notification);
  } catch (error) {
    next(error);
  }
};
