import { NextResponse } from 'next/server';
import { examService } from '@/src/services/examService';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler } from '@/src/utils/errorHandler';

export const GET = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req, ['student', 'teacher']);
  const { searchParams } = new URL(req.url);
  const query: any = {};
  
  const courseId = searchParams.get('courseId');
  const subject = searchParams.get('subject');
  const grade = searchParams.get('grade');
  const createdBy = searchParams.get('createdBy');
  const status = searchParams.get('status');
  
  if (courseId) query.courseId = courseId;
  if (subject) query.subject = subject;
  if (grade) query.grade = grade;
  if (createdBy) query.createdBy = createdBy;
  if (status) query.status = status;
  
  // Students get their attempt status attached
  if (user.role === 'student') query.userId = user.id;
  
  const exams = await examService.getExams(query);
  return NextResponse.json(exams);
});

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const exam = await examService.createExam(data);
    return NextResponse.json(exam, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
