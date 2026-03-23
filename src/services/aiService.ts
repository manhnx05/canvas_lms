import { getGeminiModel } from '@/src/lib/gemini';
import { HttpError } from '@/src/utils/errorHandler';

export const aiService = {
  generateQuiz: async (data: any) => {
    const { topic, numQuestions = 5, gradeLevel = 'Tiểu học' } = data;
    
    if (!process.env.GEMINI_API_KEY) {
      throw new HttpError(500, 'System is missing GEMINI_API_KEY');
    }

    const model = getGeminiModel();
    const prompt = `Bạn là một giáo viên chuyên nghiệp. Sinh ra chính xác ${numQuestions} câu hỏi trắc nghiệm bằng Tiếng Việt cho học sinh cấp ${gradeLevel} về chủ đề: "${topic}".
    Yêu cầu ĐẦU RA CHỈ LÀ MỘT MẢNG JSON HỢP LỆ, không kèm theo bất kỳ văn bản giải thích nào khác (không bọc trong \`\`\`json).
    Cấu trúc mỗi object trong mảng:
    {
      "id": string (tạo uuid ngẫu nhiên),
      "question": string,
      "options": [{"id": "A", "text": string}, {"id": "B", "text": string}, {"id": "C", "text": string}, {"id": "D", "text": string}],
      "correctOptionId": string ("A", "B", "C" hoặc "D"),
      "difficulty": "easy" | "medium" | "hard",
      "explanation": string (giải thích ngắn tại sao đáp án đúng)
    }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) cleanedText = cleanedText.slice(7);
    if (cleanedText.startsWith('```')) cleanedText = cleanedText.slice(3);
    if (cleanedText.endsWith('```')) cleanedText = cleanedText.slice(0, -3);
    
    return JSON.parse(cleanedText.trim());
  },

  evaluateSubmission: async (data: any) => {
    const { questions, answers, studentName } = data;
    
    if (!process.env.GEMINI_API_KEY) {
      throw new HttpError(500, 'System is missing GEMINI_API_KEY');
    }

    const model = getGeminiModel();
    const prompt = `Bạn là một giáo viên thân thiện. Dưới đây là bài làm trắc nghiệm của học sinh tên ${studentName || "bé"}.
    Danh sách câu hỏi đề thi: ${JSON.stringify(questions)}
    Đáp án học sinh chọn (Map of questionId -> optionId): ${JSON.stringify(answers)}
    
    Nhiệm vụ: Viết NHẬN XÉT chi tiết (không liệt kê lại câu hỏi) gửi trực tiếp cho học sinh đó (xưng hô Cô/Thầy và Con/Bé) gồm 3 phần rõ ràng:
    1. Kiến thức đã hiểu tốt (Dựa vào các câu làm đúng)
    2. Lỗ hổng kiến thức cần chú ý (Dựa vào các câu làm sai, giải thích ngắn gọn tại sao câu đó sai nếu có)
    3. Lời khuyên/Đề xuất cải thiện để học tốt hơn.
    Hãy format bằng Markdown có in đậm tiêu đề. Không nói lan man.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
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

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
};
