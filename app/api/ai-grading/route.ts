import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { aiGradingService } from '@/src/services/aiGradingService';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler, HttpError } from '@/src/utils/errorHandler';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req);

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const message = (formData.get('message') as string) || '';

  if (!file) {
    throw new HttpError(400, 'Không tìm thấy ảnh phiếu bài tập');
  }

  // 1. Process Upload
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type;
  
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filename = `${Date.now()}-aigrading-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);
  const imageUrl = `/uploads/${filename}`;

  // 2. Extract Data via Gemini Vision
  const base64Image = buffer.toString('base64');
  const result = await aiGradingService.analyzeWorksheet(base64Image, mimeType, message);

  // 3. Save to Database
  const session = await prisma.aIGradingSession.create({
    data: {
      teacherId: user.id,
      studentName: result.studentName || null,
      studentClass: result.studentClass || null,
      studentDob: result.studentDob || null,
      score: result.score ? parseFloat(result.score) : null,
      feedback: result.evaluation || '',
      messages: {
        create: [
          {
             role: 'user',
             content: message || 'Hãy chấm phiếu bài tập này.',
             imageUrl: imageUrl
          },
          {
             role: 'model',
             content: result.chatResponse || result.evaluation || 'Đã phân tích xong.'
          }
        ]
      }
    },
    include: {
      messages: true
    }
  });

  return NextResponse.json({
    session: session,
    analysis: result 
  }, { status: 201 });
});

export const GET = withErrorHandler(async (req: Request) => {
   const user = await requireAuth(req);
   const sessions = await prisma.aIGradingSession.findMany({
      where: { teacherId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
         messages: {
            orderBy: { createdAt: 'asc' }
         }
      }
   });
   return NextResponse.json({ sessions });
});
