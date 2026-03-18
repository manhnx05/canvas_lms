import { Router } from 'express';
import { getCourses, getCourseById, createCourse, postAnnouncement, postLecture, updateAnnouncement, deleteAnnouncement, updateLecture, deleteLecture } from '../controllers/course.controller';

const router = Router();

router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', createCourse);
router.post('/:id/announcements', postAnnouncement);
router.post('/:id/lectures', postLecture);
router.put('/:id/announcements/:announcementId', updateAnnouncement);
router.delete('/:id/announcements/:announcementId', deleteAnnouncement);
router.put('/:id/lectures/:lectureId', updateLecture);
router.delete('/:id/lectures/:lectureId', deleteLecture);

export default router;
