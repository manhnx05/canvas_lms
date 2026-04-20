import prisma from '@/src/lib/prisma';

export const plickersService = {
  /**
   * Tính toán điểm, lưu sổ điểm (Assignment) và cộng sao Gamification
   * khi kết thúc một phiên Plickers.
   */
  async processSessionEnd(session: any) {
    if (!session || !session.courseId || session.status !== 'ended') {
      console.log('[Plickers] Bỏ qua processSessionEnd: session không hợp lệ hoặc chưa kết thúc');
      return;
    }

    console.log(`[Plickers] Bắt đầu xử lý kết thúc phiên: ${session.id} - ${session.title}`);

    try {
      // 1. Tải mappings thẻ của Course và danh sách tất cả học sinh
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: session.courseId },
        include: { user: true }
      });

      if (enrollments.length === 0) {
        console.log('[Plickers] Không có học sinh nào trong khóa học');
        return;
      }

      // Map cardNumber -> userId (chỉ những học sinh có thẻ)
      const cardToUserMap: Record<number, string> = {};
      const allStudentIds = new Set<string>();
      
      enrollments.forEach((e: any) => {
        allStudentIds.add(e.userId);
        if (e.plickerCardId) {
          cardToUserMap[e.plickerCardId] = e.userId;
        }
      });

      console.log(`[Plickers] Tổng số học sinh: ${allStudentIds.size}, Có thẻ: ${Object.keys(cardToUserMap).length}`);

      // 2. Lấy đáp án đúng của câu hỏi
      const correctAnswers: Record<string, string> = {};
      session.questions.forEach((q: any) => {
        if (q.correctAnswer) correctAnswers[q.id] = q.correctAnswer;
      });

      const totalQuestions = session.questions.length;
      console.log(`[Plickers] Tổng số câu hỏi: ${totalQuestions}`);

      // 3. Tính điểm cho từng học sinh đã trả lời
      const studentScores: Record<string, number> = {};
      const participatedStudents = new Set<string>();

      session.responses.forEach((r: any) => {
        const userId = cardToUserMap[r.cardNumber];
        if (userId) {
          participatedStudents.add(userId);
          const isCorrect = correctAnswers[r.questionId] === r.answer;
          if (isCorrect) {
            studentScores[userId] = (studentScores[userId] || 0) + 1;
          } else {
            // Đảm bảo học sinh có entry ngay cả khi trả lời sai
            if (studentScores[userId] === undefined) {
              studentScores[userId] = 0;
            }
          }
        }
      });

      // Xác định học sinh không tham gia (có thẻ nhưng không quét)
      const nonParticipants = Object.values(cardToUserMap).filter(
        userId => !participatedStudents.has(userId)
      );

      console.log(`[Plickers] Học sinh tham gia: ${participatedStudents.size}, Không tham gia: ${nonParticipants.length}`);

      // 4. Tạo Assignment trong transaction
      const course = await prisma.course.findUnique({ where: { id: session.courseId } });
      if (!course) {
        console.error('[Plickers] Không tìm thấy khóa học');
        return;
      }

      // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
      await prisma.$transaction(async (tx) => {
        // Tạo Assignment
        const assignment = await tx.assignment.create({
          data: {
            title: `[Plickers] ${session.title}`,
            courseId: session.courseId,
            courseName: course.title,
            dueDate: new Date().toISOString(),
            starsReward: totalQuestions * 5,
            status: 'closed',
            type: 'quiz',
            description: `Bài kiểm tra Plickers nhanh trên lớp (Tổng: ${totalQuestions} câu).`,
          }
        });

        console.log(`[Plickers] Đã tạo Assignment: ${assignment.id}`);

        // Tạo submissions và notifications song song
        const operations = [];

        // Xử lý học sinh đã tham gia
        for (const [userId, score] of Object.entries(studentScores)) {
          const scaledScore = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
          
          // Tạo submission
          operations.push(
            tx.submission.create({
              data: {
                assignmentId: assignment.id,
                userId,
                status: 'graded',
                score: scaledScore,
                aiFeedback: `Đã trả lời đúng ${score}/${totalQuestions} câu trên lớp bằng thẻ Plickers.`
              }
            })
          );

          // Trao sao và thông báo nếu có điểm
          if (score > 0) {
            const starsToAward = score * 5;
            
            operations.push(
              tx.user.update({
                where: { id: userId },
                data: { stars: { increment: starsToAward } }
              })
            );

            operations.push(
              tx.notification.create({
                data: {
                  userId,
                  title: 'Thưởng Sao Plickers! 🌟',
                  content: `Bạn vừa trả lời đúng ${score} câu trong phiên Plickers "${session.title}" và nhận được ${starsToAward} sao!`,
                }
              })
            );
          } else {
            // Thông báo cho học sinh trả lời sai hết
            operations.push(
              tx.notification.create({
                data: {
                  userId,
                  title: 'Kết quả Plickers',
                  content: `Bạn đã tham gia phiên Plickers "${session.title}" nhưng chưa trả lời đúng câu nào. Hãy cố gắng hơn lần sau nhé!`,
                }
              })
            );
          }
        }

        // Xử lý học sinh không tham gia
        for (const userId of nonParticipants) {
          // Tạo submission với điểm 0
          operations.push(
            tx.submission.create({
              data: {
                assignmentId: assignment.id,
                userId,
                status: 'graded',
                score: 0,
                aiFeedback: 'Không tham gia phiên Plickers trên lớp.'
              }
            })
          );

          // Thông báo nhắc nhở
          operations.push(
            tx.notification.create({
              data: {
                userId,
                title: 'Vắng mặt Plickers ⚠️',
                content: `Bạn đã không tham gia phiên Plickers "${session.title}". Hãy chú ý tham gia đầy đủ các hoạt động trên lớp nhé!`,
              }
            })
          );
        }

        // Thực thi tất cả operations song song
        await Promise.all(operations);
        
        console.log(`[Plickers] Đã tạo ${operations.length} operations thành công`);
      });

      console.log(`[Plickers] Hoàn thành xử lý phiên ${session.id}`);
      return true;
    } catch (err) {
      console.error('[Plickers] Lỗi khi trao phần thưởng/sổ điểm:', err);
      throw err;
    }
  }
};
