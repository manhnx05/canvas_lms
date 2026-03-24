import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '@/src/lib/prisma';
import { loginSchema, validateRequestBody } from '@/src/lib/validations';
import { withErrorHandler, AuthenticationError } from '@/src/utils/errorHandler';

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const { email, password } = validateRequestBody(loginSchema, body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AuthenticationError('Tài khoản không tồn tại!');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AuthenticationError('Mật khẩu không chính xác!');
  }

  const token = jwt.sign(
    { id: user.id, role: user.role }, 
    process.env.JWT_SECRET || 'canvas_secret_key', 
    { expiresIn: '7d' }
  );

  return NextResponse.json({
    message: 'Đăng nhập thành công',
    token,
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      avatar: user.avatar 
    }
  });
});
