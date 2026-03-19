import { Router } from 'express';
import { getCourses, getCourseById, createCourse, postAnnouncement, updateAnnouncement, deleteAnnouncement, createModule, createModuleItem, reorderModuleItems, deleteModule, deleteModuleItem } from '../controllers/course.controller';

const router = Router();

router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', createCourse);
router.post('/:id/announcements', postAnnouncement);
router.put('/:id/announcements/:announcementId', updateAnnouncement);
router.delete('/:id/announcements/:announcementId', deleteAnnouncement);

router.post('/:id/modules', createModule);
router.delete('/modules/:moduleId', deleteModule);

router.post('/modules/:moduleId/items', createModuleItem);
router.delete('/modules/items/:itemId', deleteModuleItem);
router.put('/modules/reorder', reorderModuleItems);

export default router;
