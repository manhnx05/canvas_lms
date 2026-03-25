import { NextResponse } from 'next/server';
import { conversationService } from '@/src/services/conversationService';

export async function PUT(req: Request, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const { messageId } = await params;
    const body = await req.json();
    const message = await conversationService.updateMessage(messageId, body.senderId, body.content);
    return NextResponse.json(message);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const { messageId } = await params;
    const { searchParams } = new URL(req.url);
    const senderId = searchParams.get('senderId') || '';
    const message = await conversationService.deleteMessage(messageId, senderId);
    return NextResponse.json(message);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
