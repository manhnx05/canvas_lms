import { Request, Response, NextFunction } from 'express';
import { courseService } from '../services/courseService';

export const getCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await courseService.getCourses(req.query.userId as string);
    res.json(courses);
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    res.json(course);
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await courseService.createCourse(req.body);
    res.status(201).json(course);
  } catch (error) {
    next(error);
  }
};

export const enrollUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const enrollment = await courseService.enrollUser(req.params.id, req.body.userId);
    res.json(enrollment);
  } catch (error) {
    next(error);
  }
};

export const unenrollUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await courseService.unenrollUser(req.params.id, req.params.userId);
    res.json({ message: 'Đã xoá khỏi lớp' });
  } catch (error) {
    next(error);
  }
};

export const postAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const announcement = await courseService.postAnnouncement(req.params.id, req.body);
    res.status(201).json(announcement);
  } catch (error) {
    next(error);
  }
};

export const updateAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ann = await courseService.updateAnnouncement(req.params.announcementId, req.body);
    res.json(ann);
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await courseService.deleteAnnouncement(req.params.announcementId);
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};

export const createModule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mod = await courseService.createModule(req.params.id, req.body);
    res.status(201).json(mod);
  } catch (error) {
    next(error);
  }
};

export const createModuleItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await courseService.createModuleItem(req.params.moduleId, req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const reorderModuleItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await courseService.reorderModuleItems(req.body.items);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const deleteModule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await courseService.deleteModule(req.params.moduleId);
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};

export const deleteModuleItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await courseService.deleteModuleItem(req.params.itemId);
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};
