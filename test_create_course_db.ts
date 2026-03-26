import prisma from './src/lib/prisma';
import { courseService } from './src/services/courseService';

async function testDBCreation() {
  try {
    // get a teacher user
    const teacher = await prisma.user.findFirst({ where: { role: 'teacher' } });
    if (!teacher) {
      console.log("No teacher found in db!");
      return;
    }

    const courseData = {
      title: 'Tạo lớp bằng API Test',
      description: 'Mô tả test',
      color: 'bg-emerald-500',
      icon: 'BookOpen',
      teacher: teacher.name,
      teacherId: teacher.id
    };

    const course = await courseService.createCourse(courseData);
    console.log("Course created successfully:", course);

    // cleanup
    await prisma.course.delete({ where: { id: course.id } });
  } catch (err: any) {
    console.error("Failed to create course in DB:", err.message);
    if (err.code) console.error("Error Code:", err.code);
  }
}

testDBCreation();
