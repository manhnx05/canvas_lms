import { NextResponse } from 'next/server';
import { teacherService } from '@/src/services/teacherService';
import { requireAuth } from '@/src/middleware/auth';
import { validateUUID } from '@/src/lib/validations';
import { withErrorHandler } from '@/src/utils/errorHandler';

export const GET = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req);
  
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role') || user.role;
  const teacherId = searchParams.get('teacherId') || user.id;
  
  // Only validate teacherId if it's provided as a query parameter (not from auth)
  if (searchParams.get('teacherId')) {
    validateUUID(teacherId, 'Teacher ID');
  }
  
  if (role === 'student') {
    const stats = await teacherService.getStudentStats(teacherId);
    return NextResponse.json(stats);
  }
  
  const stats = await teacherService.getTeacherStats(teacherId);
  return NextResponse.json(stats);
});
