import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { cache } from '@/src/lib/cache';
import { performanceMonitor } from '@/src/lib/performance';
import { logger } from '@/src/lib/logger';

export async function GET() {
  const startTime = performance.now();
  
  const checks: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: typeof process !== 'undefined' ? Math.floor(process.uptime()) : null,
    checks: {}
  };

  // Check environment variables
  checks.checks.env = {
    status: 'ok',
    variables: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    }
  };

  // Check database connection
  try {
    const dbStart = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbDuration = performance.now() - dbStart;
    
    checks.checks.database = { 
      status: 'connected', 
      message: 'Database connection successful',
      responseTime: Math.round(dbDuration)
    };
  } catch (error: any) {
    checks.status = 'error';
    checks.checks.database = { 
      status: 'error', 
      message: error.message,
      code: error.code 
    };
    logger.error('Health check: Database connection failed', error);
  }

  // Check Prisma client and get basic stats
  try {
    const [userCount, courseCount, assignmentCount] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.assignment.count()
    ]);
    
    checks.checks.prisma = { 
      status: 'ok', 
      stats: {
        users: userCount,
        courses: courseCount,
        assignments: assignmentCount
      }
    };
  } catch (error: any) {
    checks.status = 'error';
    checks.checks.prisma = { 
      status: 'error', 
      message: error.message,
      code: error.code 
    };
    logger.error('Health check: Prisma query failed', error);
  }

  // Check cache system
  try {
    const cacheStats = cache.getStats();
    checks.checks.cache = {
      status: 'ok',
      stats: cacheStats
    };
  } catch (error: any) {
    checks.checks.cache = {
      status: 'error',
      message: error.message
    };
    logger.error('Health check: Cache check failed', error);
  }

  // Check memory usage
  try {
    const memoryUsage = performanceMonitor.getMemoryUsage();
    if (memoryUsage) {
      checks.checks.memory = {
        status: 'ok',
        usage: memoryUsage
      };
      
      // Warn if memory usage is high
      if (memoryUsage.heapUsed > 500) { // > 500MB
        checks.checks.memory.warning = 'High memory usage detected';
        logger.warn('Health check: High memory usage', { memoryUsage });
      }
    }
  } catch (error: any) {
    checks.checks.memory = {
      status: 'error',
      message: error.message
    };
  }

  // Check logging system
  try {
    const logStats = logger.getStats();
    checks.checks.logging = {
      status: 'ok',
      stats: {
        total: logStats.total,
        errors: logStats.byLevel.error + logStats.byLevel.fatal,
        warnings: logStats.byLevel.warn
      }
    };
  } catch (error: any) {
    checks.checks.logging = {
      status: 'error',
      message: error.message
    };
  }

  // Overall health check duration
  const duration = Math.round(performance.now() - startTime);
  checks.duration = duration;

  // Log slow health checks
  if (duration > 1000) {
    logger.warn('Slow health check', { duration });
  }

  const statusCode = checks.status === 'ok' ? 200 : 500;
  return NextResponse.json(checks, { status: statusCode });
}
