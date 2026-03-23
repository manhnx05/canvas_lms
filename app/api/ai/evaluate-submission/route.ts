import { NextResponse } from 'next/server';
import { aiService } from '@/src/server/services/aiService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const feedback = await aiService.evaluateSubmission(body);
    return NextResponse.json({ feedback });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
