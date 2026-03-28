import { NextResponse } from 'next/server';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler } from '@/src/utils/errorHandler';
import { generateExamFromTextbook } from '@/src/lib/exam.ai.service';
import prisma from '@/src/lib/prisma';

export const POST = withErrorHandler(async (req: Request) => {
  await requireAuth(req, ['teacher']);
  
  const body = await req.json();
  const questions = await generateExamFromTextbook(body);
  
  const exam = await prisma.exam.create({
    data: {
      title: body.title || `Đề thi ${body.subject} (Theo SGK)`,
      subject: body.subject,
      grade: body.grade,
      duration: parseInt(body.duration) || 45,
      totalScore: parseInt(body.totalScore) || 10,
      difficulty: body.difficulty || 'medium',
      questions: questions as any,
      createdBy: body.createdBy || '',
      status: 'draft',
    }
  });
  
  return NextResponse.json({ exam, questions });
});
