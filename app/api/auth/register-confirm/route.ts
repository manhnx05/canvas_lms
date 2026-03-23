import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '@/src/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, otp, password, name, role } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || user.otp !== otp) {
      return NextResponse.json({ error: 'Mã OTP không hợp lệ!' }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updated = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, otp: null, name: name || user.name, role: role || user.role }
    });

    const token = jwt.sign({ id: updated.id, role: updated.role }, process.env.JWT_SECRET || 'canvas_secret_key', { expiresIn: '7d' });

    return NextResponse.json({ 
      message: 'Đăng ký thành công!', 
      token,
      user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role, avatar: updated.avatar }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi xác nhận đăng ký' }, { status: 500 });
  }
}
