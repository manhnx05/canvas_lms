import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { requireAuth } from '@/src/middleware/auth';
import { updateProfileSchema, validateRequestBody } from '@/src/lib/validations';
import { withErrorHandler } from '@/src/utils/errorHandler';

export const PUT = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req);
  
  const body = await req.json();
  const { name, avatar, className } = validateRequestBody(updateProfileSchema, body);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name, avatar, className }
  });

  return NextResponse.json({
    message: 'Cập nhật thành công',
    user: { 
      id: updated.id, 
      name: updated.name, 
      email: updated.email, 
      role: updated.role, 
      avatar: updated.avatar, 
      className: updated.className 
    }
  });
});

export const GET = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req);
  
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      className: true,
      stars: true
    }
  });

  return NextResponse.json({ user: userData });
});
