import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/src/lib/prisma';
import { withErrorHandler, AuthenticationError, ValidationError } from '@/src/utils/errorHandler';
import { generateToken } from '@/src/middleware/auth';

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const { email, otp, password, name, role } = body;

  if (!email || !otp || !password) {
    throw new ValidationError('Thiếu thông tin bắt buộc (email, otp, password)');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || user.otp !== otp) {
    throw new AuthenticationError('Mã OTP không hợp lệ hoặc đã hết hạn!');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const updated = await prisma.user.update({
    where: { email },
    data: { 
      password: hashedPassword, 
      otp: null, 
      name: name || user.name, 
      role: role || user.role 
    }
  });

  const token = generateToken({
    id: updated.id,
    role: updated.role as any
  });

  return NextResponse.json({ 
    message: 'Đăng ký thành công!', 
    token,
    user: { 
      id: updated.id, 
      name: updated.name, 
      email: updated.email, 
      role: updated.role, 
      avatar: updated.avatar 
    }
  });
});
