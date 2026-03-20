import { Router } from 'express';
import {
  getCourses, getCourseById, createCourse,
  postAnnouncement, updateAnnouncement, deleteAnnouncement,
  createModule, createModuleItem, reorderModuleItems, deleteModule, deleteModuleItem,
  enrollUser, unenrollUser
} from '../controllers/course.controller';

const router = Router();

router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', createCourse);

// Enrollment
router.post('/:id/enroll', enrollUser);
router.delete('/:id/enroll/:userId', unenrollUser);

// Announcements
router.post('/:id/announcements', postAnnouncement);
router.put('/:id/announcements/:announcementId', updateAnnouncement);
router.delete('/:id/announcements/:announcementId', deleteAnnouncement);

// Modules
router.post('/:id/modules', createModule);
router.delete('/modules/:moduleId', deleteModule);

// Module Items
router.post('/modules/:moduleId/items', createModuleItem);
router.delete('/modules/items/:itemId', deleteModuleItem);
router.put('/modules/reorder', reorderModuleItems);

export default router;
