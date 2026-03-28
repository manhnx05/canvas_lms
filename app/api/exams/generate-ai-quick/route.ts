import { NextResponse } from 'next/server';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler } from '@/src/utils/errorHandler';
import { examService } from '@/src/services/examService';

export const POST = withErrorHandler(async (req: Request) => {
  await requireAuth(req, ['teacher']);
  
  const body = await req.json();
  const result = await examService.generateExamAIQuick(body);
  
  // result includes { exam, questions } from the examService which already executes prisma.create
  return NextResponse.json(result);
});
