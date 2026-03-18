import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getCourses = async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách khóa học' });
  }
};

export const getCourseById = async (req: Request, res: Response) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: { assignments: true }
    });
    if (!course) return res.status(404).json({ error: "Không tìm thấy khóa học" });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy chi tiết khóa học' });
  }
};
