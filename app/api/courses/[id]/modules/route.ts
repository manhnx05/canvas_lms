import { NextResponse } from 'next/server';
import { courseService } from '@/src/services/courseService';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const mod = await courseService.createModule(params.id, body);
    return NextResponse.json(mod, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
