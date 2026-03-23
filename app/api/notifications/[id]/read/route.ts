import { NextResponse } from 'next/server';
import { notificationService } from '@/src/services/notificationService';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const result = await notificationService.markAsRead(params.id);
    return NextResponse.json({ message: 'Đã đánh dấu đọc', data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
