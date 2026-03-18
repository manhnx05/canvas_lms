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
      include: { 
        assignments: { orderBy: { id: 'desc' } },
        announcements: { orderBy: { id: 'desc' } },
        lectures: { orderBy: { id: 'asc' } },
        enrollments: {
          include: { user: { select: { id: true, name: true, email: true, role: true, avatar: true } } }
        }
      }
    });
    if (!course) return res.status(404).json({ error: "Không tìm thấy khóa học" });

    const formattedCourse = {
      ...course,
      people: course.enrollments.map(e => e.user)
    };

    res.json(formattedCourse);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy chi tiết khóa học' });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  try {
    const { title, color, icon, description, teacher } = req.body;
    const course = await prisma.course.create({
      data: {
        title, color, icon, description,
        teacher: teacher || 'Cô Nguyễn Thị Ngọc Điệp',
        studentsCount: Math.floor(Math.random() * 20) + 20,
        progress: 0
      }
    });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tạo lớp học' });
  }
};

export const postAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    const date = new Date().toLocaleDateString('vi-VN');
    const announcement = await prisma.announcement.create({
      data: { title, content, date, courseId: req.params.id }
    });
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi gửi thông báo' });
  }
};

export const postLecture = async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    const lecture = await prisma.lecture.create({
      data: { title, content, courseId: req.params.id }
    });
    res.status(201).json(lecture);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi thêm bài giảng' });
  }
};

export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    const ann = await prisma.announcement.update({
      where: { id: req.params.announcementId },
      data: { title, content }
    });
    res.json(ann);
  } catch (error) { res.status(500).json({ error: 'Lỗi sửa thông báo' }); }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    await prisma.announcement.delete({ where: { id: req.params.announcementId } });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: 'Lỗi xóa thông báo' }); }
};

export const updateLecture = async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    const lec = await prisma.lecture.update({
      where: { id: req.params.lectureId },
      data: { title, content }
    });
    res.json(lec);
  } catch (error) { res.status(500).json({ error: 'Lỗi sửa bài giảng' }); }
};

export const deleteLecture = async (req: Request, res: Response) => {
  try {
    await prisma.lecture.delete({ where: { id: req.params.lectureId } });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: 'Lỗi xóa bài giảng' }); }
};
