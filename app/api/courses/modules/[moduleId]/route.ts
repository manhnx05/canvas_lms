import { NextResponse } from 'next/server';
import { courseService } from '@/src/server/services/courseService';

export async function DELETE(req: Request, { params }: { params: { moduleId: string } }) {
  try {
    await courseService.deleteModule(params.moduleId);
    return NextResponse.json({ message: 'Deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
