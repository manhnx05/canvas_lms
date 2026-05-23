import { NextResponse } from 'next/server';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler } from '@/src/utils/errorHandler';
import { examService } from '@/src/services/examService';

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req, ['teacher']);

  const body = await req.json();
  // Override createdBy with the authenticated user's ID to prevent client-side tampering
  const result = await examService.generateExamAIQuick({ ...body, createdBy: user.id });

  // result includes { exam, questions } from the examService which already executes prisma.create
  return NextResponse.json(result);
});
