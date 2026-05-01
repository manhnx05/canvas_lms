import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/src/middleware/auth';
import prisma from '@/src/lib/prisma';
import { withErrorHandler } from '@/src/utils/errorHandler';
import { validateRequestBody, validateUUID, updateEnrollmentSchema } from '@/src/lib/validations';
import { sanitizeRequestBody } from '@/src/middleware/sanitization';

// GET /api/courses/[id]/enrollments
export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req);
  const { id } = await params;
  
  // Validate course ID
  const courseId = validateUUID(id, 'Course ID');
  
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
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
export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, ['teacher']);
  const { id } = await params;
  
  // Validate course ID
  const courseId = validateUUID(id, 'Course ID');
  
  // Sanitize and validate request body
  const sanitizedBody = await sanitizeRequestBody(req);
  if (!sanitizedBody) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  
  const validatedData = validateRequestBody(updateEnrollmentSchema, sanitizedBody);
  const { enrollmentId, plickerCardId } = validatedData;

  // Validate enrollment ID
  validateUUID(enrollmentId, 'Enrollment ID');

  // Check for duplicate plickerCardId in the same course (if provided)
  if (plickerCardId !== null && plickerCardId !== undefined) {
    const duplicate = await prisma.enrollment.findFirst({
      where: {
        courseId,
        plickerCardId: plickerCardId,
        id: { not: enrollmentId } // Exclude current enrollment
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    if (duplicate) {
      return NextResponse.json({ 
        error: `Thẻ số ${plickerCardId} đã được gán cho học sinh ${duplicate.user.name}. Vui lòng chọn số thẻ khác.` 
      }, { status: 400 });
    }
  }

  // Ensure enrollment belongs to this course and update
  const enrollment = await prisma.enrollment.update({
    where: { 
      id: enrollmentId,
      courseId // Security check
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
