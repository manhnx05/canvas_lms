import { NextResponse } from 'next/server';
import { aiService } from '@/src/services/aiService';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler } from '@/src/utils/errorHandler';
import { z } from 'zod';
import { validateRequestBody } from '@/src/lib/validations';

const evaluateSubmissionSchema = z.object({
  questions: z.array(z.any()).min(1, 'Phải có ít nhất 1 câu hỏi'),
  answers: z.record(z.string()).optional(),
  studentName: z.string().max(100, 'Tên học sinh không được quá 100 ký tự').optional()
});

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req, ['teacher']);
  
  const body = await req.json();
  const validatedData = validateRequestBody(evaluateSubmissionSchema, body);
  
  const feedback = await aiService.evaluateSubmission(validatedData);
  return NextResponse.json({ feedback });
});
