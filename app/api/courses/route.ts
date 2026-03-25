import { NextResponse } from 'next/server';
import { courseService } from '@/src/services/courseService';
import { requireAuth } from '@/src/middleware/auth';
import { createCourseSchema, validateRequestBody, validateUUID } from '@/src/lib/validations';
import { withErrorHandler } from '@/src/utils/errorHandler';
import prisma from '@/src/lib/prisma';

export const GET = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req);
  
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || user.id;
  
  // Validate userId if provided
  if (userId) {
    validateUUID(userId, 'User ID');
  }
  
  const courses = await courseService.getCourses(userId);
  return NextResponse.json(courses);
});

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req, ['teacher']);
  
  const body = await req.json();
  const validatedData = validateRequestBody(createCourseSchema, body);
  
  // Fetch user from db to get their name
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  
  // Set teacherId to current user if not provided
  const courseData = {
    ...validatedData,
    teacherId: validatedData.teacherId || user.id,
    teacher: validatedData.teacher || dbUser?.name || 'Giáo viên'
  };
  
  const course = await courseService.createCourse(courseData);
  return NextResponse.json(course, { status: 201 });
});
