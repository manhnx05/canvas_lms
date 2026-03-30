import { NextResponse } from 'next/server';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler } from '@/src/utils/errorHandler';
import { examService } from '@/src/services/examService';

export const POST = withErrorHandler(async (req, _context: any) => {
  const user = await requireAuth(req, ['student', 'teacher']);
  const { attemptId, answers } = await req.json();
  const attempt = await examService.submitExamAttempt(attemptId, user.id, answers);
  return NextResponse.json(attempt);
});
