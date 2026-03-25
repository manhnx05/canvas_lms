import { NextResponse } from 'next/server';
import { assignmentService } from '@/src/services/assignmentService';
import { requireAuth } from '@/src/middleware/auth';
import { validateUUID } from '@/src/lib/validations';
import { withErrorHandler } from '@/src/utils/errorHandler';

export const GET = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireAuth(req);
  const { id } = await params;
  
  validateUUID(id, 'Assignment ID');
  
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || user.id;
  
  const assignment = await assignmentService.getAssignmentById(id, userId);
  return NextResponse.json(assignment);
});

export const DELETE = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, ['teacher']);
  const { id } = await params;
  
  validateUUID(id, 'Assignment ID');
  
  await assignmentService.deleteAssignment(id);
  return NextResponse.json({ message: 'Xóa bài tập thành công' });
});
