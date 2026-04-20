import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { withErrorHandler, HttpError } from '@/src/utils/errorHandler';

// POST /api/plickers/sessions/[id]/responses
// Body: { cardNumber: number, questionId: string, answer: 'A' | 'B' | 'C' | 'D' }
export const POST = withErrorHandler(async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: sessionId } = await params;
  const body = await req.json();
  const { cardNumber, questionId, answer } = body;

  // Validation
  if (!cardNumber || typeof cardNumber !== 'number') {
    throw new HttpError(400, 'cardNumber là bắt buộc và phải là số');
  }

  if (!questionId || typeof questionId !== 'string') {
    throw new HttpError(400, 'questionId là bắt buộc');
  }

  if (!answer || !['A', 'B', 'C', 'D'].includes(answer)) {
    throw new HttpError(400, 'answer phải là A, B, C hoặc D');
  }

  // Check session exists and is active
  const session = await prisma.plickersSession.findUnique({
    where: { id: sessionId },
    include: { questions: true }
  });

  if (!session) {
    throw new HttpError(404, 'Phiên Plickers không tồn tại');
  }

  if (session.status !== 'active') {
    throw new HttpError(400, 'Phiên không ở trạng thái active, không thể nhận câu trả lời');
  }

  // Check question belongs to session
  const question = session.questions.find(q => q.id === questionId);
  if (!question) {
    throw new HttpError(400, 'Câu hỏi không thuộc phiên này');
  }

  // Validate cardNumber is enrolled in course (if courseId exists)
  if (session.courseId) {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId: session.courseId,
        plickerCardId: cardNumber
      }
    });

    if (!enrollment) {
      throw new HttpError(400, `Thẻ số ${cardNumber} chưa được gán cho học sinh nào trong lớp này`);
    }
  }

  // Check for duplicate response (unique constraint: questionId + cardNumber)
  const existing = await prisma.plickersResponse.findFirst({
    where: {
      questionId,
      cardNumber
    }
  });

  if (existing) {
    // Update existing response instead of creating duplicate
    const updated = await prisma.plickersResponse.update({
      where: { id: existing.id },
      data: { answer }
    });

    return NextResponse.json({
      data: updated,
      message: 'Đã cập nhật câu trả lời'
    });
  }

  // Create new response
  const response = await prisma.plickersResponse.create({
    data: {
      sessionId,
      questionId,
      cardNumber,
      answer
    }
  });

  return NextResponse.json({
    data: response,
    message: 'Đã ghi nhận câu trả lời'
  }, { status: 201 });
});

// GET /api/plickers/sessions/[id]/responses
// Get all responses for a session
export const GET = withErrorHandler(async (
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: sessionId } = await params;

  const responses = await prisma.plickersResponse.findMany({
    where: { sessionId },
    orderBy: { scannedAt: 'asc' },
    include: {
      question: {
        select: {
          id: true,
          text: true,
          correctAnswer: true,
          order: true
        }
      }
    }
  });

  return NextResponse.json({ data: responses });
});
