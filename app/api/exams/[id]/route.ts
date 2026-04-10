import { NextResponse } from 'next/server';
import { examService } from '@/src/services/examService';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler } from '@/src/utils/errorHandler';

export const GET = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, ['student', 'teacher']);
  const { id } = await params;
  const exam = await examService.getExamById(id);
  if (!exam) return NextResponse.json({ error: 'Không tìm thấy đề thi' }, { status: 404 });
  return NextResponse.json(exam);
});

export const PUT = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, ['teacher']);
  const { id } = await params;
  const data = await req.json();
  const exam = await examService.updateExam(id, data);
  return NextResponse.json(exam);
});

export const DELETE = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, ['teacher']);
  const { id } = await params;
  await examService.deleteExam(id);
  return new NextResponse(null, { status: 204 });
});
