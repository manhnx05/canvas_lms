import { NextResponse } from 'next/server';
import { requireAuth } from '@/src/middleware/auth';
import { createAssignmentSchema, validateRequestBody, validateUUID } from '@/src/lib/validations';
import { withErrorHandler } from '@/src/utils/errorHandler';
import prisma from '@/src/lib/prisma';

export const GET = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req);
  
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');
  const userId = searchParams.get('userId');
  
  const where: any = {};
  if (courseId) {
    validateUUID(courseId, 'Course ID');
    where.courseId = courseId;
  }
  
  if (userId) {
    validateUUID(userId, 'User ID');
  }

  // Filter: only assignments belonging to courses the user is enrolled in
  if (user.role === 'student' || user.role === 'teacher') {
    where.course = {
      enrollments: {
        some: { userId: user.id }
      }
    };
  }
  
  const assignments = await prisma.assignment.findMany({
    where,
    include: {
      course: { select: { id: true, title: true } },
      submissions: user.id ? { 
        where: { userId: user.id },
        select: { id: true, status: true, score: true, createdAt: true }
      } : false,
    },
    orderBy: { dueDate: 'asc' },
  });
  
  // Transform to match frontend expectations (mySubmission)
  const formattedAssignments = assignments.map(a => ({
    ...a,
    mySubmission: a.submissions?.[0] || null,
    submissions: undefined // Remove the array to avoid duplication/confusion
  }));

  return NextResponse.json(formattedAssignments);
});

export const POST = withErrorHandler(async (req: Request) => {
  await requireAuth(req, ['teacher']);
  
  const body = await req.json();
  const validatedData = validateRequestBody(createAssignmentSchema, body);
  
  // Verify course exists
  const course = await prisma.course.findUnique({
    where: { id: validatedData.courseId },
    include: { enrollments: true }
  });
  
  if (!course) {
    throw new Error('Không tìm thấy khóa học');
  }
  
  const assignment = await prisma.assignment.create({
    data: {
      title: validatedData.title,
      description: validatedData.description ?? null,
      courseId: validatedData.courseId,
      courseName: validatedData.courseName,
      dueDate: validatedData.dueDate,
      starsReward: validatedData.starsReward,
      type: validatedData.type,
      status: 'pending',
      questions: validatedData.questions ?? []
    },
    include: {
      course: { select: { id: true, title: true } }
    }
  });

  // Gửi thông báo cho toàn bộ học sinh trong khóa học
  if (course.enrollments && course.enrollments.length > 0) {
    const notifications = course.enrollments.map(e => ({
      userId: e.userId,
      title: `Bài tập mới: ${assignment.title}`,
      content: `Giáo viên vừa giao bài tập trong lớp ${course.title}. Hạn chót nộp bài: ${assignment.dueDate}`
    }));

    await prisma.notification.createMany({
      data: notifications
    });
  }
  
  return NextResponse.json(assignment, { status: 201 });
});
