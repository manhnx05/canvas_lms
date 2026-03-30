const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING SYNC: Học sinh & Lớp học Cô Ngọc Điệp ---');

  // Find target teacher explicitly or just the first teacher
  // For the prompt: "giống cô Ngọc Điệp", let's search for "Ngọc Điệp" or any teacher if not found
  let teacher = await prisma.user.findFirst({
    where: { 
      role: 'teacher',
      name: { contains: 'Điệp' }
    }
  });

  if (!teacher) {
    console.log('🔔 Không tìm thấy giáo viên "Điệp", lấy giáo viên đầu tiên...');
    teacher = await prisma.user.findFirst({ where: { role: 'teacher' } });
  }

  if (!teacher) {
    console.log('❌ Lỗi: Không có giáo viên nào trong hệ thống!');
    process.exit(1);
  }

  console.log(`✅ Giáo viên mục tiêu: ${teacher.name} (ID: ${teacher.id})`);

  // Lấy các lớp học do giáo viên môn này dạy
  // Ở schema, Course có cột `teacher` (tstring) và enrollment
  // Để chắc chắn, ta lấy tất cả các lớp mà GV này được enroll HOẶC có tên giáo viên
  const teacherCourses = await prisma.course.findMany({
    where: {
      OR: [
        { teacher: { contains: teacher.name } },
        { enrollments: { some: { userId: teacher.id } } }
      ]
    }
  });

  console.log(`✅ Tìm thấy ${teacherCourses.length} lớp học của cô ${teacher.name}`);

  // Lấy tất cả học sinh
  const students = await prisma.user.findMany({
    where: { role: 'student' }
  });

  console.log(`✅ Cần đồng bộ cho ${students.length} học sinh...`);

  let addedCount = 0;

  for (const stu of students) {
    for (const course of teacherCourses) {
      // Upsert enrollment
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: stu.id, courseId: course.id } }
      });
      if (!enrollment) {
        await prisma.enrollment.create({
          data: { userId: stu.id, courseId: course.id }
        });
        addedCount++;
      }
    }
  }

  // Update sĩ số (studentsCount)
  for (const course of teacherCourses) {
    const count = await prisma.enrollment.count({ where: { courseId: course.id } });
    await prisma.course.update({
      where: { id: course.id },
      data: { studentsCount: count }
    });
  }

  console.log(`🎉 [Xong] Đã thêm mới ${addedCount} bản ghi học sinh vào lớp học.`);
  console.log('--- ĐỒNG BỘ THÀNH CÔNG ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
