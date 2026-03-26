import { NextResponse } from 'next/server';
import { conversationService } from '@/src/services/conversationService';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler } from '@/src/utils/errorHandler';

export const GET = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req);
  const conversations = await conversationService.getConversations(user.id);
  return NextResponse.json(conversations);
});

export const POST = withErrorHandler(async (req: Request) => {
  await requireAuth(req);
  const body = await req.json();
  const conversation = await conversationService.createConversation(body);
  return NextResponse.json(conversation, { status: 201 });
});
