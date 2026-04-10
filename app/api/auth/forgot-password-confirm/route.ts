import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/src/lib/prisma';
import { withErrorHandler, AuthenticationError } from '@/src/utils/errorHandler';

export const POST = withErrorHandler(async (req: Request) => {
  const { email, otp, newPassword } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || user.otp !== otp) {
      throw new AuthenticationError('Mã OTP không hợp lệ hoặc đã hết hạn!');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword, otp: null }
  });

  return NextResponse.json({ message: 'Đổi mật khẩu thành công!' });
});
