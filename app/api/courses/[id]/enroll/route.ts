import { NextResponse } from 'next/server';
import { courseService } from '@/src/server/services/courseService';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = await req.json();
    const enrollment = await courseService.enrollUser(params.id, userId);
    return NextResponse.json(enrollment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error enrolling user' }, { status: 500 });
  }
}
