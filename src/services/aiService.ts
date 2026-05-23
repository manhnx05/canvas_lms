import { getGeminiModel } from '@/src/lib/gemini';
import { HttpError } from '@/src/utils/errorHandler';
import { SchemaType } from '@google/generative-ai';

export const aiService = {
  generateQuiz: async (data: any) => {
    const { topic, numQuestions = 5, gradeLevel = 'Tiểu học' } = data;
    
    if (!process.env.GEMINI_API_KEY) {
      throw new HttpError(500, 'System is missing GEMINI_API_KEY');
    }

    const model = getGeminiModel();
    const prompt = `Bạn là một giáo viên chuyên nghiệp. Sinh ra chính xác ${numQuestions} câu hỏi trắc nghiệm bằng Tiếng Việt cho học sinh cấp ${gradeLevel} về chủ đề: "${topic}".
    LƯU Ý QUAN TRỌNG: Trong trường "text" của options, TUYỆT ĐỐI KHÔNG ghi thêm ký tự tiền tố (VD: "A. ", "B. ", "C) ") mà CHỈ GHI phần nội dung đáp án trơn.`;

    const responseSchema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: "tạo uuid ngẫu nhiên" },
          question: { type: SchemaType.STRING },
          options: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING, description: "A, B, C, D" },
                text: { type: SchemaType.STRING }
              },
              required: ["id", "text"]
            }
          },
          correctOptionId: { type: SchemaType.STRING, description: "A, B, C, hoặc D" },
          difficulty: { type: SchemaType.STRING, description: "easy, medium, hoặc hard" },
          explanation: { type: SchemaType.STRING, description: "giải thích ngắn tại sao đáp án đúng" }
        },
        required: ["id", "question", "options", "correctOptionId", "difficulty", "explanation"]
      }
    } as any;

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });
      
      const text = result.response.text();
      const parsedData = JSON.parse(text);
      
      return parsedData;
    } catch (error: any) {
      console.error('AI generateQuiz error details:', error);
      throw new HttpError(500, `Gemini API: ${error.message || 'Lỗi sinh đề quiz'}`);
    }
  },

  evaluateSubmission: async (data: any) => {
    const { questions, answers, studentName, assignmentTitle, assignmentContext } = data;
    
    if (!process.env.GEMINI_API_KEY) {
      throw new HttpError(500, 'System is missing GEMINI_API_KEY');
    }

    const model = getGeminiModel();
    const prompt = `Bạn là một giáo viên thân thiện. Dưới đây là bài làm trắc nghiệm của học sinh tên ${studentName || "bé"}.
    Thông tin bài tập: "${assignmentTitle || "Bài kiểm tra"}".
    Mục tiêu kiến thức (chuẩn đầu ra) / Yêu cầu: "${assignmentContext || "Không xác định"}".
    Danh sách câu hỏi đề thi: ${JSON.stringify(questions)}
    Đáp án học sinh chọn (Map of questionId -> optionId): ${JSON.stringify(answers)}
    
    Nhiệm vụ: Viết NHẬN XÉT gửi trực tiếp cho học sinh (xưng hô Cô/Thầy và Con/Bé) BẮT BUỘC tuân thủ ĐÚNG cấu trúc Markdown gồm 3 mục dưới đây (không thêm bớt tựa đề chính):
    
    **1. Phần đã tốt**
    - Kiến thức: (Nhận xét những kiến thức môn học làm đúng)
    - Năng lực: (Nhận xét kỹ năng tư duy logic, áp dụng, v.v.)
    
    **2. Phần hạn chế**
    - Kiến thức: (Chỉ ra những lỗ hổng kiến thức con làm sai so với chuẩn đầu ra)
    - Năng lực: (Yếu tố logic chưa tốt, thiếu cẩn thận, phân tích sai đồ thị...)
    
    **3. Lời khuyên/ lời đề xuất cải thiện**
    - (Đưa ra các phương pháp học tập/ôn tập cụ thể giúp con tiến bộ hơn)

    Tuyệt đối phải theo khung này, không liệt kê lại câu hỏi dài dòng.`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.error('AI evaluateSubmission error details:', error);
      throw new HttpError(500, `Gemini API: ${error.message || 'Lỗi nhận xét'}`);
    }
  },

  chat: async (data: any) => {
    const { message, context, studentName, gradeLevel = 'Tiểu học' } = data;

    if (!message || message.trim() === '') {
      throw new HttpError(400, 'Thiếu nội dung câu hỏi');
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new HttpError(500, 'Hệ thống chưa cấu hình GEMINI_API_KEY');
    }

    const model = getGeminiModel();
    const systemContext = context
      ? `Context học tập của học sinh: ${JSON.stringify(context)}\n`
      : '';

    const prompt = `Bạn là trợ lý AI thân thiện, chuyên hỗ trợ học sinh tiểu học cấp ${gradeLevel}${studentName ? ` tên ${studentName}` : ''}.
${systemContext}Hãy trả lời câu hỏi sau một cách đơn giản, dễ hiểu, vui tươi phù hợp với trẻ em. Dùng emoji để thêm sinh động. Nếu liên quan đến bài học, hãy giải thích từng bước rõ ràng.

Câu hỏi: "${message}"

Trả lời bằng Markdown, ngắn gọn nhưng đầy đủ.`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.error('AI chat error details:', error);
      throw new HttpError(500, `Gemini API: ${error.message || 'Lỗi không xác định'}`);
    }
  }
};
