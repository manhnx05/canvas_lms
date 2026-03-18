import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getStats = async (req: Request, res: Response) => {
  try {
    const pendingGradingCount = await prisma.assignment.count({
      where: { status: 'submitted' }
    });
    
    res.json({
      totalStudents: 35,
      pendingGrading: pendingGradingCount,
      averageAttendance: 98,
      upcomingClasses: 3
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy thống kê' });
  }
};
