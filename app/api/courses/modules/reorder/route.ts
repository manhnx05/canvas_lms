import { NextResponse } from 'next/server';
import { courseService } from '@/src/services/courseService';

// PUT /api/courses/modules/reorder
export async function PUT(req: Request) {
  try {
    const { items } = await req.json();
    await courseService.reorderModuleItems(items);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
