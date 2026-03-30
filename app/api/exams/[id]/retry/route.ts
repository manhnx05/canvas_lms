import { NextResponse } from 'next/server';
import { examService } from '@/src/services/examService';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler } from '@/src/utils/errorHandler';

export const POST = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireAuth(req, ['student']);
  const { id } = await params;

  const attempt = await examService.retryExamAttempt(id, user.id);
  
  return NextResponse.json(attempt);
});
