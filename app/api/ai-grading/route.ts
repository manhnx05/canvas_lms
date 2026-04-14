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
  let files: File[] = [];
  const fileCountStr = formData.get('fileCount') as string;
  
  if (fileCountStr) {
    const count = parseInt(fileCountStr, 10);
    for (let i = 0; i < count; i++) {
        const f = formData.get(`file_${i}`);
        if (f) files.push(f as File);
    }
  } else {
    // fallback
    files = formData.getAll('files') as File[];
  }
  
  const message = (formData.get('message') as string) || '';

  if (!files || files.length === 0) {
    const singleFile = formData.get('file') as File;
    if (singleFile) {
      files = [singleFile];
    } else {
      throw new HttpError(400, 'Không tìm thấy ảnh phiếu bài tập nào được tải lên');
    }
  }

  // 1. Process Uploads
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const imageUrls: string[] = [];
  const imageParts: Array<{ base64Data: string; mimeType: string }> = [];

  for (const file of files) {
    if (!file || typeof file === 'string') continue;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const safeName = file.name ? file.name.replace(/[^a-zA-Z0-9.-]/g, '_') : 'image.jpg';
    const uniqueId = Math.random().toString(36).substring(2, 10);
    const filename = `${Date.now()}-${uniqueId}-aigrading-${safeName}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    
    imageUrls.push(`/uploads/${filename}`);
    imageParts.push({
      base64Data: buffer.toString('base64'),
      mimeType: file.type
    });
  }

  if (imageParts.length === 0) {
    throw new HttpError(400, 'File tải lên không hợp lệ');
  }

  // 2. Extract Data via Gemini Vision
  const result = await aiGradingService.analyzeWorksheet(imageParts, message);

  // 3. Save to Database
  const session = await prisma.aIGradingSession.create({
    data: {
      teacherId: user.id,
      studentName: result.studentName || null,
      studentClass: result.studentClass || null,
      studentDob: result.studentDob || null,
      score: result.score !== null && result.score !== undefined ? parseFloat(result.score) : null,
      feedback: result.evaluation || '',
      messages: {
        create: [
          {
             role: 'user',
             content: message || 'Hãy chấm phiếu bài tập này.',
             imageUrl: imageUrls.join(',')
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
