import { NextResponse } from 'next/server';
import { teacherService } from '@/src/services/teacherService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const teacherId = searchParams.get('teacherId');
    
    if (role === 'student') {
        const stats = await teacherService.getStudentStats(teacherId as string);
        return NextResponse.json(stats);
    }
    const stats = await teacherService.getTeacherStats(teacherId as string);
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
