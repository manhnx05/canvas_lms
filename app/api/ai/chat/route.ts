import { NextResponse } from 'next/server';
import { aiService } from '@/src/services/aiService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reply = await aiService.chat(body);
    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
