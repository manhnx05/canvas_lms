import { NextResponse } from 'next/server';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler } from '@/src/utils/errorHandler';
import { examService } from '@/src/services/examService';

export const POST = withErrorHandler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireAuth(req, ['student', 'teacher']);
  const { id } = await params;
  const attempt = await examService.startExamAttempt(id, user.id, user.role);
  return NextResponse.json(attempt);
});
