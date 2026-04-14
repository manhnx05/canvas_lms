import { getGeminiModel } from '@/src/lib/gemini';
import { HttpError } from '@/src/utils/errorHandler';
import fs from 'fs';
import path from 'path';

let khungNangLucCache = "";

function getKhungNangLucText() {
  if (khungNangLucCache) return khungNangLucCache;
  try {
    const filePath = path.join(process.cwd(), 'public', 'khung_nang_luc', 'khung_nang_luc.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    khungNangLucCache = fileContent;
  } catch (err) {
    console.error("[AI Grading] Không thể đọc file khung_nang_luc.json:", err);
  }
  return khungNangLucCache;
}

export const aiGradingService = {
  analyzeWorksheet: async (
    imageParts: Array<{ base64Data: string; mimeType: string }>,
    prompt: string = "Hãy phân tích phiếu bài tập sau."
  ) => {
    if (!process.env.GEMINI_API_KEY) {
      throw new HttpError(500, 'Hệ thống chưa cấu hình GEMINI_API_KEY');
    }

    const khungNangLucData = getKhungNangLucText();

    const systemPrompt = `Bạn là một giáo viên chuyên chấm bài. Nhiệm vụ của bạn là đọc hình ảnh phiếu bài tập của học sinh, trích xuất thông tin cá nhân và chấm điểm.
Đặc biệt, hãy đối chiếu bài làm CHÍNH XÁC với KHUNG NĂNG LỰC KHOA HỌC định dạng JSON dưới đây để đưa ra đánh giá.

*** KHUNG NĂNG LỰC KHOA HỌC ***
${khungNangLucData}

${imageParts.length > 1 ? `\n*** LƯU Ý: Có ${imageParts.length} ảnh được gửi. Hãy phân tích TẤT CẢ các ảnh để đánh giá toàn diện bài làm của học sinh. ***\n` : ''}

Dữ liệu đầu ra BẮT BUỘC phải là 1 object JSON hợp lệ, không bọc trong markdown block.
Cấu trúc JSON yêu cầu:
{
  "studentName": "Tên học sinh (trống nếu không thấy)",
  "studentDob": "Ngày sinh (trống nếu không thấy)",
  "studentClass": "Lớp (trống nếu không thấy)",
  "score": Điểm số (kiểu số, thang điểm 10 - tổng hợp từ các mức độ NL đạt được),
  "evaluation": "Nội dung nhận xét bài làm bằng văn bản Markdown. BẮT BUỘC liệt kê rõ: Bé đạt cụ thể 'Mức 1, 2 hay 3' ở các biểu hiện năng lực nào có trong Bảng 2.2 của JSON. Phân tích cụ thể dựa trên đáp án đúng/sai của học sinh. Gạch đầu dòng rõ ràng để phụ huynh dễ theo dõi.",
  "chatResponse": "Lời chào và tóm tắt cực ngắn gửi giáo viên (khoảng 3-4 câu). VD: Bài làm của Mạnh đạt điểm 8. Bé đạt Mức 3 ở kỹ năng nhận thức khoa học..."
}

Lưu ý:
- Bám sát tiêu chí 3 Mức độ (1,2,3) từ 'cac_muc_do_tieu_chi_nang_luc_khoa_hoc_bang_2_2'.
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
        
        // If it's a quota limit (429), model not found (404), or server overload (503), fall back to the next model in the loop!
        if (msg.includes('404') || msg.includes('not found') || msg.includes('resource_exhausted') || msg.includes('quota exceeded') || msg.includes('429') || msg.includes('503') || msg.includes('service unavailable')) {
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
        
        if (msg.includes('404') || msg.includes('not found') || msg.includes('resource_exhausted') || msg.includes('quota exceeded') || msg.includes('429') || msg.includes('503') || msg.includes('service unavailable')) {
          continue; 
        }

        throw new HttpError(500, `Gemini API: ${error.message || 'Lỗi không xác định'}`);
      }
    }

    throw new HttpError(429, `Tất cả Model đều từ chối yêu cầu. Lỗi gần nhất: ${lastErrorMsg}`);
  }
};
