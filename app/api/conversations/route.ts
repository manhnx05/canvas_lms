import { NextResponse } from 'next/server';
import { conversationService } from '@/src/services/conversationService';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler } from '@/src/utils/errorHandler';
import prisma from '@/src/lib/prisma';

export const GET = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req);
  const conversations = await conversationService.getConversations(user.id);
  return NextResponse.json(conversations);
});

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req);
  const body = await req.json();
  
  body.senderId = user.id;
  if (!body.receiverId || body.receiverId === 'fake-receiver-id') {
     const anyUser = await prisma.user.findFirst({ where: { id: { not: user.id } } });
     body.receiverId = anyUser ? anyUser.id : user.id;
  }
  
  const conversation = await conversationService.createConversation(body);
  return NextResponse.json(conversation, { status: 201 });
});
