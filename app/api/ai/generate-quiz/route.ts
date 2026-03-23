import { NextResponse } from 'next/server';
import { aiService } from '@/src/server/services/aiService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const questions = await aiService.generateQuiz(body);
    return NextResponse.json({ questions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
