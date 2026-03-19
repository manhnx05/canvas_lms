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
        modules: {
          orderBy: { order: 'asc' },
          include: { items: { orderBy: { order: 'asc' } } }
        },
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

export const createModule = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    
    // Find highest order
    const maxMod = await prisma.courseModule.findFirst({
      where: { courseId: req.params.id },
      orderBy: { order: 'desc' }
    });
    
    const nextOrder = maxMod ? maxMod.order + 1 : 0;

    const mod = await prisma.courseModule.create({
      data: { title, order: nextOrder, courseId: req.params.id },
      include: { items: true }
    });
    res.status(201).json(mod);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tạo module' });
  }
};

export const createModuleItem = async (req: Request, res: Response) => {
  try {
    const { title, type, url, content } = req.body;
    const moduleId = req.params.moduleId;
    
    const maxItem = await prisma.moduleItem.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' }
    });
    
    const nextOrder = maxItem ? maxItem.order + 1 : 0;

    const item = await prisma.moduleItem.create({
      data: { title, type, url, content, order: nextOrder, moduleId }
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi thêm nội dung' });
  }
};

export const reorderModuleItems = async (req: Request, res: Response) => {
  try {
    const { items } = req.body; // array of { id, order }

    // Dùng transaction bulk update
    await prisma.$transaction(
      items.map((item: any) =>
        prisma.moduleItem.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi sắp xếp module items' });
  }
};

export const deleteModule = async (req: Request, res: Response) => {
  try {
    await prisma.courseModule.delete({ where: { id: req.params.moduleId } });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: 'Lỗi xóa module' }); }
};

export const deleteModuleItem = async (req: Request, res: Response) => {
  try {
    await prisma.moduleItem.delete({ where: { id: req.params.itemId } });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: 'Lỗi xóa nội dung' }); }
};
