import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/src/lib/prisma';
import { loginSchema, validateRequestBody } from '@/src/lib/validations';
import { withErrorHandler, AuthenticationError } from '@/src/utils/errorHandler';
import { generateToken } from '@/src/middleware/auth';
import { authRateLimit, addRateLimitHeaders } from '@/src/middleware/rateLimit';

export const POST = withErrorHandler(async (req: Request) => {
  // Apply rate limiting
  const rateLimitResult = await authRateLimit(req as any);
  if (rateLimitResult) {
    return rateLimitResult;
  }

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

  const token = generateToken({
    id: user.id,
    role: user.role as any
  });

  const response = NextResponse.json({
    message: 'Đăng nhập thành công',
    token,
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      avatar: user.avatar,
      stars: user.stars,
      className: user.className
    }
  });

  // Add rate limit headers
  return addRateLimitHeaders(response, req as any);
});
