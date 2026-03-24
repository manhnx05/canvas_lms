import { NextResponse } from 'next/server';
import { aiService } from '@/src/services/aiService';
import { requireAuth } from '@/src/middleware/auth';
import { generateQuizSchema, validateRequestBody } from '@/src/lib/validations';
import { withErrorHandler } from '@/src/utils/errorHandler';

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req, ['teacher']);
  
  const body = await req.json();
  const validatedData = validateRequestBody(generateQuizSchema, body);
  
  const questions = await aiService.generateQuiz(validatedData);
  return NextResponse.json({ questions });
});
