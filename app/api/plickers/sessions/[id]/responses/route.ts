import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

// POST /api/plickers/sessions/[id]/responses
// Body: { questionId, cardNumber, answer, studentId? }
// Called by the Flask Plickers scanner after each card scan
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { questionId, cardNumber, answer, studentId } = body;

    if (!questionId || !cardNumber || !answer) {
      return NextResponse.json(
        { error: 'questionId, cardNumber, và answer là bắt buộc' },
        { status: 400 }
      );
    }

    const validAnswers = ['A', 'B', 'C', 'D'];
    if (!validAnswers.includes(answer.toUpperCase())) {
      return NextResponse.json({ error: 'answer phải là A, B, C hoặc D' }, { status: 400 });
    }

    let resolvedStudentId = studentId;

    if (!resolvedStudentId) {
      // Auto-resolve student based on card mapping
      const session = await prisma.plickersSession.findUnique({
        where: { id: params.id },
        select: { courseId: true }
      });
      if (session?.courseId) {
        const enrollment = await prisma.enrollment.findFirst({
          where: { courseId: session.courseId, plickerCardId: Number(cardNumber) }
        });
        if (enrollment) {
          resolvedStudentId = enrollment.userId;
        }
      }
    }

    // Upsert — nếu thẻ đã quét cho câu này, cập nhật đáp án
    const response = await prisma.plickersResponse.upsert({
      where: {
        questionId_cardNumber: {
          questionId,
          cardNumber: Number(cardNumber),
        },
      },
      update: {
        answer: answer.toUpperCase(),
        studentId: resolvedStudentId || null,
        scannedAt: new Date(),
      },
      create: {
        sessionId: params.id,
        questionId,
        cardNumber: Number(cardNumber),
        answer: answer.toUpperCase(),
        studentId: resolvedStudentId || null,
      },
    });

    return NextResponse.json({ data: response }, { status: 201 });
  } catch (error) {
    console.error('[Plickers] POST response error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/plickers/sessions/[id]/responses
// Returns all responses for a session
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const responses = await prisma.plickersResponse.findMany({
      where: { sessionId: params.id },
      orderBy: { scannedAt: 'asc' },
    });

    return NextResponse.json({ data: responses });
  } catch (error) {
    console.error('[Plickers] GET responses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
