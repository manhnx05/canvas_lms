import { NextResponse } from 'next/server';
import { courseService } from '@/src/services/courseService';
import { requireAuth } from '@/src/middleware/auth';
import { validateUUID } from '@/src/lib/validations';
import { withErrorHandler } from '@/src/utils/errorHandler';

export const GET = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req);
  const { id } = await params;
  
  validateUUID(id, 'Course ID');
  
  const course = await courseService.getCourseById(id);
  return NextResponse.json(course);
});
