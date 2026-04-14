import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { aiGradingService } from '@/src/services/aiGradingService';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler, HttpError } from '@/src/utils/errorHandler';

const prisma = new PrismaClient();

export const POST = withErrorHandler(async (req: Request, { params }: { params: { sessionId: string } }) => {
   const user = await requireAuth(req);
   const sessionId = params.sessionId;

   const body = await req.json();
   const message = body.message;

   if (!message) {
      throw new HttpError(400, "Nội dung tin nhắn trống");
   }

   const session = await prisma.aIGradingSession.findUnique({
      where: { id: sessionId },
      include: {
         messages: {
            orderBy: { createdAt: 'asc' }
         }
      }
   });

   if (!session || session.teacherId !== user.id) {
      throw new HttpError(404, "Không tìm thấy phiên chấm bài");
   }

   // 1. Prepare history
   const history = session.messages.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      content: msg.content,
      imageUrl: msg.imageUrl
   }));

   // 2. Call AI with Chat
   const responseText = await aiGradingService.chatWithContext(history, message);

   // 3. Save to DB
   await prisma.aIGradingMessage.create({
      data: {
         sessionId: sessionId,
         role: 'user',
         content: message
      }
   });

   const aiMessage = await prisma.aIGradingMessage.create({
      data: {
         sessionId: sessionId,
         role: 'model',
         content: responseText
      }
   });

   return NextResponse.json({ reply: aiMessage }, { status: 201 });
});
