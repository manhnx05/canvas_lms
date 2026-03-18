import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getRewards = async (req: Request, res: Response) => {
  try {
    const rewards = await prisma.reward.findMany();
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy phần thưởng' });
  }
};
