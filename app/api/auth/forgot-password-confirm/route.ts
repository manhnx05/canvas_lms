import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/src/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.otp !== otp) {
        return NextResponse.json({ error: 'Mã OTP không hợp lệ!' }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, otp: null }
    });

    return NextResponse.json({ message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi xác nhận đổi mật khẩu' }, { status: 500 });
  }
}
