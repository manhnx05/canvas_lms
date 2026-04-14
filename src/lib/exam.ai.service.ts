import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/** Use gemini-1.5-flash-latest - stable vision model with better quota */
async function getModel() {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
  return { model, modelName: 'gemini-1.5-flash-latest' };
}

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
  const { model } = await getModel();

  const subjectName = SUBJECT_MAP[params.subject] || params.subject;
  const totalQuestions = params.nbCount + params.thCount + params.vdCount + params.vdcCount;

  const contextSection = params.fileContents
    ? `\n\nNỘI DUNG KIẾN THỨC THAM KHẢO (trích từ sách giáo khoa/đề mẫu):\n---\n${params.fileContents.slice(0, 8000)}\n---\nHãy ưu tiên ra đề dựa trên nội dung kiến thức trên. Câu hỏi phải tự nhiên, độc lập, KHÔNG nhắc đến nguồn tài liệu.`
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
5. TUYỆT ĐỐI KHÔNG dùng các cụm từ sau trong nội dung câu hỏi, đáp án hoặc giải thích: "Theo tài liệu", "Dựa vào tài liệu", "Theo SGK", "Theo bài học", "Theo đoạn văn", "Đoạn trên", "Tài liệu trên", "Văn bản trên", "Trong bài", "Theo bài". Câu hỏi phải hoàn toàn tự nhiên và độc lập.

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

  const tryGenerate = async (retryModel?: any): Promise<ExamQuestion[]> => {
    const activeModel = retryModel || model;
    try {
      const result = await activeModel.generateContent(prompt);
      const text = result.response.text().trim();

      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('Raw AI response (no JSON array found):', text.slice(0, 500));
        throw new Error('AI không trả về JSON hợp lệ. Vui lòng thử lại.');
      }

      const questions: ExamQuestion[] = JSON.parse(jsonMatch[0]);
      return cleanQuestions(questions);
    } catch (error: any) {
      // If this is the preferred model failing, retry with fallback
      if (!retryModel) {
        console.warn('Primary model call failed, no retry available:', error.message);
      }
      console.error('AI generation error:', error);
      const userMsg = error.message?.includes('API key') ? 'GEMINI_API_KEY không hợp lệ hoặc chưa được cấu hình'
        : error.message?.includes('quota') ? 'Vượt giới hạn quota Gemini API'
        : error.message?.includes('404') ? 'Model AI không tồn tại hoặc không khả dụng'
        : error.message || 'Không thể tạo đề thi bằng AI';
      throw new Error(userMsg);
    }
  };

  return tryGenerate();
}

export interface TextbookGenerationParams extends ExamGenerationParams {
  textbookScope: string;
  textbookTheme?: string;
  textbookLesson?: number;
  textbookData: any;
}

