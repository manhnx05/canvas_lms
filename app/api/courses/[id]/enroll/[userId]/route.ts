import { NextResponse } from 'next/server';
import { courseService } from '@/src/services/courseService';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  try {
    const { id, userId } = await params;
    await courseService.unenrollUser(id, userId);
    return NextResponse.json({ message: 'Đã xoá khỏi lớp' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error unenrolling user' }, { status: 500 });
  }
}
