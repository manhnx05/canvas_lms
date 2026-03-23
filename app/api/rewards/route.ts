import { NextResponse } from 'next/server';
import { rewardService } from '@/src/services/rewardService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || '';
    const points = await rewardService.getPoints(userId);
    return NextResponse.json({ points });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
