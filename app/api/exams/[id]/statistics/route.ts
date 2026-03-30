import { NextResponse } from 'next/server';
import { examService } from '@/src/services/examService';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler } from '@/src/utils/errorHandler';

export const GET = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, ['teacher']);
  const { id } = await params;

  // Ideally, we could also verify if the teacher owns this exam or course. 
  // For now we just return the statistics.
  const stats = await examService.getExamStatistics(id);
  
  return NextResponse.json(stats);
});
