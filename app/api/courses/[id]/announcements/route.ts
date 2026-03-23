import { NextResponse } from 'next/server';
import { courseService } from '@/src/services/courseService';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const announcement = await courseService.postAnnouncement(params.id, body);
    return NextResponse.json(announcement, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
