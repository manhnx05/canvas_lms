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
// Expected body: { enrollmentId: string }
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
  const { enrollmentId } = validatedData;

  // Validate enrollment ID
  validateUUID(enrollmentId, 'Enrollment ID');

  // Ensure enrollment belongs to this course and update
  const enrollment = await prisma.enrollment.update({
    where: { 
      id: enrollmentId,
      courseId // Security check
    },
    data: {},
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
