import { Router } from 'express';
import courseRoutes from './course.routes';
import assignmentRoutes from './assignment.routes';
import conversationRoutes from './conversation.routes';
import rewardRoutes from './reward.routes';
import teacherRoutes from './teacher.routes';
import authRoutes from './auth.routes';
import notificationRoutes from './notification.routes';
import userRoutes from './user.routes';

const router = Router();

router.get('/health', (req, res) => res.json({ status: "ok" }));
router.use('/courses', courseRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/conversations', conversationRoutes);
router.use('/rewards', rewardRoutes);
router.use('/teacher', teacherRoutes);
router.use('/auth', authRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);

export default router;
