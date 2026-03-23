import { Router } from 'express';
import {
  getCourses, getCourseById, createCourse,
  postAnnouncement, updateAnnouncement, deleteAnnouncement,
  createModule, createModuleItem, reorderModuleItems, deleteModule, deleteModuleItem,
  enrollUser, unenrollUser
} from '../controllers/course.controller';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

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

// Module Items – static routes BEFORE dynamic (:moduleId) to prevent param shadowing
router.put('/modules/reorder', reorderModuleItems);
router.post('/modules/:moduleId/items', upload.single('file'), createModuleItem);
router.delete('/modules/items/:itemId', deleteModuleItem);

export default router;
