import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// GET /api/plickers/sessions?teacherId=...&courseId=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const courseId = searchParams.get('courseId');

    const where: Record<string, any> = {};
    if (teacherId) where.teacherId = teacherId;
    if (courseId) where.courseId = courseId;

    const sessions = await prisma.plickersSession.findMany({
      where,
      include: {
        questions: { orderBy: { order: 'asc' } },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: sessions });
  } catch (error) {
    console.error('[Plickers] GET sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/plickers/sessions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, courseId, teacherId, questions = [] } = body;

    if (!title || !teacherId) {
      return NextResponse.json({ error: 'title và teacherId là bắt buộc' }, { status: 400 });
    }

    const session = await prisma.plickersSession.create({
      data: {
        title,
        teacherId,
        courseId: courseId || null,
        status: 'idle',
        questions: {
          create: questions.map((q: any, idx: number) => ({
            text: q.text,
            order: q.order ?? idx,
            correctAnswer: q.correctAnswer || null,
          })),
        },
      },
      include: {
        questions: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json({ data: session }, { status: 201 });
  } catch (error) {
    console.error('[Plickers] POST session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
