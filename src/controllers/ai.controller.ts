import { Request, Response } from 'express';
import { getGeminiModel } from '../lib/gemini';

export const generateQuiz = async (req: Request, res: Response) => {
  try {
    const { topic, numQuestions = 5, gradeLevel = 'Tiểu học' } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'System is missing GEMINI_API_KEY' });
    }

    const model = getGeminiModel();
    const prompt = `Bạn là một giáo viên chuyên nghiệp. Sinh ra chính xác ${numQuestions} câu hỏi trắc nghiệm bằng Tiếng Việt cho học sinh cấp ${gradeLevel} về chủ đề: "${topic}".
    Yêu cầu ĐẦU RA CHỈ LÀ MỘT MẢNG JSON HỢP LỆ, không kèm theo bất kỳ văn bản giải thích nào khác (không bọc trong \`\`\`json).
    Cấu trúc mỗi object trong mảng:
    {
      "id": string (tạo uuid ngẫu nhiên),
      "question": string,
      "options": [{"id": "A", "text": string}, {"id": "B", "text": string}, {"id": "C", "text": string}, {"id": "D", "text": string}],
      "correctOptionId": string ("A", "B", "C" hoặc "D")
    }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Clean potential markdown formatting
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) cleanedText = cleanedText.slice(7);
    if (cleanedText.startsWith('```')) cleanedText = cleanedText.slice(3);
    if (cleanedText.endsWith('```')) cleanedText = cleanedText.slice(0, -3);
    
    const questions = JSON.parse(cleanedText.trim());
    res.json({ questions });
  } catch (error: any) {
    console.error('AI Generate Error:', error);
    res.status(500).json({ error: 'Lỗi sinh đề bằng AI', details: error.message });
  }
};

export const evaluateSubmission = async (req: Request, res: Response) => {
  try {
    const { questions, answers, studentName } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'System is missing GEMINI_API_KEY' });
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
    const feedback = result.response.text();
    
    res.json({ feedback });
  } catch (error: any) {
    console.error('AI Evaluate Error:', error);
    res.status(500).json({ error: 'Lỗi đánh giá AI', details: error.message });
  }
};
