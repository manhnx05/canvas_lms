import { NextResponse } from 'next/server';
import { userService } from '@/src/services/userService';
import { requireAuth } from '@/src/middleware/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let targetId = id;
    
    // Nếu là "me", lấy id từ token
    if (id === 'me') {
      const user = await requireAuth(req);
      targetId = user.id;
    }

    const userProfile = await userService.getUserProfile(targetId);
    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(userProfile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const user = await userService.updateUser(id, body);
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await userService.deleteUser(id);
    return NextResponse.json({ message: 'Xóa thành công' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
