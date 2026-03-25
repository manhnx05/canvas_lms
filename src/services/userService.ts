import bcrypt from 'bcryptjs';
import prisma from '@/src/lib/prisma';
import { HttpError } from '@/src/utils/errorHandler';

export const userService = {
  getUserProfile: async (id: string) => {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        className: true,
        stars: true
      }
    });
  },

  getUsers: async (query: any) => {
    const { role, excludeId } = query;
    const whereClause: any = {};
    if (role) whereClause.role = String(role);
    if (excludeId) whereClause.id = { not: String(excludeId) };

    return prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        className: true
      }
    });
  },

  createUser: async (data: any) => {
    const { name, email, className, avatar, role } = data;
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new HttpError(400, 'Email đã tồn tại');
    
    // Default password for manually created users
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    return prisma.user.create({
      data: {
        name,
        email,
        className,
        avatar,
        role: role || 'student',
        password: hashedPassword
      }
    });
  },

  updateUser: async (id: string, data: any) => {
    const { name, email, className, avatar } = data;
    return prisma.user.update({
      where: { id },
      data: { name, email, className, avatar }
    });
  },

  deleteUser: async (id: string) => {
    return prisma.user.delete({ where: { id } });
  }
};
