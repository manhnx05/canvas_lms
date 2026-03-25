import { NextResponse } from 'next/server';
import { courseService } from '@/src/services/courseService';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; announcementId: string }> }) {
  try {
    const { announcementId } = await params;
    const body = await req.json();
    const ann = await courseService.updateAnnouncement(announcementId, body);
    return NextResponse.json(ann);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; announcementId: string }> }) {
  try {
    const { announcementId } = await params;
    await courseService.deleteAnnouncement(announcementId);
    return NextResponse.json({ message: 'Deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
