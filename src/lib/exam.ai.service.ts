import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ExamQuestion {
  id: string;
  level: 'NB' | 'TH' | 'VD' | 'VDC';
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  content: string;
  options?: string[];
  answer: string;
  explanation?: string;
  score: number;
}

export interface ExamGenerationParams {
  subject: string;
  grade: string;
  duration: number;
  totalScore: number;
  difficulty: string;
  nbCount: number;   // Nhận biết
  thCount: number;   // Thông hiểu
  vdCount: number;   // Vận dụng
  vdcCount: number;  // Vận dụng cao
  fileContents?: string;
  customTopic?: string;
}

const SUBJECT_MAP: Record<string, string> = {
  math: 'Toán học',
  physics: 'Vật lý',
  chemistry: 'Hóa học',
  biology: 'Sinh học',
  literature: 'Ngữ văn',
  history: 'Lịch sử',
  geography: 'Địa lý',
  english: 'Tiếng Anh',
  civic: 'GDCD',
};

export async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf-8');
  }

  if (ext === '.pdf') {
    try {
      const pdfParse = (await import('pdf-parse')) as any;
      const dataBuffer = fs.readFileSync(filePath);
      const data = await (pdfParse.default || pdfParse)(dataBuffer);
      return data.text;
    } catch {
      return '';
    }
  }

  if (ext === '.docx' || ext === '.doc') {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch {
      return '';
    }
  }

  return '';
}

export async function generateExamWithAI(params: ExamGenerationParams): Promise<ExamQuestion[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const subjectName = SUBJECT_MAP[params.subject] || params.subject;
  const totalQuestions = params.nbCount + params.thCount + params.vdCount + params.vdcCount;

  const contextSection = params.fileContents
    ? `\n\nNỘI DUNG TÀI LIỆU THAM KHẢO (trích từ sách giáo khoa/đề mẫu):\n---\n${params.fileContents.slice(0, 8000)}\n---\nHãy ưu tiên ra đề dựa trên nội dung tài liệu trên.`
    : params.customTopic
      ? `\nChủ đề: ${params.customTopic}`
      : '';

  const prompt = `Bạn là chuyên gia ra đề thi theo chuẩn Bộ GD&ĐT Việt Nam (Công văn 7991/BGDĐT-GDTrH).

Hãy tạo đề thi môn ${subjectName} lớp ${params.grade} với các thông số sau:
- Thời gian làm bài: ${params.duration} phút
- Tổng điểm: ${params.totalScore} điểm
- Mức độ khó: ${params.difficulty === 'easy' ? 'Dễ' : params.difficulty === 'hard' ? 'Khó' : 'Trung bình'}
- Ma trận đề (Công văn 7991):
  + Nhận biết (NB): ${params.nbCount} câu
  + Thông hiểu (TH): ${params.thCount} câu
  + Vận dụng (VD): ${params.vdCount} câu
  + Vận dụng cao (VDC): ${params.vdcCount} câu
  + Tổng: ${totalQuestions} câu${contextSection}

YÊU CẦU QUAN TRỌNG:
1. Mọi công thức toán học, vật lý, hóa học, sinh học PHẢI viết bằng LaTeX: inline dùng $...$ và block dùng $$...$$
2. Câu hỏi TNKQ có đúng 4 đáp án (A, B, C, D)
3. Đáp án phải chính xác, có giải thích rõ ràng
4. Điểm mỗi câu phân bổ đều trong mức độ tương ứng

Trả về JSON hợp lệ theo format sau (không có markdown, chỉ JSON thuần):
[
  {
    "id": "q1",
    "level": "NB",
    "type": "multiple_choice",
    "content": "Nội dung câu hỏi (có thể dùng LaTeX)",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "answer": "A",
    "explanation": "Giải thích đáp án",
    "score": 0.25
  }
]

Chỉ trả về JSON array, không có bất kỳ text nào khác.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array found in response');

    const questions: ExamQuestion[] = JSON.parse(jsonMatch[0]);
    return questions;
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error('Không thể tạo đề thi bằng AI. Vui lòng thử lại.');
  }
}
