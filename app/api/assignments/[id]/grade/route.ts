import { NextResponse } from 'next/server';
import { assignmentService } from '@/src/services/assignmentService';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const result = await assignmentService.gradeAssignment(params.id, body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
