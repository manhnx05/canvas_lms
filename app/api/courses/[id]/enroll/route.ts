import { NextResponse } from 'next/server';
import { courseService } from '@/src/services/courseService';
import { requireAuth } from '@/src/middleware/auth';
import { enrollmentSchema, validateRequestBody, validateUUID } from '@/src/lib/validations';
import { withErrorHandler } from '@/src/utils/errorHandler';

export const POST = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireAuth(req, ['teacher']); // Only teachers can enroll users
  
  validateUUID(params.id, 'Course ID');
  
  const body = await req.json();
  const { userId } = validateRequestBody(enrollmentSchema.pick({ userId: true }), body);
  
  const enrollment = await courseService.enrollUser(params.id, userId);
  return NextResponse.json(enrollment);
});
