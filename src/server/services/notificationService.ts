import prisma from '../../shared/lib/prisma';
import { HttpError } from '../middleware/errorHandler';

export const notificationService = {
  getNotifications: async (userId: string) => {
    if (!userId) throw new HttpError(400, 'Missing userId');

    return prisma.notification.findMany({
      where: { userId: String(userId) },
      orderBy: { id: 'desc' } // Prisma doesn't sort by createdAt if we don't have it, but id usually loosely sorts if it's uuid or we can just sort in memory or rely on db order
    });
  },

  markAsRead: async (id: string) => {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  },

  createNotification: async (data: any) => {
    const { userId, title, content, date } = data;
    return prisma.notification.create({
      data: { userId, title, content, date }
    });
  }
};
