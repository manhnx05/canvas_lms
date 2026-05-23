import { NextResponse } from 'next/server';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler } from '@/src/utils/errorHandler';
import { examService } from '@/src/services/examService';
import { HttpError } from '@/src/utils/errorHandler';

export const POST = withErrorHandler(async (req, _context: any) => {
  const user = await requireAuth(req, ['student', 'teacher']);
  const { attemptId, answers } = await req.json();

  if (!attemptId || typeof attemptId !== 'string') {
    throw new HttpError(400, 'attemptId là bắt buộc');
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    throw new HttpError(400, 'answers phải là mảng và không được rỗng');
  }

  // Validate individual answer items
  for (const ans of answers) {
    if (!ans.questionId || typeof ans.questionId !== 'string') {
      throw new HttpError(400, 'Mỗi phần tử answers phải có questionId hợp lệ');
    }
    if (ans.optionId !== undefined && typeof ans.optionId !== 'string') {
      throw new HttpError(400, 'optionId phải là chuỗi ký tự');
    }
  }

  const attempt = await examService.submitExamAttempt(attemptId, user.id, answers);
  return NextResponse.json(attempt);
});

