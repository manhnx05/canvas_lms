import { PrismaClient } from '@prisma/client';
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean up
  await prisma.message.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const studentAn = await prisma.user.create({
    data: { id: "stu1", name: "Bé An", role: "student", stars: 120, className: "Lớp 3A" }
  });

  const teacherLan = await prisma.user.create({
    data: { id: "t1", name: "Cô Lan", role: "teacher", className: "Lý, Toán" }
  });

  const teacherMinh = await prisma.user.create({
    data: { id: "t2", name: "Thầy Minh", role: "teacher", className: "Khoa học" }
  });

  const teacherHoa = await prisma.user.create({
    data: { id: "t3", name: "Cô Hoa", role: "teacher", className: "Mỹ thuật" }
  });

  const teacherJohn = await prisma.user.create({
    data: { id: "t4", name: "Thầy John", role: "teacher", className: "Tiếng Anh" }
  });

  // Create Courses
  const c1 = await prisma.course.create({ data: { id: "c1", title: "Toán học", color: "bg-blue-500", icon: "Calculator", teacher: "Cô Lan", studentsCount: 35, progress: 75, description: "Học đếm, các phép tính cơ bản và hình học." } });
  const c2 = await prisma.course.create({ data: { id: "c2", title: "Tiếng Việt", color: "bg-rose-500", icon: "BookOpen", teacher: "Cô Lan", studentsCount: 35, progress: 60, description: "Học chữ cái, đánh vần, tập đọc và viết chính tả." } });
  const c3 = await prisma.course.create({ data: { id: "c3", title: "Tự nhiên & Xã hội", color: "bg-emerald-500", icon: "Leaf", teacher: "Thầy Minh", studentsCount: 35, progress: 90, description: "Khám phá thế giới xung quanh, động vật và thực vật, nhận biết các biểu tượng thời tiết." } });
  const c4 = await prisma.course.create({ data: { id: "c4", title: "Mỹ thuật", color: "bg-amber-500", icon: "Palette", teacher: "Cô Hoa", studentsCount: 35, progress: 100, description: "Phát huy khả năng sáng tạo qua màu sắc và các hình khối cơ bản." } });
  const c5 = await prisma.course.create({ data: { id: "c5", title: "Tiếng Anh", color: "bg-indigo-500", icon: "Globe", teacher: "Thầy John", studentsCount: 35, progress: 40, description: "Làm quen với tiếng Anh cơ bản, học từ vựng qua bài hát." } });

  // Create Assignments
  await prisma.assignment.create({ data: { id: "a1", title: "Bảng cửu chương 5", courseId: "c1", courseName: "Toán học", dueDate: "Hôm nay, 20:00", starsReward: 5, status: "pending", type: "quiz", description: "Bé hãy ôn tập và làm bài kiểm tra nhanh về bảng của chương 5 nhé." } });
  await prisma.assignment.create({ data: { id: "a2", title: "Tập chép: Cháu nghe chú đánh đàn", courseId: "c2", courseName: "Tiếng Việt", dueDate: "Ngày mai", starsReward: 10, status: "pending", type: "writing", description: "Bé luyện chữ đẹp bài thơ vào vở ô ly. Sau đó nhờ ba mẹ chụp ảnh và nộp lên hệ thống." } });
  await prisma.assignment.create({ data: { id: "a3", title: "Vẽ con vật em yêu thích", courseId: "c4", courseName: "Mỹ thuật", dueDate: "Thứ 6", starsReward: 15, status: "submitted", type: "drawing", description: "Sử dụng bút sáp màu và sự sáng tạo của bé để vẽ một bức tranh về con vật bé thích nhất." } });
  await prisma.assignment.create({ data: { id: "a4", title: "Đọc to bài thơ", courseId: "c2", courseName: "Tiếng Việt", dueDate: "Đã qua", starsReward: 5, status: "graded", type: "reading", description: "Quay video bé đọc to rõ ràng bài thơ và gửi lên hệ thống." } });

  // Create Rewards
  await prisma.reward.create({ data: { id: "r1", title: "Chăm chỉ", description: "Hoàn thành 5 bài tập liên tiếp", icon: "Star", color: "text-amber-500 bg-amber-100", dateEarned: "15/03/2026" } });
  await prisma.reward.create({ data: { id: "r2", title: "Họa sĩ nhí", description: "Đạt điểm 10 môn Mỹ thuật", icon: "Palette", color: "text-rose-500 bg-rose-100", dateEarned: "10/03/2026" } });
  await prisma.reward.create({ data: { id: "r3", title: "Toán học gia", description: "Giải đúng bài toán khó", icon: "Trophy", color: "text-blue-500 bg-blue-100", dateEarned: "05/03/2026" } });

  // Create Conversations
  const conv1 = await prisma.conversation.create({ data: { id: "conv1", unreadCount: 1 } });
  await prisma.participant.createMany({
    data: [
      { conversationId: "conv1", userId: studentAn.id },
      { conversationId: "conv1", userId: teacherLan.id },
    ]
  });
  await prisma.message.create({ data: { id: "m0", conversationId: "conv1", senderId: studentAn.id, content: "Cô ơi bài 2 sửa thế nào ạ?", timestamp: "10:00 Hôm nay", isRead: true } });
  await prisma.message.create({ data: { id: "m1", conversationId: "conv1", senderId: teacherLan.id, content: "Bé An nhớ làm bài toán cộng trước nhé, rồi mới trừ!", timestamp: "10:30 Hôm nay", isRead: false } });

  const conv2 = await prisma.conversation.create({ data: { id: "conv2", unreadCount: 0 } });
  await prisma.participant.createMany({
    data: [
      { conversationId: "conv2", userId: studentAn.id },
      { conversationId: "conv2", userId: teacherMinh.id },
    ]
  });
  await prisma.message.create({ data: { id: "m2", conversationId: "conv2", senderId: teacherMinh.id, content: "Tuần sau lớp mình đi dã ngoại nhé.", timestamp: "Hôm qua", isRead: true } });
  await prisma.message.create({ data: { id: "m3", conversationId: "conv2", senderId: studentAn.id, content: "Dạ vâng ạ. Con sẽ nhắc mẹ chuẩn bị.", timestamp: "Hôm qua", isRead: true } });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
