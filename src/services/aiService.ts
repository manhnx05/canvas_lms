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
    const prompt = `Bạn là một giáo viên chuyên nghiệp. Sinh ra chính xác ${numQuestions} câu hỏi bằng Tiếng Việt cho học sinh cấp ${gradeLevel} về chủ đề: "${topic}".
    LƯU Ý QUAN TRỌNG:
    - Các câu hỏi có thể thuộc các loại sau: 'multiple_choice', 'true_false', 'fill_blank', 'matching' (nối đáp án), 'drag_drop' (kéo thả). Hãy đa dạng các loại câu hỏi.
    - Đối với 'multiple_choice': Trong trường "text" của options, CHỈ GHI phần nội dung đáp án trơn (không ghi A., B., C.).
    - Đối với 'matching': Phải tạo danh sách matchingPairs với 'left' và 'right'.
    - Đối với 'drag_drop': Phải tạo dragDropText chứa các ô trống dạng [1], [2] và dragDropTokens là mảng các từ khóa tương ứng.`;

    const responseSchema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: "tạo uuid ngẫu nhiên" },
          type: { type: SchemaType.STRING, description: "multiple_choice, true_false, fill_blank, matching, hoặc drag_drop" },
          question: { type: SchemaType.STRING, description: "Nội dung câu hỏi hoặc yêu cầu" },
          options: {
            type: SchemaType.ARRAY,
            description: "Dùng cho multiple_choice, true_false",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING, description: "A, B, C, D" },
                text: { type: SchemaType.STRING }
              },
              required: ["id", "text"]
            }
          },
          correctOptionId: { type: SchemaType.STRING, description: "Dùng cho multiple_choice (A, B, C, D), true_false, fill_blank" },
          difficulty: { type: SchemaType.STRING, description: "easy, medium, hoặc hard" },
          explanation: { type: SchemaType.STRING, description: "giải thích ngắn tại sao đáp án đúng" },
          matchingPairs: {
            type: SchemaType.ARRAY,
            description: "Chỉ dùng cho loại matching",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                left: { type: SchemaType.STRING },
                right: { type: SchemaType.STRING }
              },
              required: ["left", "right"]
            }
          },
          dragDropText: { type: SchemaType.STRING, description: "Chỉ dùng cho drag_drop. VD: 'Trời [1] và có [2].'" },
          dragDropTokens: {
            type: SchemaType.ARRAY,
            description: "Chỉ dùng cho drag_drop. VD: ['nắng', 'mây']",
            items: { type: SchemaType.STRING }
          }
        },
        required: ["id", "type", "question", "difficulty", "explanation"]
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
      return "Đây là dữ liệu nhận xét mẫu do chưa cấu hình GEMINI_API_KEY.\n\n**1. Phần đã tốt**\n- Kiến thức: Học sinh làm rất tốt.\n- Năng lực: Tư duy logic khá.\n\n**2. Phần hạn chế**\n- Kiến thức: Cần ôn tập thêm.\n- Năng lực: Cần cẩn thận hơn.\n\n**3. Lời khuyên/ lời đề xuất cải thiện**\n- Hãy làm nhiều bài tập hơn nhé.";
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
      return "Chào bạn, đây là tin nhắn mẫu phản hồi từ AI (Do chưa cài đặt GEMINI_API_KEY). Chúc bạn học tập tốt! 🎓";
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
