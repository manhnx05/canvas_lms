import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function GET() {
  const checks: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {}
  };

  // Check environment variables
  checks.checks.env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    JWT_SECRET: !!process.env.JWT_SECRET,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
  };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = { status: 'connected', message: 'Database connection successful' };
  } catch (error: any) {
    checks.status = 'error';
    checks.checks.database = { 
      status: 'error', 
      message: error.message,
      code: error.code 
    };
  }

  // Check Prisma client
  try {
    const userCount = await prisma.user.count();
    checks.checks.prisma = { status: 'ok', userCount };
  } catch (error: any) {
    checks.status = 'error';
    checks.checks.prisma = { 
      status: 'error', 
      message: error.message,
      code: error.code 
    };
  }

  const statusCode = checks.status === 'ok' ? 200 : 500;
  return NextResponse.json(checks, { status: statusCode });
}
