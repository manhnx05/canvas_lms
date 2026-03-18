import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean up sequentially to avoid foreign key constraints violations
  await prisma.message.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.lecture.deleteMany();
  await prisma.course.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("123456", 10);

  // Create Users
  const studentAn = await prisma.user.create({
    data: { id: "stu1", name: "Bé An", email: "hocsinh@gmail.com", password: hashedPassword, role: "student", stars: 120, className: "Lớp 3A" }
  });

  const teacherDiep = await prisma.user.create({
    data: { id: "t1", name: "Cô Nguyễn Thị Ngọc Điệp", email: "ngocdiep@gmail.com", password: hashedPassword, role: "teacher", className: "Tất cả các môn" }
  });

  // Create Courses
  const c1 = await prisma.course.create({ data: { id: "c1", title: "Toán học", color: "bg-blue-500", icon: "Calculator", teacher: "Cô Nguyễn Thị Ngọc Điệp", studentsCount: 35, progress: 75, description: "Học đếm, các phép tính cơ bản." } });
  const c2 = await prisma.course.create({ data: { id: "c2", title: "Tiếng Việt", color: "bg-rose-500", icon: "BookOpen", teacher: "Cô Nguyễn Thị Ngọc Điệp", studentsCount: 35, progress: 60, description: "Học chữ cái, đánh vần." } });
  const c3 = await prisma.course.create({ data: { id: "c3", title: "Tự nhiên & Xã hội", color: "bg-emerald-500", icon: "Leaf", teacher: "Cô Nguyễn Thị Ngọc Điệp", studentsCount: 35, progress: 90, description: "Khám phá môi trường." } });

  // Link Enrollment
  await prisma.enrollment.createMany({
    data: [
      { userId: studentAn.id, courseId: "c1" },
      { userId: studentAn.id, courseId: "c2" },
      { userId: studentAn.id, courseId: "c3" },
      { userId: teacherDiep.id, courseId: "c1" },
      { userId: teacherDiep.id, courseId: "c2" },
      { userId: teacherDiep.id, courseId: "c3" },
    ]
  });

  // Create Lectures
  await prisma.lecture.create({ data: { title: "Bài 1: Phép cộng trong phạm vi 10", content: "Các con hãy chú ý cách đếm ngón tay nhé.", courseId: "c1" }});
  await prisma.lecture.create({ data: { title: "Bài 2: Nhận biết hình học", content: "Phân biệt hình vuông, hình tròn, hình tam giác.", courseId: "c1" }});
  await prisma.lecture.create({ data: { title: "Tập đọc: Cháu nghe chú đánh đàn", content: "Đọc to rõ chữ, ngắt nhịp đúng chỗ.", courseId: "c2" }});

  // Create Announcements
  await prisma.announcement.create({ data: { title: "Chào mừng các con đến với môn Toán!", content: "Hôm nay chúng ta sẽ bắt đầu học chuyên đề mới nhé. Mọi người chú ý làm bài đầy đủ.", date: "15/03/2026", courseId: "c1" }});
  await prisma.announcement.create({ data: { title: "Nhắc nhở nộp bài tuần 4", content: "Thứ sáu lớp mình sẽ chốt sổ kiểm tra nhanh 15 phút. Bạn nào chưa nộp thì nhớ nộp nha.", date: "16/03/2026", courseId: "c1" }});

  // Create Assignments
  await prisma.assignment.create({ data: { id: "a1", title: "Bảng cửu chương 5", courseId: "c1", courseName: "Toán học", dueDate: "Hôm nay, 20:00", starsReward: 5, status: "pending", type: "quiz", description: "Bé hãy ôn tập và làm bài kiểm tra nhanh về bảng của chương 5 nhé." } });
  await prisma.assignment.create({ data: { id: "a2", title: "Tập chép: Cháu nghe", courseId: "c2", courseName: "Tiếng Việt", dueDate: "Ngày mai", starsReward: 10, status: "pending", type: "writing", description: "Luyện chữ đẹp." } });

  // Create Rewards
  await prisma.reward.create({ data: { id: "r1", title: "Chăm chỉ", description: "Hoàn thành 5 bài tập liên tiếp", icon: "Star", color: "text-amber-500 bg-amber-100", dateEarned: "15/03/2026" } });

  // Create Conversations
  const conv1 = await prisma.conversation.create({ data: { id: "conv1", unreadCount: 1 } });
  await prisma.participant.createMany({
    data: [
      { conversationId: "conv1", userId: studentAn.id },
      { conversationId: "conv1", userId: teacherDiep.id },
    ]
  });
  await prisma.message.create({ data: { id: "m0", conversationId: "conv1", senderId: studentAn.id, content: "Cô ơi em nộp bài trễ xíu nhé, nha bị mất điện ạ.", timestamp: "10:00", isRead: true } });
  await prisma.message.create({ data: { id: "m1", conversationId: "conv1", senderId: teacherDiep.id, content: "Được em nhé.", timestamp: "10:30", isRead: false } });

  console.log("Database seeded successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
