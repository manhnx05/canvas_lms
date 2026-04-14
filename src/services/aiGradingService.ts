import { getGeminiModel } from '@/src/lib/gemini';
import { HttpError } from '@/src/utils/errorHandler';

export const aiGradingService = {
  analyzeWorksheet: async (
    imageParts: Array<{ base64Data: string; mimeType: string }>,
    prompt: string = "Hãy phân tích phiếu bài tập sau."
  ) => {
    if (!process.env.GEMINI_API_KEY) {
      throw new HttpError(500, 'Hệ thống chưa cấu hình GEMINI_API_KEY');
    }

    // Must use a model that supports vision
    const model = getGeminiModel('gemini-1.5-pro'); // 1.5 pro handles handwriting better
    
    const systemPrompt = `Bạn là một giáo viên chuyên chấm bài. Nhiệm vụ của bạn là đọc hình ảnh phiếu bài tập của học sinh, trích xuất thông tin cá nhân và chấm điểm bài làm. Đặc biệt, hãy đánh giá bài làm dựa trên KHUNG NĂNG LỰC KHOA HỌC dưới đây.

*** KHUNG NĂNG LỰC KHOA HỌC ***
1. Nhận thức khoa học:
   - (1.1) Nêu, nhận biết sự vật, hiện tượng.
   - (1.2) Mô tả sự vật hiện tượng (nói, viết, vẽ).
   - (1.3) Trình bày đặc điểm, vai trò.
   - (1.4) So sánh, lựa chọn, phân loại theo tiêu chí.
2. Tìm hiểu môi trường tự nhiên & xã hội:
   - (2.5) Đặt câu hỏi đơn giản.
   - (2.6) Quan sát, thực hành tìm hiểu.
   - (2.7) Nhận xét đặc điểm, so sánh sự giống/khác và sự thay đổi theo thời gian.
3. Vận dụng kiến thức, kĩ năng:
   - (3.8) Giải thích sự vật, hiện tượng.
   - (3.9) Phân tích tình huống an toàn, sức khỏe.
   - (3.10) Giải quyết vấn đề, đưa ra ứng xử phù hợp.

*** CHỦ ĐỀ: Trái Đất và Bầu trời ***
- Phương hướng: Kể 4 phương, xác định phương bằng Măt trời/la bàn.
- Đặc điểm Trái Đất: Hình dạng qua quả địa cầu, cực Bắc/Nam, Xích đạo, đới khí hậu, châu lục, đại dương, địa hình.
- Trái Đất trong hệ Mặt trời: Vị trí, chiều chuyển động, hiện tượng ngày và đêm.

*** CÁC MỨC ĐỘ ĐÁNH GIÁ (TIÊU CHÍ) ***
- Mức 1 (1 điểm): Chưa nhận biết/Chưa mô tả được/Chưa giải thích được/Chưa giải quyết được vấn đề.
- Mức 2 (2 điểm): Đã nhận biết/mô tả/giải thích/giải quyết được nhưng còn lúng túng, chưa khoa học, logic, rành mạch hoặc chưa đầy đủ.
- Mức 3 (3 điểm): Phân biệt/gọi tên/mô tả/giải thích/giải quyết hoàn toàn chính xác, khoa học, logic, đầy đủ.

${imageParts.length > 1 ? `\n*** LƯU Ý: Có ${imageParts.length} ảnh được gửi. Hãy phân tích TẤT CẢ các ảnh để đánh giá toàn diện bài làm của học sinh. ***\n` : ''}

Dữ liệu đầu ra BẮT BUỘC phải là 1 object JSON hợp lệ, không bọc trong markdown block.
Cấu trúc JSON:
{
  "studentName": "Tên học sinh (trống nếu không thấy)",
  "studentDob": "Ngày sinh (trống nếu không thấy)",
  "studentClass": "Lớp (trống nếu không thấy)",
  "score": Điểm số (kiểu số, thang điểm 10 - tổng hợp từ các mức độ NL đạt được),
  "evaluation": "Nội dung nhận xét bài làm bằng văn bản (có thể dùng Markdown). Hãy chỉ rõ bé đạt 'Mức 1, 2 hay 3' ở cụ thể các biểu hiện năng lực nào có trong bài, phân tích đúng/sai do đâu, nhận xét cách giải quyết vấn đề và đưa ra lời khuyên cụ thể.",
  "chatResponse": "Lời chào và tóm tắt ngắn gửi giáo viên. (Vd: Đây là bài làm của em Nguyễn Văn A. Điểm số: 8. Bé thể hiện tốt Năng lực nhận thức khoa học ở Mức 3...)"
}

Lưu ý:
- Trích xuất thông tin cá nhân chính xác từ hình ảnh.
- Bám sát định mức 3 Mức độ (1,2,3) cho từng biểu hiện của Khung năng lực khoa học trong phần nhận xét (evaluation).
- Đầu ra CHỈ gồm JSON, không bình luận thêm.`;

    try {
      // Build content parts for Gemini
      const contentParts: any[] = [
        { text: systemPrompt + "\n\nNội dung nhắc nhở thêm: " + prompt }
      ];

      // Add all images
      for (const img of imageParts) {
        contentParts.push({
          inlineData: {
            data: img.base64Data,
            mimeType: img.mimeType,
          },
        });
      }

      console.log('[AI Grading Service] Calling Gemini with', imageParts.length, 'images');

      const result = await model.generateContent(contentParts);
      
      let text = result.response.text();
      
      console.log('[AI Grading Service] Raw Gemini response:', text.substring(0, 200));
      
      text = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
      
      console.log('[AI Grading Service] Cleaned response:', text.substring(0, 200));
      
      const parsedData = JSON.parse(text);
      
      console.log('[AI Grading Service] Parsed data:', parsedData);
      
      return parsedData;
    } catch (error: any) {
      console.error('[AI Grading Service] Error details:', error);
      console.error('[AI Grading Service] Error message:', error.message);
      console.error('[AI Grading Service] Error stack:', error.stack);
      
      if (error.message?.includes('JSON')) {
        throw new HttpError(500, `Lỗi phân tích phản hồi từ AI. Vui lòng thử lại.`);
      }
      
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
