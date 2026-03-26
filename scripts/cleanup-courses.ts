import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupCourses() {
  try {
    console.log('🔍 Đang tìm các lớp học...\n');

    // Get all courses
    const allCourses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
      }
    });

    console.log(`📚 Tổng số lớp học: ${allCourses.length}`);
    allCourses.forEach(course => {
      console.log(`  - ${course.title}`);
    });

    // Define courses to keep
    const keepCourses = ['Toán', 'Tiếng Việt', 'Tự nhiên xã hội'];
    
    // Find courses to delete
    const coursesToDelete = allCourses.filter(course => 
      !keepCourses.some(keep => course.title.toLowerCase().includes(keep.toLowerCase()))
    );

    console.log(`\n🗑️  Sẽ xóa ${coursesToDelete.length} lớp học:`);
    coursesToDelete.forEach(course => {
      console.log(`  - ${course.title}`);
    });

    if (coursesToDelete.length === 0) {
      console.log('\n✅ Không có lớp học nào cần xóa!');
      return;
    }

    console.log('\n⏳ Đang xóa các lớp học...\n');

    // Delete each course
    for (const course of coursesToDelete) {
      try {
        console.log(`  Đang xóa: ${course.title}...`);
        
        await prisma.$transaction(async (tx) => {
          // Delete submissions first
          await tx.submission.deleteMany({
            where: { assignment: { courseId: course.id } }
          });

          // Delete assignments
          await tx.assignment.deleteMany({ 
            where: { courseId: course.id } 
          });

          // Delete module items
          await tx.moduleItem.deleteMany({ 
            where: { module: { courseId: course.id } } 
          });

          // Delete modules
          await tx.courseModule.deleteMany({ 
            where: { courseId: course.id } 
          });

          // Delete announcements
          await tx.announcement.deleteMany({ 
            where: { courseId: course.id } 
          });

          // Delete enrollments
          await tx.enrollment.deleteMany({ 
            where: { courseId: course.id } 
          });

          // Delete course
          await tx.course.delete({ 
            where: { id: course.id } 
          });
        });

        console.log(`  ✅ Đã xóa: ${course.title}`);
      } catch (error: any) {
        console.error(`  ❌ Lỗi khi xóa ${course.title}:`, error.message);
      }
    }

    // Show remaining courses
    const remainingCourses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
      }
    });

    console.log(`\n✅ Hoàn thành! Còn lại ${remainingCourses.length} lớp học:`);
    remainingCourses.forEach(course => {
      console.log(`  - ${course.title}`);
    });

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupCourses();
