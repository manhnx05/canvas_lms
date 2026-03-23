import { NextResponse } from 'next/server';
import { examService } from '@/src/services/examService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const moduleId = searchParams.get('moduleId');
    
    if (moduleId) {
      const exams = await examService.getExamsByModule(moduleId);
      return NextResponse.json(exams);
    }
    if (courseId) {
      const exams = await examService.getExamsByCourse(courseId);
      return NextResponse.json(exams);
    }
    
    // Logic cho học sinh (chờ làm)
    return NextResponse.json([]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const exam = await examService.createExam(data);
    return NextResponse.json(exam, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