export async function generateExamFromTextbook(params: TextbookGenerationParams): Promise<ExamQuestion[]> {
  const { model } = await getModel();
  const totalQuestions = params.nbCount + params.thCount + params.vdCount + params.vdcCount;

  let filteredLessons = params.textbookData.lessons;
  if (params.textbookScope === 'term1') {
    filteredLessons = filteredLessons.slice(0, 15);
  } else if (params.textbookScope === 'term2') {
    filteredLessons = filteredLessons.slice(15);
  } else if (params.textbookScope === 'theme' && params.textbookTheme) {
    filteredLessons = filteredLessons.filter((l: any) => l.theme === params.textbookTheme);
  } else if (params.textbookScope === 'lesson' && params.textbookLesson) {
    filteredLessons = filteredLessons.filter((l: any) => l.lesson_id === params.textbookLesson);
  } else if (params.textbookScope === 'custom' && params.customTopic) {
    const specificIds = params.customTopic.split(',').map(s => parseInt(s.trim()));
    filteredLessons = filteredLessons.filter((l: any) => specificIds.includes(l.lesson_id));
  }

  const lessonContents = filteredLessons.map((l: any) => `- ${l.title}: ${l.content}`).join('\n');
  const contextSection = `\n\nNỘI DUNG KIẾN THỨC SÁCH GIÁO KHOA:\n---\n${lessonContents}\n---\nChỉ được ra đề dựa trên kiến thức trong phạm vi này. Câu hỏi phải tự nhiên, KHÔNG nhắc đến sách, tài liệu hay bài học trong nội dung câu hỏi.`;

  const prompt = `Bạn là chuyên gia ra đề thi theo chuẩn Bộ GD&ĐT Việt Nam (Công văn 7991/BGDĐT-GDTrH).

Hãy tạo đề thi môn Tự nhiên và Xã hội lớp 3 với các thông số sau:
- Mức độ khó: ${params.difficulty === 'easy' ? 'Dễ' : params.difficulty === 'hard' ? 'Khó' : 'Trung bình'}
- Ma trận đề (Công văn 7991):
  + Nhận biết (NB): ${params.nbCount} câu
  + Thông hiểu (TH): ${params.thCount} câu
  + Vận dụng (VD): ${params.vdCount} câu
  + Vận dụng cao (VDC): ${params.vdcCount} câu
  + Tổng: ${totalQuestions} câu${contextSection}

YÊU CẦU QUAN TRỌNG:
1. Mọi câu hỏi phải TẬP TRUNG vào nội dung kiến thức đã cho.
2. Đáp án phải chính xác, có giải thích rõ ràng
3. Điểm mỗi câu phân bổ đều trong mức độ tương ứng
4. TUYỆT ĐỐI KHÔNG dùng các cụm từ sau trong nội dung câu hỏi, đáp án hoặc giải thích: "Theo tài liệu", "Dựa vào tài liệu", "Theo SGK", "Theo bài học", "Theo đoạn văn", "Đoạn trên", "Tài liệu trên", "Văn bản trên", "Trong bài", "Theo bài". Câu hỏi phải hoàn toàn tự nhiên và độc lập.

Trả về JSON hợp lệ theo format sau (không có markdown, chỉ JSON thuần):
[
  {
    "id": "q1",
    "level": "NB",
    "type": "multiple_choice",
    "content": "Nội dung câu hỏi",
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

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Raw AI textbook response (no JSON array):', text.slice(0, 500));
      throw new Error('AI không trả về JSON hợp lệ. Vui lòng thử lại.');
    }

    const questions: ExamQuestion[] = JSON.parse(jsonMatch[0]);
    return cleanQuestions(questions);
  } catch (error: any) {
    console.error('AI textbook generation error:', error);
    const userMsg = error.message?.includes('API key') ? 'GEMINI_API_KEY không hợp lệ hoặc chưa được cấu hình'
      : error.message?.includes('quota') ? 'Vượt giới hạn quota Gemini API'
      : error.message || 'Không thể tạo đề thi từ SGK bằng AI';
    throw new Error(userMsg);
  }
}

/**
 * Làm sạch câu hỏi: loại bỏ các cụm từ tham chiếu tài liệu
 * mà AI vẫn có thể sinh ra dù đã có prompt cấm.
 */
const BANNED_PREFIXES = [
  /^Theo tài liệu[,.]?\s*/gi,
  /^Dựa (vào|theo) tài liệu[,.]?\s*/gi,
  /^Theo SGK[,.]?\s*/gi,
  /^Theo bài học[,.]?\s*/gi,
  /^Theo đoạn (văn|trên)[,.]?\s*/gi,
  /^Trong (tài liệu|bài|SGK|văn bản)[,.]?\s*/gi,
  /^(Tài liệu|Văn bản|Đoạn văn|Bài) trên cho biết[,:]?\s*/gi,
  /^Theo (văn bản|bài|đoạn văn|nội dung) (trên|đã cho)[,.]?\s*/gi,
];

function cleanText(text: string): string {
  if (!text) return text;
  let cleaned = text;
  for (const pattern of BANNED_PREFIXES) {
    cleaned = cleaned.replace(pattern, '');
  }
  // Viết hoa chữ đầu nếu bị cắt
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function cleanQuestions(questions: ExamQuestion[]): ExamQuestion[] {
  return questions.map(q => ({
    ...q,
    content: cleanText(q.content),
    ...(q.options ? { options: q.options.map(cleanText) } : {}),
    ...(q.explanation ? { explanation: cleanText(q.explanation) } : {}),
  }));
}
