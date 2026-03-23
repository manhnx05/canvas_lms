import { NextResponse } from 'next/server';
import { assignmentService } from '@/src/services/assignmentService';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const submission = await assignmentService.submitAssignment(params.id, body);
    return NextResponse.json(submission);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
