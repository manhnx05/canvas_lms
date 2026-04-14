import { getGeminiModel } from '@/src/lib/gemini';
import { HttpError } from '@/src/utils/errorHandler';

export const aiGradingService = {
  analyzeWorksheet: async (
    base64Image: string,
    mimeType: string,
    prompt: string = "Hãy phân tích phiếu bài tập sau."
  ) => {
    if (!process.env.GEMINI_API_KEY) {
      throw new HttpError(500, 'Hệ thống chưa cấu hình GEMINI_API_KEY');
    }

    // Must use a model that supports vision
    const model = getGeminiModel('gemini-1.5-pro'); // 1.5 pro handles handwriting better
    
    const systemPrompt = `Bạn là một giáo viên chuyên chấm bài. Nhiệm vụ của bạn là đọc hình ảnh phiếu bài tập của học sinh, trích xuất thông tin cá nhân và chấm điểm bài làm.

Dữ liệu đầu ra BẮT BUỘC phải là 1 object JSON hợp lệ, không bọc trong markdown block.
Cấu trúc JSON:
{
  "studentName": "Tên học sinh (trống nếu không thấy)",
  "studentDob": "Ngày sinh (trống nếu không thấy)",
  "studentClass": "Lớp (trống nếu không thấy)",
  "score": Điểm số (kiểu số, thang điểm 10 theo đánh giá của bạn),
  "evaluation": "Nội dung nhận xét bài làm bằng văn bản (Markdown allowed). Phân tích đúng sai, đưa ra lời khuyên cụ thể cho bé.",
  "chatResponse": "Lời chào và tóm tắt ngắn gửi giáo viên. (Vd: Đây là bài làm của em Nguyễn Văn A. Điểm số: 8. Bài làm khá tốt...)"
}

Lưu ý:
- Trích xuất thông tin một cách chính xác dựa vào hình ảnh.
- Đưa ra nhận xét khách quan.
- Đầu ra CHỈ gồm JSON, không bình luận thêm.`;

    try {
      const result = await model.generateContent([
        systemPrompt + "\n\nNội dung nhắc nhở thêm: " + prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
      ]);
      
      let text = result.response.text();
      text = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
      
      const parsedData = JSON.parse(text);
      return parsedData;
    } catch (error: any) {
      console.error('AI analyzeWorksheet error details:', error);
      throw new HttpError(500, `Gemini API: ${error.message || 'Lỗi nhận dạng ảnh'}`);
    }
  },

  chatWithContext: async (history: any[], message: string) => {
    if (!process.env.GEMINI_API_KEY) {
      throw new HttpError(500, 'Hệ thống chưa cấu hình GEMINI_API_KEY');
    }
    const model = getGeminiModel('gemini-1.5-pro');
    
    // We construct the chat history
    // History should have user and model roles.
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: h.imageUrl 
          ? [{ text: h.content }]  // We omit vision part in history to save tokens if we want, but ideally we should include it if needed. However, since the model maintains context, we can just pass text for history, or we start fresh if we don't have base64. 
          : [{ text: h.content }]
      }))
    });

    try {
      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (error: any) {
      console.error('AI chatWithContext error:', error);
      throw new HttpError(500, `Gemini API: ${error.message || 'Lỗi không xác định'}`);
    }
  }
};
