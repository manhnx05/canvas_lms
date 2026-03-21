import { Router } from 'express';
import courseRoutes from './course.routes';
import assignmentRoutes from './assignment.routes';
import conversationRoutes from './conversation.routes';
import rewardRoutes from './reward.routes';
import teacherRoutes from './teacher.routes';
import authRoutes from './auth.routes';
import notificationRoutes from './notification.routes';
import userRoutes from './user.routes';
import aiRoutes from './ai.routes';
import examRoutes from './exam.routes';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
router.use('/auth', authRoutes);

// Protected routes (authMiddleware is a passthrough scaffold – add JWT later)
router.use('/ai', authMiddleware, aiRoutes);
router.use('/courses', authMiddleware, courseRoutes);
router.use('/assignments', authMiddleware, assignmentRoutes);
router.use('/conversations', authMiddleware, conversationRoutes);
router.use('/rewards', authMiddleware, rewardRoutes);
router.use('/teacher', authMiddleware, teacherRoutes);
router.use('/notifications', authMiddleware, notificationRoutes);
router.use('/users', authMiddleware, userRoutes);
router.use('/exams', authMiddleware, examRoutes);

export default router;
