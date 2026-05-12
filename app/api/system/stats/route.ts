import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/src/middleware/auth';
import { performanceMonitor } from '@/src/lib/performance';
import { logger } from '@/src/lib/logger';
import { cache } from '@/src/lib/cache';
import prisma from '@/src/lib/prisma';

/**
 * GET /api/system/stats
 * Get system statistics and performance metrics
 * Requires teacher authentication
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Không có token xác thực' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Chỉ giáo viên mới có quyền truy cập' },
        { status: 403 }
      );
    }

    // Gather system statistics
    const stats = {
      timestamp: new Date().toISOString(),
      uptime: typeof process !== 'undefined' ? Math.floor(process.uptime()) : null,
      environment: process.env.NODE_ENV,
      
      // Performance metrics
      performance: {
        metrics: performanceMonitor.getAllStats(),
        slowOperations: performanceMonitor.getSlowOperations(1000, 10),
        memory: performanceMonitor.getMemoryUsage()
      },

      // Cache statistics
      cache: cache.getStats(),

      // Logging statistics
      logging: logger.getStats(),

      // Database statistics
      database: {
        status: 'unknown',
        stats: {}
      }
    };

    // Get database statistics
    try {
      const dbStart = performance.now();
      const [
        userCount,
        courseCount,
        assignmentCount,
        examCount,
        plickersSessionCount,
        conversationCount,
        notificationCount
      ] = await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.assignment.count(),
        prisma.exam.count(),
        prisma.plickersSession.count(),
        prisma.conversation.count(),
        prisma.notification.count()
      ]);
      
      const dbDuration = performance.now() - dbStart;

      stats.database = {
        status: 'connected',
        responseTime: Math.round(dbDuration),
        stats: {
          users: userCount,
          courses: courseCount,
          assignments: assignmentCount,
          exams: examCount,
          plickersSessions: plickersSessionCount,
          conversations: conversationCount,
          notifications: notificationCount
        }
      };
    } catch (error: any) {
      stats.database = {
        status: 'error',
        error: error.message
      };
      logger.error('System stats: Database query failed', error);
    }

    return NextResponse.json(stats);

  } catch (error: any) {
    logger.error('System stats API error', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy thống kê hệ thống' },
      { status: 500 }
    );
  }
}
