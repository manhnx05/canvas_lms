import { NextResponse } from 'next/server';
import { conversationService } from '@/src/services/conversationService';

export async function PUT(req: Request, { params }: { params: { messageId: string } }) {
  try {
    const body = await req.json();
    const message = await conversationService.updateMessage(params.messageId, body.senderId, body.content);
    return NextResponse.json(message);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { messageId: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const senderId = searchParams.get('senderId') || '';
    const message = await conversationService.deleteMessage(params.messageId, senderId);
    return NextResponse.json(message);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
