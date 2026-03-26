import { NextResponse } from 'next/server';
import { courseService } from '@/src/services/courseService';
import { requireAuth } from '@/src/middleware/auth';
import { updateCourseSchema, validateRequestBody, validateUUID } from '@/src/lib/validations';
import { withErrorHandler } from '@/src/utils/errorHandler';

export const GET = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req);
  const { id } = await params;
  
  validateUUID(id, 'Course ID');
  
  const course = await courseService.getCourseById(id);
  return NextResponse.json(course);
});

export const PUT = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireAuth(req, ['teacher']);
  const { id } = await params;
  
  validateUUID(id, 'Course ID');
  
  const body = await req.json();
  const validatedData = validateRequestBody(updateCourseSchema, body);
  
  const course = await courseService.updateCourse(id, validatedData);
  return NextResponse.json(course);
});

export const DELETE = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, ['teacher']);
  const { id } = await params;
  
  validateUUID(id, 'Course ID');
  
  await courseService.deleteCourse(id);
  return NextResponse.json({ message: 'Đã xóa lớp học thành công' });
});
