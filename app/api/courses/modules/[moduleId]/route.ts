import { NextResponse } from 'next/server';
import { courseService } from '@/src/services/courseService';

export async function DELETE(_req: Request, { params }: { params: Promise<{ moduleId: string }> }) {
  try {
    const { moduleId } = await params;
    await courseService.deleteModule(moduleId);
    return NextResponse.json({ message: 'Deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
