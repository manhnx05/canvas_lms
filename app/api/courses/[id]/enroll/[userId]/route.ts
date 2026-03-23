import { NextResponse } from 'next/server';
import { courseService } from '@/src/server/services/courseService';

export async function DELETE(req: Request, { params }: { params: { id: string; userId: string } }) {
  try {
    await courseService.unenrollUser(params.id, params.userId);
    return NextResponse.json({ message: 'Đã xoá khỏi lớp' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error unenrolling user' }, { status: 500 });
  }
}
