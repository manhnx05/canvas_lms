import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { aiGradingService } from '@/src/services/aiGradingService';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler, HttpError } from '@/src/utils/errorHandler';

const prisma = new PrismaClient();

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireAuth(req);

  try {
    const formData = await req.formData();
    let files: File[] = [];
    const fileCountStr = formData.get('fileCount') as string;
    
    console.log('[AI Grading] Received request, fileCount:', fileCountStr);
    
    if (fileCountStr) {
      const count = parseInt(fileCountStr, 10);
      for (let i = 0; i < count; i++) {
        const f = formData.get(`file_${i}`);
        if (f && typeof f !== 'string') files.push(f as File);
      }
    }
    
    if (files.length === 0) {
      const fallback = formData.getAll('files') as File[];
      if (fallback.length > 0) files = fallback;
    }
    
    if (files.length === 0) {
      const single = formData.get('file');
      if (single && typeof single !== 'string') files = [single as File];
    }
    
    console.log('[AI Grading] Files found:', files.length);
    
    if (files.length === 0) {
      throw new HttpError(400, 'Không tìm thấy ảnh phiếu bài tập nào được tải lên');
    }

    const message = (formData.get('message') as string) || '';

    // Process images - build base64 parts for Gemini and data URLs for storage
    const imageDataUrls: string[] = [];
    const imageParts: Array<{ base64Data: string; mimeType: string }> = [];

    for (const file of files) {
      if (!file || typeof file === 'string') continue;
      
      console.log('[AI Grading] Processing file:', file.name, 'size:', file.size, 'type:', file.type);
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType = file.type || 'image/jpeg';
      const base64Data = buffer.toString('base64');
      
      imageDataUrls.push(`data:${mimeType};base64,${base64Data}`);
      imageParts.push({ base64Data, mimeType });
    }

    if (imageParts.length === 0) {
      throw new HttpError(400, 'File tải lên không hợp lệ hoặc bị rỗng');
    }

    console.log('[AI Grading] Calling Gemini API with', imageParts.length, 'images');

    // Call Gemini Vision
    const result = await aiGradingService.analyzeWorksheet(imageParts, message);

    console.log('[AI Grading] Gemini response received:', result);

    // Save to Database
    const session = await prisma.aIGradingSession.create({
      data: {
        teacherId: user.id,
        studentName: result.studentName || null,
        studentClass: result.studentClass || null,
        studentDob: result.studentDob || null,
        score: result.score !== null && result.score !== undefined ? parseFloat(String(result.score)) : null,
        feedback: result.evaluation || '',
        messages: {
          create: [
            {
              role: 'user',
              content: message || 'Hãy chấm phiếu bài tập này.',
              imageUrl: imageDataUrls.join('|||')
            },
            {
              role: 'model',
              content: result.chatResponse || result.evaluation || 'Đã phân tích xong.'
            }
          ]
        }
      },
      include: { messages: true }
    });

    console.log('[AI Grading] Session created:', session.id);

    return NextResponse.json({ session, analysis: result }, { status: 201 });
  } catch (error: any) {
    console.error('[AI Grading] Error:', error);
    console.error('[AI Grading] Error stack:', error.stack);
    throw error;
  }
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
