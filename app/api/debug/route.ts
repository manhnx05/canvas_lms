import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function GET(req: Request) {
  // Only allow in development or with secret key
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  
  if (process.env.NODE_ENV === 'production' && secret !== process.env.DEBUG_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const debug: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };

  // Environment variables check (without exposing values)
  debug.env = {
    DATABASE_URL: {
      exists: !!process.env.DATABASE_URL,
      length: process.env.DATABASE_URL?.length || 0,
      startsWithPostgresql: process.env.DATABASE_URL?.startsWith('postgresql://') || false,
    },
    JWT_SECRET: {
      exists: !!process.env.JWT_SECRET,
      length: process.env.JWT_SECRET?.length || 0,
      isLongEnough: (process.env.JWT_SECRET?.length || 0) >= 32,
    },
    GEMINI_API_KEY: {
      exists: !!process.env.GEMINI_API_KEY,
      length: process.env.GEMINI_API_KEY?.length || 0,
    },
    RESEND_API_KEY: {
      exists: !!process.env.RESEND_API_KEY,
      length: process.env.RESEND_API_KEY?.length || 0,
    },
    NODE_ENV: process.env.NODE_ENV,
  };

  // Prisma check
  try {
    debug.prisma = {
      status: 'checking',
      clientVersion: prisma.$version || 'unknown',
    };
    
    // Test database connection
    await prisma.$connect();
    debug.prisma.connection = 'connected';
    
    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    debug.prisma.queryTest = 'success';
    
    // Count users
    const userCount = await prisma.user.count();
    debug.prisma.userCount = userCount;
    
    // Count courses
    const courseCount = await prisma.course.count();
    debug.prisma.courseCount = courseCount;
    
    debug.prisma.status = 'ok';
  } catch (error: any) {
    debug.prisma = {
      status: 'error',
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }
    };
  } finally {
    await prisma.$disconnect();
  }

  // Test course service
  try {
    const { courseService } = await import('@/src/services/courseService');
    debug.courseService = {
      status: 'loaded',
      methods: Object.keys(courseService),
    };
  } catch (error: any) {
    debug.courseService = {
      status: 'error',
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }
    };
  }

  // Test auth middleware
  try {
    const { requireAuth } = await import('@/src/middleware/auth');
    debug.authMiddleware = {
      status: 'loaded',
      type: typeof requireAuth,
    };
  } catch (error: any) {
    debug.authMiddleware = {
      status: 'error',
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }
    };
  }

  return NextResponse.json(debug, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  });
}
