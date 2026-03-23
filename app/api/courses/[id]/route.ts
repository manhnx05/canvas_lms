import { NextResponse } from 'next/server';
import { courseService } from '@/src/server/services/courseService';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const course = await courseService.getCourseById(params.id);
    if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(course);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching course details' }, { status: 500 });
  }
}
