import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/src/lib/prisma';
import { loginSchema, validateRequestBody } from '@/src/lib/validations';
import { withErrorHandler, AuthenticationError } from '@/src/utils/errorHandler';
import { generateToken } from '@/src/middleware/auth';
import { withRateLimit, rateLimitConfigs } from '@/src/middleware/rateLimiting';
import { sanitizeRequestBody } from '@/src/middleware/sanitization';

export const POST = withRateLimit(
  withErrorHandler(async (req: Request) => {
    // Sanitize and validate request body
    const sanitizedBody = await sanitizeRequestBody(req as any);
    if (!sanitizedBody) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    const { email, password } = validateRequestBody(loginSchema, sanitizedBody);

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

    return NextResponse.json({
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
  }),
  rateLimitConfigs.auth
);
