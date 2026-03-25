import { NextResponse } from 'next/server';
import { courseService } from '@/src/services/courseService';
import { requireAuth } from '@/src/middleware/auth';
import { enrollmentSchema, validateRequestBody, validateUUID } from '@/src/lib/validations';
import { withErrorHandler } from '@/src/utils/errorHandler';

export const POST = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, ['teacher']); // Only teachers can enroll users
  const { id } = await params;
  
  validateUUID(id, 'Course ID');
  
  const body = await req.json();
  const { userId } = validateRequestBody(enrollmentSchema.pick({ userId: true }), body);
  
  const enrollment = await courseService.enrollUser(id, userId);
  return NextResponse.json(enrollment);
});
