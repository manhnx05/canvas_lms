import { NextResponse } from 'next/server';
import { requireAuth } from '@/src/middleware/auth';
import prisma from '@/src/lib/prisma';
import { withErrorHandler } from '@/src/utils/errorHandler';

// GET /api/courses/[id]/enrollments
export const GET = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req);
  const { id } = await params;
  
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          className: true,
          avatar: true
        }
      }
    },
    orderBy: {
      user: { name: 'asc' }
    }
  });
  
  return NextResponse.json({ data: enrollments });
});

// PATCH /api/courses/[id]/enrollments
// Expected body: { enrollmentId: string, plickerCardId: number | null }
export const PATCH = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, ['teacher']);
  const { id } = await params;
  
  const body = await req.json();
  const { enrollmentId, plickerCardId } = body;
  
  if (!enrollmentId) {
    return NextResponse.json({ error: 'enrollmentId là bắt buộc' }, { status: 400 });
  }

  // Ensure enrollment belongs to this course
  const enrollment = await prisma.enrollment.update({
    where: { 
      id: enrollmentId,
      courseId: id // Security check
    },
    data: {
      plickerCardId: plickerCardId !== undefined ? plickerCardId : null
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          className: true,
          avatar: true
        }
      }
    }
  });
  
  return NextResponse.json({ data: enrollment });
});
