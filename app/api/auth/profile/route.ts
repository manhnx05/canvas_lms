import { NextResponse } from 'next/server';
import { userService } from '@/src/services/userService';
import { requireAuth } from '@/src/middleware/auth';
import { updateProfileSchema, validateRequestBody } from '@/src/lib/validations';
import { withErrorHandler } from '@/src/utils/errorHandler';

export const PUT = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req);
  
  const body = await req.json();
  const { name, avatar, className } = validateRequestBody(updateProfileSchema, body);

  const updated = await userService.updateUser(user.id, { 
      ...(name !== undefined && { name }),
      ...(avatar !== undefined && { avatar }),
      ...(className !== undefined && { className })
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
  
  const userData = await userService.getUserProfile(user.id);

  return NextResponse.json({ user: userData });
});
