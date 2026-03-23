import { NextResponse } from 'next/server';
import { examService } from '@/src/services/examService';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const exam = await examService.getExamById(params.id);
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    return NextResponse.json(exam);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const exam = await examService.updateExam(params.id, data);
    return NextResponse.json(exam);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await examService.deleteExam(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
