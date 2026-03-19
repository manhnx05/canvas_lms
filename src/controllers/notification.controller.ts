import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const notifications = await prisma.notification.findMany({
      where: { userId: String(userId) },
      orderBy: { id: 'desc' } // Prisma doesn't sort by createdAt if we don't have it, but id usually loosely sorts if it's uuid or we can just sort in memory or rely on db order
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy thông báo' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.json({ message: 'Đã đánh dấu đọc' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi cập nhật thông báo' });
  }
};

export const createNotification = async (req: Request, res: Response) => {
  try {
    const { userId, title, content, date } = req.body;
    const notification = await prisma.notification.create({
      data: { userId, title, content, date }
    });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tạo thông báo' });
  }
};
