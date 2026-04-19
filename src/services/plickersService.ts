import prisma from '@/src/lib/prisma';

export const plickersService = {
  /**
   * Tính toán điểm, lưu sổ điểm (Assignment) và cộng sao Gamification
   * khi kết thúc một phiên Plickers.
   */
  async processSessionEnd(session: any) {
    if (!session || !session.courseId || session.status !== 'ended') return;

    try {
      // 1. Tải mappings thẻ của Course
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: session.courseId, plickerCardId: { not: null } },
        include: { user: true }
      });

      const cardToUserMap: Record<number, string> = {};
      enrollments.forEach((e: any) => {
        if (e.plickerCardId) cardToUserMap[e.plickerCardId] = e.userId;
      });

      // 2. Lấy đáp án đúng của câu hỏi
      const correctAnswers: Record<string, string> = {};
      session.questions.forEach((q: any) => {
        if (q.correctAnswer) correctAnswers[q.id] = q.correctAnswer;
      });

      // 3. Tính điểm cho từng học sinh
      const studentScores: Record<string, number> = {};
      session.responses.forEach((r: any) => {
        const userId = cardToUserMap[r.cardNumber];
        if (userId) {
          const isCorrect = correctAnswers[r.questionId] === r.answer;
          if (isCorrect) {
            studentScores[userId] = (studentScores[userId] || 0) + 1;
          } else {
            // Học sinh có quét thẻ nhưng trả lời sai 
            if (studentScores[userId] === undefined) {
              studentScores[userId] = 0;
            }
          }
        }
      });

      // 4. Khởi tạo sổ điểm (Assignment)
      const course = await prisma.course.findUnique({ where: { id: session.courseId } });
      let assignment = null;
      if (course) {
        assignment = await prisma.assignment.create({
          data: {
            title: `[Plickers] ${session.title}`,
            courseId: session.courseId,
            courseName: course.title,
            dueDate: new Date().toISOString(),
            starsReward: session.questions.length * 5,
            status: 'closed',
            type: 'quiz',
            description: `Bài kiểm tra Plickers nhanh trên lớp (Tổng: ${session.questions.length} câu).`,
          }
        });
      }

      // 5. Build DBOperations
      const dbOperations = [];
      for (const [userId, score] of Object.entries(studentScores)) {
        const scaledScore = session.questions.length > 0 ? Math.round((score / session.questions.length) * 100) : 0;
        
        if (assignment) {
          dbOperations.push(
            prisma.submission.create({
              data: {
                assignmentId: assignment.id,
                userId,
                status: 'graded',
                score: scaledScore,
                aiFeedback: `Đã trả lời đúng ${score}/${session.questions.length} câu trên lớp bằng thẻ Plickers.`
              }
            })
          );
        }

        if (score > 0) {
          const starsToAward = score * 5;
          dbOperations.push(
            prisma.user.update({
              where: { id: userId },
              data: { stars: { increment: starsToAward } }
            })
          );

          dbOperations.push(
            prisma.notification.create({
              data: {
                userId,
                title: 'Thưởng Sao Plickers! 🌟',
                content: `Bạn vừa trả lời đúng ${score} câu trong phiên Plickers "${session.title}" và nhận được ${starsToAward} sao!`,
              }
            })
          );
        }
      }

      if (dbOperations.length > 0) {
        await prisma.$transaction(dbOperations);
      }
      
      return true;
    } catch (err) {
      console.error('[Plickers] Lỗi khi trao phần thưởng/sổ điểm:', err);
      throw err; // Ném ra để Test có thể bắt được
    }
  }
};
