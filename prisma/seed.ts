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
  await prisma.moduleItem.deleteMany();
  await prisma.courseModule.deleteMany();
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

  // Thay vì thêm Lecture, ta thêm CourseModule và ModuleItem
  console.log('Seeding modules...');
  for (const course of [c1, c2, c3]) {
    const mod = await prisma.courseModule.create({
      data: {
        title: 'Tuần 01 - Giới thiệu Môn học',
        order: 0,
        courseId: course.id,
      }
    });
    
    await prisma.moduleItem.createMany({
      data: [
        {
          title: 'Bài giảng chuẩn SCORM',
          type: 'elearning',
          url: 'https://example.com/elearning',
          order: 0,
          moduleId: mod.id
        },
        {
          title: 'Tài liệu đọc thêm (PDF)',
          type: 'file',
          url: 'https://example.com/document.pdf',
          order: 1,
          moduleId: mod.id
        }
      ]
    });
  }

  // Create Announcements (removed 'date' field, using createdAt instead)
  await prisma.announcement.create({ 
    data: { 
      title: "Chào mừng các con đến với môn Toán!", 
      content: "Hôm nay chúng ta sẽ bắt đầu học chuyên đề mới nhé. Mọi người chú ý làm bài đầy đủ.", 
      courseId: "c1" 
    }
  });
  await prisma.announcement.create({ 
    data: { 
      title: "Nhắc nhở nộp bài tuần 4", 
      content: "Thứ sáu lớp mình sẽ chốt sổ kiểm tra nhanh 15 phút. Bạn nào chưa nộp thì nhớ nộp nha.", 
      courseId: "c1" 
    }
  });

  // Create Assignments
  await prisma.assignment.create({ 
    data: { 
      id: "a1", 
      title: "Bảng cửu chương 5", 
      courseId: "c1", 
      courseName: "Toán học", 
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      starsReward: 5, 
      status: "pending", 
      type: "quiz", 
      description: "Bé hãy ôn tập và làm bài kiểm tra nhanh về bảng của chương 5 nhé." 
    } 
  });
  await prisma.assignment.create({ 
    data: { 
      id: "a2", 
      title: "Tập chép: Cháu nghe", 
      courseId: "c2", 
      courseName: "Tiếng Việt", 
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
      starsReward: 10, 
      status: "pending", 
      type: "writing", 
      description: "Luyện chữ đẹp." 
    } 
  });

  // Create Rewards
  await prisma.reward.create({ 
    data: { 
      id: "r1", 
      title: "Chăm chỉ", 
      description: "Hoàn thành 5 bài tập liên tiếp", 
      icon: "Star", 
      color: "text-amber-500 bg-amber-100", 
      dateEarned: "15/03/2026" 
    } 
  });

  // Create Conversations
  const conv1 = await prisma.conversation.create({ data: { id: "conv1", unreadCount: 1 } });
  await prisma.participant.createMany({
    data: [
      { conversationId: "conv1", userId: studentAn.id },
      { conversationId: "conv1", userId: teacherDiep.id },
    ]
  });
  await prisma.message.create({ 
    data: { 
      id: "m0", 
      conversationId: "conv1", 
      senderId: studentAn.id, 
      content: "Cô ơi em nộp bài trễ xíu nhé, nha bị mất điện ạ.", 
      isRead: true 
    } 
  });
  await prisma.message.create({ 
    data: { 
      id: "m1", 
      conversationId: "conv1", 
      senderId: teacherDiep.id, 
      content: "Được em nhé.", 
      isRead: false 
    } 
  });

  console.log("Database seeded successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
