import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { plickersService } from '@/src/services/plickersService';

// GET /api/plickers/sessions/[id]
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.plickersSession.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            responses: true,
          },
        },
        responses: { orderBy: { scannedAt: 'asc' } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session không tồn tại' }, { status: 404 });
    }

    return NextResponse.json({ data: session });
  } catch (error) {
    console.error('[Plickers] GET session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/plickers/sessions/[id]
// Body: { status?, currentQ?, title?, showAnswer?, showGraph? }
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, currentQ, title, showAnswer, showGraph } = body;

    const updateData: Record<string, any> = {};
    if (status !== undefined) updateData.status = status;
    if (currentQ !== undefined) updateData.currentQ = currentQ;
    if (title !== undefined) updateData.title = title;
    // Điều khiển màn hình chiếu từ xa (giáo viên toggle)
    if (showAnswer !== undefined) updateData.showAnswer = showAnswer;
    if (showGraph !== undefined) updateData.showGraph = showGraph;
    // Khi chuyển sang câu mới, reset trạng thái hiển thị đáp án và biểu đồ
    if (currentQ !== undefined) {
      updateData.showAnswer = false;
      updateData.showGraph = false;
    }

    const session = await prisma.plickersSession.update({
      where: { id: params.id },
      data: updateData,
      include: { 
        questions: { orderBy: { order: 'asc' } },
        responses: true
      },
    });

    // --- GAMIFICATION: Tính điểm và Trao thưởng ---
    if (status === 'ended' && session.courseId) {
      try {
        await plickersService.processSessionEnd(session);
      } catch (err) {
        console.error('[Plickers] Lỗi khi trao phần thưởng:', err);
      }
    }
    // ---------------------------------------------

    return NextResponse.json({ data: session });
  } catch (error) {
    console.error('[Plickers] PATCH session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/plickers/sessions/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.plickersSession.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Đã xóa session' });
  } catch (error) {
    console.error('[Plickers] DELETE session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
