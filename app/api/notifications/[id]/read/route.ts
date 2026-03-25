import { NextResponse } from 'next/server';
import { notificationService } from '@/src/services/notificationService';

export async function PUT(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await notificationService.markAsRead(id);
    return NextResponse.json({ message: 'Đã đánh dấu đọc', data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
