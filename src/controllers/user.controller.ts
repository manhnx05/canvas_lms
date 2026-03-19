import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { role, excludeId } = req.query;
    
    const whereClause: any = {};
    if (role) whereClause.role = String(role);
    if (excludeId) whereClause.id = { not: String(excludeId) };

    const users = await prisma.user.findMany({
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
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách người dùng' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, className, avatar, role } = req.body;
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email đã tồn tại' });
    
    // Default password for manually created users
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        className,
        avatar,
        role: role || 'student',
        password: hashedPassword
      }
    });
    
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tạo người dùng' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, className, avatar } = req.body;
    
    const user = await prisma.user.update({
      where: { id },
      data: { name, email, className, avatar }
    });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi cập nhật người dùng' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xóa người dùng' });
  }
};
