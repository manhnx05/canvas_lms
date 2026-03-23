import { NextResponse } from 'next/server';
import { courseService } from '@/src/services/courseService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const courses = await courseService.getCourses(userId);
    return NextResponse.json(courses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching courses' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const course = await courseService.createCourse(body);
    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error creating course' }, { status: 500 });
  }
}
