import { Router } from 'express';
import { getStats, getCourseSubmissions } from '../controllers/teacher.controller';

const router = Router();

router.get('/stats', getStats);
router.get('/submissions', getCourseSubmissions);

export default router;
