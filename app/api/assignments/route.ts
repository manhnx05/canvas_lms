import { NextResponse } from 'next/server';
import { requireAuth } from '@/src/middleware/auth';
import { createAssignmentSchema, validateRequestBody, validateUUID } from '@/src/lib/validations';
import { withErrorHandler } from '@/src/utils/errorHandler';
import prisma from '@/src/lib/prisma';

export const GET = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req);
  
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');
  const userId = searchParams.get('userId') || user.id;
  
  const where: any = {};
  if (courseId) {
    validateUUID(courseId, 'Course ID');
    where.courseId = courseId;
  }
  
  validateUUID(userId, 'User ID');
  
  const assignments = await prisma.assignment.findMany({
    where,
    include: {
      course: { select: { id: true, title: true } },
      submissions: { 
        where: { userId: userId },
        select: { id: true, status: true, score: true, timestamp: true }
      },
    },
    orderBy: { dueDate: 'asc' },
  });
  
  return NextResponse.json(assignments);
});

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req, ['teacher']);
  
  const body = await req.json();
  const validatedData = validateRequestBody(createAssignmentSchema, body);
  
  // Verify course exists and user has access
  const course = await prisma.course.findFirst({
    where: {
      id: validatedData.courseId,
      enrollments: {
        some: { userId: user.id }
      }
    }
  });
  
  if (!course) {
    throw new Error('Không tìm thấy khóa học hoặc bạn không có quyền truy cập');
  }
  
  const assignment = await prisma.assignment.create({
    data: {
      title: validatedData.title,
      description: validatedData.description,
      courseId: validatedData.courseId,
      courseName: validatedData.courseName,
      dueDate: validatedData.dueDate,
      starsReward: validatedData.starsReward,
      type: validatedData.type,
      status: 'pending',
      questions: validatedData.questions
    },
    include: {
      course: { select: { id: true, title: true } }
    }
  });
  
  return NextResponse.json(assignment, { status: 201 });
});
