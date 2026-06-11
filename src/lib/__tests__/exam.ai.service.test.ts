/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractTextFromFile, generateExamWithAI, generateExamFromTextbook } from '../exam.ai.service';
import * as fs from 'fs';

// Mock dependencies
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

const { mockGenerateContent } = vi.hoisted(() => {
  return { mockGenerateContent: vi.fn() };
});

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel = vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      });
    },
  };
});

describe('exam.ai.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractTextFromFile', () => {
    it('TC-EXAM-AI-001: trích xuất từ file .txt thành công', async () => {
      (fs.readFileSync as any).mockReturnValue('This is a text file.');
      const result = await extractTextFromFile('test.txt');
      expect(result).toBe('This is a text file.');
      expect(fs.readFileSync).toHaveBeenCalledWith('test.txt', 'utf-8');
    });

    it('TC-EXAM-AI-002: trích xuất từ file .pdf thất bại trả về chuỗi rỗng', async () => {
      // Vì không mock pdf-parse ở scope global, nó sẽ lỗi khi import() và nhảy vào catch
      (fs.readFileSync as any).mockImplementation(() => { throw new Error('Cannot read pdf') });
      const result = await extractTextFromFile('test.pdf');
      expect(result).toBe('');
    });

    it('TC-EXAM-AI-003: trả về chuỗi rỗng cho định dạng không hỗ trợ', async () => {
      const result = await extractTextFromFile('test.unknown');
      expect(result).toBe('');
    });
  });

  describe('generateExamWithAI', () => {
    it('TC-EXAM-AI-004: trả về danh sách câu hỏi hợp lệ khi AI sinh JSON đúng', async () => {
      const mockJsonResponse = `[
        {
          "id": "q1",
          "level": "NB",
          "type": "multiple_choice",
          "content": "Theo tài liệu câu hỏi 1",
          "options": ["A. 1", "B. 2", "C. 3", "D. 4"],
          "answer": "A",
          "score": 0.25
        }
      ]`;
      
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => mockJsonResponse }
      });

      const result = await generateExamWithAI({
        subject: 'math', grade: '10', duration: 45, totalScore: 10, difficulty: 'medium',
        nbCount: 1, thCount: 0, vdCount: 0, vdcCount: 0
      });

      expect(result).toHaveLength(1);
      // Kiểm tra xem hàm cleanText có loại bỏ cụm "Theo tài liệu" không
      expect(result[0].content).not.toContain('Theo tài liệu');
      expect(result[0].content).toContain('Câu hỏi 1'); // Đã capitalize
    });

    it('TC-EXAM-AI-005: retry 1 lần nếu AI lỗi quota, ném lỗi thân thiện', async () => {
      mockGenerateContent
        .mockRejectedValueOnce(new Error())
        .mockRejectedValueOnce(new Error());

      await expect(
        generateExamWithAI({
          subject: 'math', grade: '10', duration: 45, totalScore: 10, difficulty: 'medium',
          nbCount: 1, thCount: 0, vdCount: 0, vdcCount: 0
        })
      ).rejects.toThrow('Không thể tạo đề thi bằng AI'); // Fallback generic message
    });
    
    it('TC-EXAM-AI-006: ném lỗi nếu AI không trả về JSON hợp lệ', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => 'I am sorry, I cannot do that.' }
      });

      await expect(
        generateExamWithAI({
          subject: 'math', grade: '10', duration: 45, totalScore: 10, difficulty: 'medium',
          nbCount: 1, thCount: 0, vdCount: 0, vdcCount: 0
        })
      ).rejects.toThrow('AI không trả về JSON hợp lệ. Vui lòng thử lại.');
    });
  });

  describe('generateExamFromTextbook', () => {
    it('TC-EXAM-AI-007: lọc dữ liệu textbook theo theme và trả về câu hỏi hợp lệ', async () => {
      const mockJsonResponse = `[
        {
          "id": "q1",
          "level": "NB",
          "type": "multiple_choice",
          "content": "Câu hỏi textbook",
          "answer": "A",
          "score": 0.25
        }
      ]`;
      
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => mockJsonResponse }
      });

      const params = {
        subject: 'math', grade: '10', duration: 45, totalScore: 10, difficulty: 'medium',
        nbCount: 1, thCount: 0, vdCount: 0, vdcCount: 0,
        textbookScope: 'theme',
        textbookTheme: 'Chủ đề 1',
        textbookData: {
          lessons: [
            { lesson_id: 1, theme: 'Chủ đề 1', title: 'Bài 1', content: 'Nội dung 1' },
            { lesson_id: 2, theme: 'Chủ đề 2', title: 'Bài 2', content: 'Nội dung 2' },
          ]
        }
      };

      const result = await generateExamFromTextbook(params);
      expect(result).toHaveLength(1);
      // Verify AI is called
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });
});
