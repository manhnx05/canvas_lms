import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/src/lib/prisma';

// Define a helper to verify JWT and extract user ID
const verifyToken = (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'canvas_secret_key') as any;
    return decoded.id;
  } catch (e) {
    return null;
  }
};

export async function PUT(req: Request) {
  try {
    const userId = verifyToken(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, avatar, className } = await req.json();
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name, avatar, className }
    });

    return NextResponse.json({
      message: 'Cập nhật thành công',
      user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role, avatar: updated.avatar, className: updated.className }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi cập nhật hồ sơ' }, { status: 500 });
  }
}
