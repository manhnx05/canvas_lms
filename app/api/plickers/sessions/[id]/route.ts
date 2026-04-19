import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

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
// Body: { status?, currentQ?, title? }
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, currentQ, title } = body;

    const updateData: Record<string, any> = {};
    if (status !== undefined) updateData.status = status;
    if (currentQ !== undefined) updateData.currentQ = currentQ;
    if (title !== undefined) updateData.title = title;

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
        // Tải mappings thẻ của Course
        const enrollments = await prisma.enrollment.findMany({
          where: { courseId: session.courseId, plickerCardId: { not: null } },
          include: { user: true }
        });

        // Tạo map: { cardNumber: userId }
        const cardToUserMap: Record<number, string> = {};
        enrollments.forEach(e => {
          if (e.plickerCardId) cardToUserMap[e.plickerCardId] = e.userId;
        });

        // Lấy đáp án đúng của câu hỏi: { questionId: correctAnswer }
        const correctAnswers: Record<string, string> = {};
        session.questions.forEach(q => {
          if (q.correctAnswer) correctAnswers[q.id] = q.correctAnswer;
        });

        // Tính điểm cho từng học sinh
        const studentScores: Record<string, number> = {};
        session.responses.forEach(r => {
          const userId = cardToUserMap[r.cardNumber];
          if (userId) {
            const isCorrect = correctAnswers[r.questionId] === r.answer;
            if (isCorrect) {
              studentScores[userId] = (studentScores[userId] || 0) + 1;
            }
          }
        });

        // Cập nhật thẻ và sao cho học sinh
        const dbOperations = [];
        for (const [userId, score] of Object.entries(studentScores)) {
          if (score > 0) {
            const starsToAward = score * 5; // 5 sao mỗi câu đúng
            
            // 1. Cộng sao
            dbOperations.push(
              prisma.user.update({
                where: { id: userId },
                data: { stars: { increment: starsToAward } }
              })
            );

            // 2. Gửi thông báo
            dbOperations.push(
              prisma.notification.create({
                data: {
                  userId,
                  title: 'Thưởng Sao Plickers! 🌟',
                  content: \`Bạn vừa trả lời đúng \${score} câu trong phiên Plickers "\${session.title}" và nhận được \${starsToAward} sao!\`,
                }
              })
            );
          }
        }

        if (dbOperations.length > 0) {
          await prisma.$transaction(dbOperations);
        }
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
