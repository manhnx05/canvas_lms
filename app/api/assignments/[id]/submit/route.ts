import { NextResponse } from 'next/server';
import { assignmentService } from '@/src/services/assignmentService';
import { requireAuth } from '@/src/middleware/auth';
import { submitAssignmentSchema, validateRequestBody, validateUUID } from '@/src/lib/validations';
import { withErrorHandler } from '@/src/utils/errorHandler';

export const POST = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireAuth(req, ['student']);
  const { id } = await params;
  
  validateUUID(id, 'Assignment ID');
  
  const body = await req.json();
  const validatedData = validateRequestBody(submitAssignmentSchema.omit({ assignmentId: true }), body);
  
  // Add current user ID and assignment ID
  const submissionData = {
    ...validatedData,
    userId: user.id,
    assignmentId: id
  };
  
  const submission = await assignmentService.submitAssignment(id, submissionData);
  return NextResponse.json(submission);
});
