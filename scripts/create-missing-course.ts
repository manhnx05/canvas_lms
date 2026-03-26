import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createMissingCourse() {
  try {
    console.log('🔍 Kiểm tra lớp "Tự nhiên xã hội"...\n');

    const existing = await prisma.course.findFirst({
      where: {
        OR: [
          { title: { contains: 'Tự nhiên', mode: 'insensitive' } },
          { title: { contains: 'Xã hội', mode: 'insensitive' } }
        ]
      }
    });

    if (existing) {
      console.log(`✅ Lớp đã tồn tại: ${existing.title}`);
      return;
    }

    console.log('📚 Đang tạo lớp "Tự nhiên xã hội"...\n');

    const course = await prisma.course.create({
      data: {
        title: 'Tự nhiên xã hội',
        description: 'Môn học tích hợp kiến thức về tự nhiên và xã hội cho học sinh tiểu học',
        color: 'bg-emerald-500',
        icon: 'BookOpen',
        teacher: 'Giáo viên',
        studentsCount: 0,
        progress: 0,
      }
    });

    console.log(`✅ Đã tạo lớp: ${course.title}`);

    // Show all courses
    const allCourses = await prisma.course.findMany({
      select: { title: true }
    });

    console.log(`\n📚 Danh sách lớp học hiện tại (${allCourses.length}):`);
    allCourses.forEach(c => console.log(`  - ${c.title}`));

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingCourse();
