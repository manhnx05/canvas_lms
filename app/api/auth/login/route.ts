import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '@/src/shared/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'Tài khoản không tồn tại!' }, { status: 404 });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return NextResponse.json({ error: 'Mật khẩu không chính xác!' }, { status: 401 });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'canvas_secret_key', { expiresIn: '7d' });

    return NextResponse.json({
      message: 'Đăng nhập thành công',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi xử lý đăng nhập' }, { status: 500 });
  }
}
