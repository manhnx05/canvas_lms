import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler } from '@/src/utils/errorHandler';
import { HttpError } from '@/src/utils/errorHandler';

/**
 * POST /api/exams/:id/assign
 * Giáo viên giao đề thi cho một lớp học, kèm deadline và thời lượng.
 * Tự động:
 *  - Cập nhật Exam: courseId, courseName, deadline, duration, status = 'published'
 *  - Tạo Assignment trong lớp học để học sinh thấy trong tab Bài Tập
 *  - Gửi Notification đến toàn bộ học sinh đã enrolled trong lớp
 */
export const POST = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, ['teacher']);

  const { id } = await params;
  const { courseId, deadline, duration } = await req.json();

  if (!courseId) throw new HttpError(400, 'courseId là bắt buộc');

  // Kiểm tra đề thi tồn tại
  const exam = await prisma.exam.findUnique({ where: { id } });
  if (!exam) throw new HttpError(404, 'Không tìm thấy đề thi');

  // Kiểm tra lớp học tồn tại & lấy tên + danh sách học sinh
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { enrollments: true }
  });
  if (!course) throw new HttpError(404, 'Không tìm thấy lớp học');

  const deadlineDate = deadline ? new Date(deadline) : null;
  const dueDateStr = deadlineDate ? deadlineDate.toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Cập nhật Exam: gắn lớp, deadline, thời lượng, chuyển sang published
  const updatedExam = await prisma.exam.update({
    where: { id },
    data: {
      courseId,
      courseName: course.title,
      deadline: deadlineDate,
      duration: duration ? parseInt(duration) : exam.duration,
      status: 'published'
    }
  });

  // Tạo Assignment để học sinh thấy trong tab "Bài Tập" của lớp
  const assignment = await prisma.assignment.create({
    data: {
      title: exam.title,
      description: `Bài kiểm tra ${exam.subject} — Thời gian làm bài: ${updatedExam.duration} phút`,
      courseId,
      courseName: course.title,
      dueDate: dueDateStr,
      starsReward: exam.totalScore,
      type: 'quiz',
      status: 'published',
      questions: exam.questions as any
    }
  });

  // Gửi Notification cho toàn bộ học sinh trong lớp
  if (course.enrollments.length > 0) {
    const deadlineText = deadlineDate
      ? deadlineDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      : 'Không giới hạn';

    await prisma.notification.createMany({
      data: course.enrollments.map(e => ({
        userId: e.userId,
        title: `📝 Đề thi mới: ${exam.title}`,
        content: `Giáo viên vừa giao đề thi trong lớp ${course.title}. Thời gian làm bài: ${updatedExam.duration} phút. Hạn nộp: ${deadlineText}.`
      }))
    });
  }

  return NextResponse.json({
    exam: updatedExam,
    assignment,
    notified: course.enrollments.length
  }, { status: 200 });
});
