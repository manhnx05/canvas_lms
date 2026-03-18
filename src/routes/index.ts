import { Router } from 'express';
import courseRoutes from './course.routes';
import assignmentRoutes from './assignment.routes';
import conversationRoutes from './conversation.routes';
import rewardRoutes from './reward.routes';
import teacherRoutes from './teacher.routes';

const router = Router();

router.get('/health', (req, res) => res.json({ status: "ok" }));
router.use('/courses', courseRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/conversations', conversationRoutes);
router.use('/rewards', rewardRoutes);
router.use('/teacher', teacherRoutes);

export default router;
