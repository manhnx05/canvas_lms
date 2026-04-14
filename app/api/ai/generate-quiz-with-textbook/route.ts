import { NextResponse } from 'next/server';
import { requireAuth } from '@/src/middleware/auth';
import { withErrorHandler } from '@/src/utils/errorHandler';
import { getGeminiModel } from '@/src/lib/gemini';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const generateQuizSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  grade: z.string().min(1, 'Grade is required'),
  nbCount: z.number().min(0).max(50),
  thCount: z.number().min(0).max(50),
  vdCount: z.number().min(0).max(50),
  vdcCount: z.number().min(0).max(50),
});

export const POST = withErrorHandler(async (req: Request) => {
  await requireAuth(req, ['teacher']);
  
  const body = await req.json();
  
  // Validate input
  const validatedData = generateQuizSchema.parse(body);
  const { subject, grade, nbCount, thCount, vdCount, vdcCount } = validatedData;
  
  const totalQuestions = nbCount + thCount + vdCount + vdcCount;
  if (totalQuestions === 0) {
    throw new Error('Tổng số câu hỏi phải lớn hơn 0');
  }
  if (totalQuestions > 100) {
    throw new Error('Tổng số câu hỏi không được vượt quá 100');
  }
  
  // Load textbook JSON
  const textbookPath = path.join(process.cwd(), 'public', 'textbooks', `${subject}-${grade}.json`);
  
  let textbookContent = null;
  if (fs.existsSync(textbookPath)) {
    try {
      const fileContent = fs.readFileSync(textbookPath, 'utf-8');
      textbookContent = JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading textbook file:', error);
      // Continue without textbook content
    }
  }
  
  // Generate questions with Gemini
  const model = getGeminiModel();
  
  const prompt = textbookContent 
    ? `Bạn là giáo viên chuyên nghiệp. Dựa vào nội dung sách giáo khoa sau đây, hãy tạo đề kiểm tra trắc nghiệm:

THÔNG TIN SÁCH:
${JSON.stringify(textbookContent.book_metadata, null, 2)}

NỘI DUNG CÁC BÀI HỌC:
${textbookContent.content.map((lesson: any) => `
Bài: ${lesson.lesson_title}
Chủ đề: ${lesson.theme}
Từ khóa: ${lesson.keywords.join(', ')}
Nội dung: ${lesson.content}
`).join('\n---\n')}

YÊU CẦU RA ĐỀ:
- Tổng số câu: ${totalQuestions}
- Nhận biết: ${nbCount} câu
- Thông hiểu: ${thCount} câu
- Vận dụng: ${vdCount} câu
- Vận dụng cao: ${vdcCount} câu

Hãy tạo câu hỏi trắc nghiệm 4 đáp án (A, B, C, D) dựa CHÍNH XÁC vào nội dung sách trên.
Mỗi câu hỏi phải liên quan trực tiếp đến một bài học cụ thể.

Trả về JSON array với format:
[{
  "id": "q1",
  "content": "Câu hỏi...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "answer": "A",
  "level": "Nhận biết",
  "score": 1,
  "explanation": "Giải thích...",
  "lesson_id": "chu_de_1_bai_1",
  "type": "multiple_choice"
}]`
    : `Tạo ${totalQuestions} câu hỏi trắc nghiệm cho môn ${subject} lớp ${grade}.
Phân bổ: Nhận biết ${nbCount}, Thông hiểu ${thCount}, Vận dụng ${vdCount}, Vận dụng cao ${vdcCount}.

Trả về JSON array với format:
[{
  "id": "q1",
  "content": "Câu hỏi...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "answer": "A",
  "level": "Nhận biết",
  "score": 1,
  "explanation": "Giải thích...",
  "type": "multiple_choice"
}]`;
  
  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  // Parse JSON from response
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Không thể parse câu hỏi từ AI. Vui lòng thử lại.');
  }
  
  let questions;
  try {
    questions = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('Dữ liệu trả về từ AI không hợp lệ. Vui lòng thử lại.');
  }
  
  // Validate questions array
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('AI không tạo được câu hỏi. Vui lòng thử lại.');
  }
  
  return NextResponse.json({ 
    questions,
    usedTextbook: !!textbookContent,
    textbookTitle: textbookContent?.book_metadata?.title || null
  });
});
