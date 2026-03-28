import { NextResponse } from 'next/server';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler } from '@/src/utils/errorHandler';
import { generateExamFromTextbook } from '@/src/lib/exam.ai.service';

export const POST = withErrorHandler(async (req: Request) => {
  await requireAuth(req, ['teacher']);
  
  const body = await req.json();
  const questions = await generateExamFromTextbook(body);
  
  return NextResponse.json({ questions });
});
