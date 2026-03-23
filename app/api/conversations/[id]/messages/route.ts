import { NextResponse } from 'next/server';
import { conversationService } from '@/src/server/services/conversationService';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const messages = await conversationService.getMessages(params.id);
    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const message = await conversationService.sendMessage(params.id, body);
    return NextResponse.json(message);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
