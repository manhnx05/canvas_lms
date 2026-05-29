import { NextResponse } from 'next/server';
import { notificationService } from '@/src/services/notificationService';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler } from '@/src/utils/errorHandler';

export const GET = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req);
  const notifications = await notificationService.getNotifications(user.id);
  return NextResponse.json(notifications);
});

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req);
  const body = await req.json();
  // Optional: enforce that created notification is for this user, or check admin roles
  const notification = await notificationService.createNotification({ ...body, userId: user.id });
  return NextResponse.json(notification, { status: 201 });
});
