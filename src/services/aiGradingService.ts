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

    const contentParts: any[] = [
      { text: systemPrompt + "\n\nNội dung nhắc nhở thêm: " + prompt }
    ];

    for (const img of imageParts) {
      contentParts.push({
        inlineData: { data: img.base64Data, mimeType: img.mimeType },
      });
    }

    // Auto-fallback mechanism across most stable available Gemini versions
    const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];
    let lastErrorMsg = '';

    for (const modelName of FALLBACK_MODELS) {
      try {
        console.log(`[AI Grading Service] Trying model: ${modelName} with`, imageParts.length, 'images');
        const model = getGeminiModel(modelName);
        const result = await model.generateContent(contentParts);

        if (!result.response) {
          throw new HttpError(500, 'AI không thể phân tích ảnh này.');
        }

        const response = result.response;
        if (response.promptFeedback?.blockReason) {
          throw new HttpError(400, 'Ảnh bị từ chối do vi phạm chính sách an toàn của AI.');
        }

        let text = response.text().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
        return JSON.parse(text);
      } catch (error: any) {
        console.warn(`[AI Grading Service] Model ${modelName} failed:`, error.message);
        
        // Immediately forward specific explicit errors (like syntax or safety blocks)
        if (error instanceof HttpError) throw error;
        if (error instanceof SyntaxError || error.name === 'SyntaxError') {
          throw new HttpError(500, 'AI trả về dữ liệu không hợp lệ. Vui lòng thử hình ảnh khác.');
        }

        const msg = (error.message || '').toLowerCase();
        lastErrorMsg = msg;

        if (msg.includes('api_key') || msg.includes('api key') || (msg.includes('invalid') && msg.includes('key'))) {
          throw new HttpError(500, 'Lỗi cấu hình API key. Vui lòng kiểm tra lại biến môi trường GEMINI_API_KEY.');
        }
        
        // If it's a quota limit (429) OR model not found (404), fall back to the next model in the loop!
        if (msg.includes('404') || msg.includes('not found') || msg.includes('resource_exhausted') || msg.includes('quota exceeded') || msg.includes('429')) {
          continue; 
        }

        // Unhandled errors (e.g. timeout / disconnected) throw explicitly
        throw new HttpError(500, `Lỗi AI (${modelName}): ${error.message}`);
      }
    }

    // Exhausted all models
    throw new HttpError(429, `Tất cả các Model đều quá tải hoặc bị chặn. Lỗi gần nhất: ${lastErrorMsg}`);
  },

  chatWithContext: async (history: any[], message: string) => {
    if (!process.env.GEMINI_API_KEY) {
      throw new HttpError(500, 'Hệ thống chưa cấu hình GEMINI_API_KEY');
    }
    const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];
    let lastErrorMsg = '';

    for (const modelName of FALLBACK_MODELS) {
      try {
        console.log(`[AI Chat] Trying model: ${modelName}`);
        const model = getGeminiModel(modelName);
        
        const chat = model.startChat({
          history: history.map(h => ({
            role: h.role,
            parts: [{ text: h.content }]
          }))
        });

        const result = await chat.sendMessage(message);
        return result.response.text();
      } catch (error: any) {
        console.warn(`[AI Chat] Model ${modelName} failed:`, error.message);
        
        const msg = (error.message || '').toLowerCase();
        lastErrorMsg = msg;
        
        if (msg.includes('404') || msg.includes('not found') || msg.includes('resource_exhausted') || msg.includes('quota exceeded') || msg.includes('429')) {
          continue; 
        }

        throw new HttpError(500, `Gemini API: ${error.message || 'Lỗi không xác định'}`);
      }
    }

    throw new HttpError(429, `Tất cả Model đều từ chối yêu cầu. Lỗi gần nhất: ${lastErrorMsg}`);
  }
};
