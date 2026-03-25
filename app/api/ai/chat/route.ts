import { NextResponse } from 'next/server';
import { aiService } from '@/src/services/aiService';
import { requireAuth } from '@/src/middleware/auth';
import { aiChatSchema, validateRequestBody } from '@/src/lib/validations';
import { withErrorHandler } from '@/src/utils/errorHandler';

export const POST = withErrorHandler(async (req: Request) => {
  await requireAuth(req);
  
  const body = await req.json();
  const validatedData = validateRequestBody(aiChatSchema, body);
  
  const reply = await aiService.chat(validatedData);
  return NextResponse.json({ reply });
});
