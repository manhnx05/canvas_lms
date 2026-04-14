import { getGeminiModel } from '@/src/lib/gemini';
import { HttpError } from '@/src/utils/errorHandler';

export const aiGradingService = {
  analyzeWorksheet: async (
    images: Array<{ base64Data: string; mimeType: string }>,
    prompt: string = "Hãy phân tích phiếu bài tập sau."
  ) => {
    if (!process.env.GEMINI_API_KEY) {
      throw new HttpError(500, 'Hệ thống chưa cấu hình GEMINI_API_KEY');
    }
    if (!images || images.length === 0) {
      throw new HttpError(400, 'Dữ liệu ảnh trống.');
    }

    // Must use a model that supports vision
    const model = getGeminiModel('gemini-1.5-pro'); // 1.5 pro handles handwriting better
    
    const systemPrompt = `Bạn là một giáo viên chuyên chấm bài. Nhiệm vụ của bạn là đọc hình ảnh phiếu bài tập của học sinh, trích xuất thông tin cá nhân và chấm điểm bài làm. Đặc biệt, hãy đánh giá bài làm dựa trên KHUNG NĂNG LỰC KHOA HỌC chi tiết dưới đây.

*** KHUNG TIÊU CHÍ VÀ NĂNG LỰC ĐÁNH GIÁ (JSON) ***
{
  "khung_nang_luc_khoa_hoc_bang_1_1": {
    "tieu_de": "Bảng 1.1. Khung Năng lực khoa học",
    "du_lieu": [
      {
        "thanh_phan_nang_luc": "Nhận thức khoa học",
        "bieu_hien": [
          "− Nêu, nhận biết được ở mức độ đơn giản một số sự vật, hiện tượng, mối quan hệ thường gặp trong môi trường tự nhiên và xã hội xung quanh như về sức khoẻ và sự an toàn trong cuộc sống, mối quan hệ của HS với gia đình, nhà trường, cộng đồng và thế giới tự nhiên,…",
          "− Mô tả được một số sự vật, hiện tượng tự nhiên và xã hội xung quanh bằng các hình thức biểu đạt như nói, viết, vẽ,…",
          "− Trình bày được một số đặc điểm, vai trò của một số sự vật, hiện tượng thường gặp trong môi trường tự nhiên và xã hội xung quanh.",
          "− So sánh, lựa chọn, phân loại được các sự vật, hiện tượng đơn giản trong tự nhiên và xã hội theo một số tiêu chí."
        ]
      },
      {
        "thanh_phan_nang_luc": "Tìm hiểu môi trường tự nhiên và xã hội xung quanh",
        "bieu_hien": [
          "− Đặt được các câu hỏi đơn giản về một số sự vật, hiện tượng, mối quan hệ trong tự nhiên và xã hội xung quanh.",
          "− Quan sát, thực hành đơn giản để tìm hiểu được về sự vật, hiện tượng, mối quan hệ trong tự nhiên và xã hội xung quanh.",
          "− Nhận xét được về những đặc điểm bên ngoài, so sánh sự giống, khác nhau giữa các sự vật, hiện tượng xung quanh và sự thay đổi của chúng theo thời gian một cách đơn giản thông qua kết quả quan sát, thực hành."
        ]
      },
      {
        "thanh_phan_nang_luc": "Vận dụng kiến thức, kĩ năng đã học",
        "bieu_hien": [
          "− Giải thích được ở mức độ đơn giản một số sự vật, hiện tượng, mối quan hệ trong tự nhiên và xã hội xung quanh.",
          "− Phân tích được tình huống liên quan đến vấn đề an toàn, sức khoẻ của bản thân, người khác và môi trường sống xung quanh.",
          "− Giải quyết được vấn đề, đưa ra được cách ứng xử phù hợp trong các tình huống có liên quan (ở mức độ đơn giản); trao đổi, chia sẻ với những người xung quanh để cùng thực hiện; nhận xét được cách ứng xử trong mỗi tình huống."
        ]
      }
    ]
  },
  "noi_dung_chu_de_trai_dat_va_bau_troi_bang_2_1": {
    "tieu_de": "Nội dung chủ đề Trái Đất và Bầu trời - Bảng 2.1. Khung Năng lực khoa học",
    "du_lieu": [
      {
        "noi_dung": "Phương hướng",
        "yeu_cau_can_dat": [
          "Kể được bốn phương chính trong không gian theo quy ước.",
          "Thực hành xác định được các phương chính dựa trên phương Mặt Trời mọc, Mặt trời lặn hoặc sử dụng la bàn."
        ]
      },
      {
        "noi_dung": "Một số đặc điểm của Trái Đất",
        "yeu_cau_can_dat": [
          "Nhận biết ban đầu về hình dạng Trái Đất qua quả địa cầu.",
          "Chỉ được cực Bắc, cực Nam, đường Xích đạo, bán cầu Bắc, bán cầu Nam và các đới khí hậu trên quả địa cầu.",
          "Trình bày được một vài hoạt động tiêu biểu của con người ở từng đới khí hậu dựa vào tranh ảnh và (hoặc) video.",
          "Tìm và nói được tên các châu lục và các đại dương trên quả địa cầu. Chỉ được vị trí của Việt Nam trên quả địa cầu.",
          "Nêu được một số dạng địa hình của Trái Đất: đồng bằng, đồi, núi, cao nguyên; song, hồ, biển, đại dương dựa vào tranh ảnh và (hoặc) video.",
          "Xác định được nơi HS đang sống thuộc dạng địa hình nào."
        ]
      },
      {
        "noi_dung": "Trái Đất trong hệ Mặt trời.",
        "yeu_cau_can_dat": [
          "Chỉ và nói được vị trí của Trái Đất trong hệ Mặt trời trên sơ đồ, tranh ảnh.",
          "Chỉ và trình bày được chiều chuyển động của Trái Đất quanh mình nó và quanh Mặt Trời trên sơ đồ và ( hoặc) mô hình.",
          "Giải thích được ở mức độ đơn giản hiện tượng ngày và đêm, qua sử dụng mô hình hoặc video."
        ]
      }
    ]
  },
  "cac_muc_do_tieu_chi_nang_luc_khoa_hoc_bang_2_2": {
    "tieu_de": "Bảng 2.2: Các mức độ của tiêu chí NL Khoa học",
    "du_lieu": [
      {
        "nang_luc": "1. Nhận thức khoa học",
        "tieu_chi": [
          {
            "bieu_hien": "1. Nêu, nhận biết được ở mức độ đơn giản một số sự vật, hiện tượng, mối quan hệ thường gặp trong môi trường tự nhiên và xã hội xung quanh (1.1)",
            "muc_1_1_diem": "Chưa nêu và nhận biết được một số sự vật, hiện tượng, mối quan hệ thường gặp trong môi trường tự nhiên và xã hội xung quanh",
            "muc_2_2_diem": "Nhận biết được nhưng chưa gọi được tên một số sự vật, hiện tượng, mối quan hệ thường gặp trong môi trường tự nhiên và xã hội xung quanh",
            "muc_3_3_diem": "Phân biệt và gọi tên được chính xác một số sự vật, hiện tượng, mối quan hệ thường gặp trong môi trường tự nhiên và xã hội xung quanh"
          },
          {
            "bieu_hien": "2. Mô tả được một số sự vật, hiện tượng tự nhiên và xã hội xung quanh bằng các hình thức biểu đạt như nói, viết, vẽ,…(1.2)",
            "muc_1_1_diem": "Chưa mô tả được một số sự vật, hiện tượng tự nhiên và xã hội xung quanh bằng các hình thức biểu đạt như nói, viết, vẽ,…",
            "muc_2_2_diem": "Đã biết mô tả một số sự vật, hiện tượng tự nhiên và xã hội xung quanh bằng các hình thức biểu đạt như nói, viết, vẽ,… nhưng còn lúng túng, chưa khoa học, logic",
            "muc_3_3_diem": "Đã mô tả được một số sự vật, hiện tượng tự nhiên và xã hội xung quanh bằng các hình thức biểu đạt như nói, viết, vẽ,…một cách chính xác, logic, khoa học"
          },
          {
            "bieu_hien": "3. Trình bày được một số đặc điểm, vai trò của một số sự vật, hiện tượng thường gặp trong môi trường tự nhiên và xã hội xung quanh (1.3)",
            "muc_1_1_diem": "Chưa trình bày được các đặc điểm, vai trò của một số sự vật, hiện tượng thường gặp trong môi trường tự nhiên và xã hội xung quanh.",
            "muc_2_2_diem": "Trình bày được một số đặc điểm, vai trò của một số sự vật, hiện tượng thường gặp trong môi trường tự nhiên và xã hội xung quanh nhưng chưa logic",
            "muc_3_3_diem": "Trình bày được một số đặc điểm, vai trò của một số sự vật, hiện tượng thường gặp trong môi trường tự nhiên và xã hội xung quanh một cách khoa học, logic và chính xác"
          },
          {
            "bieu_hien": "4. So sánh, lựa chọn, phân loại được các sự vật, hiện tượng đơn giản trong tự nhiên và xã hội theo một số tiêu chí (1.4)",
            "muc_1_1_diem": "Chưa biết cách so sánh, lựa chọn, phân loại được các sự vật, hiện tượng đơn giản trong tự nhiên và xã hội theo một số tiêu chí",
            "muc_2_2_diem": "Đã biết cách so sánh, lựa chọn, phân loại được các sự vật, hiện tượng đơn giản trong tự nhiên và xã hội theo một số tiêu chí nhưng chưa đưa ra được lập luận bảo vệ quan điểm cá nhân",
            "muc_3_3_diem": "Trình bày, lập luận được một cách rõ ràng cách thức so sánh, lựa chọn và phân loại các sự vật, hiện tượng đơn giản trong tự nhiên và xã hội theo một số tiêu chí"
          }
        ]
      },
      {
        "nang_luc": "2. Tìm hiểu môi trường tự nhiên và xã hội xung quanh",
        "tieu_chi": [
          {
            "bieu_hien": "5. Đặt được các câu hỏi đơn giản về một số sự vật, hiện tượng, mối quan hệ trong tự nhiên và xã hội xung quanh (2.5)",
            "muc_1_1_diem": "Chưa đặt được các câu hỏi đơn giản về một số sự vật, hiện tượng, mối quan hệ trong tự nhiên và xã hội xung quanh",
            "muc_2_2_diem": "Đã đưa ra được các câu hỏi đơn giản về một số sự vật, hiện tượng, mối quan hệ trong tự nhiên và xã hội xung quanh nhưng chưa cụ thể, đầy đủ",
            "muc_3_3_diem": "Đặt được các câu hỏi đơn giản về một số sự vật, hiện tượng, mối quan hệ trong tự nhiên và xã hội xung quanh một cách đầy đủ, chính xác, khoa học"
          },
          {
            "bieu_hien": "6. Quan sát, thực hành đơn giản để tìm hiểu được về sự vật, hiện tượng, mối quan hệ trong tự nhiên và xã hội xung quanh (2.6)",
            "muc_1_1_diem": "Chưa quan sát, và thực hành được để tìm hiểu về sự vật, hiện tượng, mối quan hệ trong tự nhiên và xã hội xung quanh",
            "muc_2_2_diem": "Có sự quan sát nhưng chưa đầy đủ để thực hành được để tìm hiểu về sự vật, hiện tượng, mối quan hệ trong tự nhiên và xã hội xung quanh",
            "muc_3_3_diem": "Quan sát đầy đủ các mặt của sự vật, hiện tượng và thực hành tốt việc tìm hiểu về sự vật, hiện tượng, mối quan hệ trong tự nhiên và xã hội xung quanh"
          },
          {
            "bieu_hien": "7. Nhận xét được về những đặc điểm bên ngoài, so sánh sự giống, khác nhau giữa các sự vật, hiện tượng xung quanh và sự thay đổi của chúng theo thời gian một cách đơn giản thông qua kết quả quan sát, thực hành (2.7)",
            "muc_1_1_diem": "Chưa nhận xét được những đặc điểm bên ngoài, so sánh sự giống, khác nhau giữa các sự vật, hiện tượng xung quanh và sự thay đổi của chúng theo thời gian một cách đơn giản thông qua kết quả quan sát, thực hành",
            "muc_2_2_diem": "Đã nhận xét được những đặc điểm bên ngoài nhưng chưa so sánh được sự giống, khác nhau giữa các sự vật, hiện tượng xung quanh và sự thay đổi của chúng theo thời gian thông qua kết quả quan sát, thực hành",
            "muc_3_3_diem": "Đã nhận xét được về những đặc điểm bên ngoài và từ đó so sánh sự giống, khác nhau giữa các sự vật, hiện tượng xung quanh và sự thay đổi của chúng theo thời gian một cách đơn giản thông qua kết quả quan sát, thực hành"
          }
        ]
      },
      {
        "nang_luc": "3. Vận dụng kiến thức, kĩ năng đã học",
        "tieu_chi": [
          {
            "bieu_hien": "8. Giải thích được ở mức độ đơn giản một số sự vật, hiện tượng, mối quan hệ trong tự nhiên và xã hội xung quanh (3.8)",
            "muc_1_1_diem": "Chưa giải thích được ở mức độ đơn giản một số sự vật, hiện tượng, mối quan hệ trong tự nhiên và xã hội xung quanh",
            "muc_2_2_diem": "Đã trình bày, giải thích được ở mức độ đơn giản một số sự vật, hiện tượng, mối quan hệ trong tự nhiên và xã hội xung quanh nhưng chưa logic, rành mạch",
            "muc_3_3_diem": "Đã giải thích được ở mức độ đơn giản một số sự vật, hiện tượng, mối quan hệ trong tự nhiên và xã hội xung quanh một cách khoa học, logic và chính xác"
          },
          {
            "bieu_hien": "9. Phân tích được tình huống liên quan đến vấn đề an toàn, sức khỏe của bản thân, người khác và môi trường sống xung quanh (3.9)",
            "muc_1_1_diem": "Chưa thể phân tích được tình huống liên quan đến vấn đề an toàn, sức khỏe của bản thân, người khác và môi trường sống xung quanh",
            "muc_2_2_diem": "Phân tích tình huống liên quan đến vấn đề an toàn, sức khỏe của bản thân, người khác và môi trường sống xung quanh còn chưa thành thạo, còn gặp khó khăn",
            "muc_3_3_diem": "Phân tích tốt tình huống liên quan đến vấn đề an toàn, sức khỏe của bản thân, người khác và môi trường sống xung quanh"
          },
          {
            "bieu_hien": "10. Giải quyết được vấn đề, đưa ra được cách ứng xử phù hợp trong các tình huống có liên quan (ở mức độ đơn giản); trao đổi, chia sẻ với những người xung quanh để cùng thực hiện; nhận xét được cách ứng xử trong mỗi tình huống (3.10)",
            "muc_1_1_diem": "Không giải quyết được vấn đề và không thể đưa ra cách ứng xử phù hợp trong các tình huống có liên quan (ở mức độ đơn giản); trao đổi, chia sẻ với những người xung quanh để cùng thực hiện; nhận xét được cách ứng xử trong mỗi tình huống",
            "muc_2_2_diem": "Nhận thức được vấn đề nhưng chưa đưa ra được cách ứng xử phù hợp trong các tình huống có liên quan (ở mức độ đơn giản); trao đổi, chia sẻ với những người xung quanh để cùng thực hiện; nhận xét được cách ứng xử trong mỗi tình huống",
            "muc_3_3_diem": "Giải quyết tốt được vấn đề, đưa ra được cách ứng xử phù hợp trong các tình huống có liên quan (ở mức độ đơn giản); trao đổi, chia sẻ với những người xung quanh để cùng thực hiện; nhận xét được cách ứng xử trong mỗi tình huống"
          }
        ]
      }
    ]
  }
}

Dữ liệu đầu ra BẮT BUỘC phải là 1 object JSON hợp lệ, không bọc trong code block \`\`\`json.
Cấu trúc JSON:
{
  "studentName": "Tên học sinh (trống nếu không thấy)",
  "studentDob": "Ngày sinh (trống nếu không thấy)",
  "studentClass": "Lớp (trống nếu không thấy)",
  "score": Điểm số (kiểu số, thang điểm 10 - tổng hợp điểm từ các mức độ NL đạt được. Ví dụ: Tính trung bình các Mức 1,2,3 thành hệ cơ số 10),
  "evaluation": "Nội dung nhận xét bài làm bằng văn bản (có thể dùng Markdown). Dựa trên JSON tiêu chí đánh giá, hãy chỉ rõ bé đạt 'Mức 1, 2 hay 3' ở các tiêu chí/năng lực nào (ghi rõ tên tiêu chí trích từ JSON), phân tích đúng/sai, và đưa ra lời khuyên cụ thể.",
  "chatResponse": "Lời chào và tóm tắt ngắn gửi giáo viên. (Vd: Đây là bài làm của Nguyễn Văn A. Điểm số: 8. Bé thể hiện tốt Năng lực nhận thức khoa học ở Mức 3...)"
}

Lưu ý:
- Trích xuất thông tin cá nhân chính xác từ hình ảnh.
- Bám sát chặt chẽ JSON KHUNG TIÊU CHÍ VÀ NĂNG LỰC ĐÁNH GIÁ được cung cấp bên trên (Bảng 1.1, 2.1, 2.2).
- Đầu ra CHỈ gồm đối tượng JSON của bạn, không thêm bình luận nào khác.`;

    try {
      const imageParts = images.map(img => ({
        inlineData: {
          data: img.base64Data,
          mimeType: img.mimeType
        }
      }));

      const result = await model.generateContent([
        systemPrompt + "\n\nNội dung nhắc nhở thêm: " + prompt,
        ...imageParts
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
