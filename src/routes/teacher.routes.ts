import { Router } from 'express';
import { getStats } from '../controllers/teacher.controller';

const router = Router();

router.get('/stats', getStats);

export default router;
