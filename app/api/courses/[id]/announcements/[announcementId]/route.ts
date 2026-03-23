import { NextResponse } from 'next/server';
import { courseService } from '@/src/services/courseService';

export async function PUT(req: Request, { params }: { params: { id: string; announcementId: string } }) {
  try {
    const body = await req.json();
    const ann = await courseService.updateAnnouncement(params.announcementId, body);
    return NextResponse.json(ann);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string; announcementId: string } }) {
  try {
    await courseService.deleteAnnouncement(params.announcementId);
    return NextResponse.json({ message: 'Deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
