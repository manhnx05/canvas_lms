/**
 * @vitest-environment node
 *
 * UNIT TESTS — aiGradingService
 * Coverage: analyzeWorksheet, chatWithContext
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Gemini model
const mockGenerateContent = vi.fn();
const mockStartChat = vi.fn();
const mockSendMessage = vi.fn();

vi.mock('@/src/lib/gemini', () => ({
  getGeminiModel: vi.fn(() => ({
    generateContent: mockGenerateContent,
    startChat: mockStartChat,
  })),
}));

vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(() => JSON.stringify({
      khung_nang_luc: 'Mock competency framework data'
    })),
  },
}));

vi.mock('path', () => ({
  default: {
    join: vi.fn((...args) => args.join('/')),
  },
}));

import { aiGradingService } from '../aiGradingService';

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — analyzeWorksheet
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] aiGradingService.analyzeWorksheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  it('TC-AI-GRADE-001: phân tích worksheet thành công với 1 ảnh', async () => {
    const mockResponse = {
      studentName: 'Nguyễn Văn A',
      studentDob: '01/01/2015',
      studentClass: '3A',
      score: 8.5,
      evaluation: '**Phần đã tốt**: Bé làm tốt...',
      chatResponse: 'Bài làm của bé đạt 8.5 điểm',
      competencies: [
        { id: '1.1', name: 'Nhận biết', level: 3, justification: 'Đạt tốt' }
      ]
    };

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockResponse),
        promptFeedback: null,
      },
    });

    const result = await aiGradingService.analyzeWorksheet(
      [{ base64Data: 'base64string', mimeType: 'image/jpeg' }],
      'Phân tích bài tập'
    );

    expect(result.studentName).toBe('Nguyễn Văn A');
    expect(result.score).toBe(8.5);
    expect(result.competencies).toHaveLength(1);
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it('TC-AI-GRADE-002: phân tích worksheet với nhiều ảnh', async () => {
    const mockResponse = {
      studentName: 'Trần B',
      score: 9.0,
      evaluation: 'Tốt',
      chatResponse: 'Điểm 9',
      competencies: []
    };

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockResponse),
        promptFeedback: null,
      },
    });

    const result = await aiGradingService.analyzeWorksheet(
      [
        { base64Data: 'img1', mimeType: 'image/jpeg' },
        { base64Data: 'img2', mimeType: 'image/png' },
      ],
      'Phân tích 2 ảnh'
    );

    expect(result.studentName).toBe('Trần B');
    expect(result.score).toBe(9.0);
  });

  it('TC-AI-GRADE-003: xử lý response có markdown code block', async () => {
    const mockData = { studentName: 'Test', score: 7, evaluation: 'OK', chatResponse: 'OK', competencies: [] };
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => '```json\n' + JSON.stringify(mockData) + '\n```',
        promptFeedback: null,
      },
    });

    const result = await aiGradingService.analyzeWorksheet(
      [{ base64Data: 'test', mimeType: 'image/jpeg' }]
    );

    expect(result.studentName).toBe('Test');
  });

  it('TC-AI-GRADE-004: ném HttpError 500 khi thiếu GEMINI_API_KEY', async () => {
    delete process.env.GEMINI_API_KEY;

    await expect(
      aiGradingService.analyzeWorksheet([{ base64Data: 'test', mimeType: 'image/jpeg' }])
    ).rejects.toMatchObject({
      status: 500,
      message: 'Hệ thống chưa cấu hình GEMINI_API_KEY',
    });
  });

  it('TC-AI-GRADE-005: ném HttpError 400 khi ảnh bị chặn bởi safety filter', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    mockGenerateContent.mockResolvedValue({
      response: {
        promptFeedback: { blockReason: 'SAFETY' },
      },
    });

    await expect(
      aiGradingService.analyzeWorksheet([{ base64Data: 'unsafe', mimeType: 'image/jpeg' }])
    ).rejects.toMatchObject({
      status: 400,
      message: 'Ảnh bị từ chối do vi phạm chính sách an toàn của AI.',
    });
  });

  it('TC-AI-GRADE-006: ném HttpError 500 khi AI trả về JSON không hợp lệ', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => 'Invalid JSON {{{',
        promptFeedback: null,
      },
    });

    await expect(
      aiGradingService.analyzeWorksheet([{ base64Data: 'test', mimeType: 'image/jpeg' }])
    ).rejects.toMatchObject({
      status: 500,
    });
  });

  it('TC-AI-GRADE-007: fallback sang model khác khi model đầu tiên fail', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    
    // Model đầu tiên fail với 404
    mockGenerateContent
      .mockRejectedValueOnce(new Error('404 not found'))
      .mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify({ studentName: 'Fallback', score: 8, evaluation: 'OK', chatResponse: 'OK', competencies: [] }),
          promptFeedback: null,
        },
      });

    const result = await aiGradingService.analyzeWorksheet(
      [{ base64Data: 'test', mimeType: 'image/jpeg' }]
    );

    expect(result.studentName).toBe('Fallback');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('TC-AI-GRADE-008: ném HttpError 429 khi tất cả models đều fail', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    mockGenerateContent.mockRejectedValue(new Error('503 service unavailable'));

    await expect(
      aiGradingService.analyzeWorksheet([{ base64Data: 'test', mimeType: 'image/jpeg' }])
    ).rejects.toMatchObject({
      status: 429,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — chatWithContext
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] aiGradingService.chatWithContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  it('TC-AI-GRADE-009: chat thành công với history', async () => {
    mockSendMessage.mockResolvedValue({
      response: {
        text: () => 'Đây là câu trả lời từ AI',
      },
    });

    mockStartChat.mockReturnValue({
      sendMessage: mockSendMessage,
    });

    const history = [
      { role: 'user', content: 'Xin chào' },
      { role: 'model', content: 'Chào bạn' },
    ];

    const result = await aiGradingService.chatWithContext(history, 'Bạn khỏe không?');
    expect(result).toBe('Đây là câu trả lời từ AI');
    expect(mockStartChat).toHaveBeenCalledWith({
      history: [
        { role: 'user', parts: [{ text: 'Xin chào' }] },
        { role: 'model', parts: [{ text: 'Chào bạn' }] },
      ],
    });
  });

  it('TC-AI-GRADE-010: ném HttpError 500 khi thiếu GEMINI_API_KEY', async () => {
    delete process.env.GEMINI_API_KEY;

    await expect(
      aiGradingService.chatWithContext([], 'Test')
    ).rejects.toMatchObject({
      status: 500,
      message: 'Hệ thống chưa cấu hình GEMINI_API_KEY',
    });
  });

  it('TC-AI-GRADE-011: chat với history rỗng', async () => {
    mockSendMessage.mockResolvedValue({
      response: {
        text: () => 'Câu trả lời đầu tiên',
      },
    });

    mockStartChat.mockReturnValue({
      sendMessage: mockSendMessage,
    });

    const result = await aiGradingService.chatWithContext([], 'Câu hỏi đầu tiên');
    expect(result).toBe('Câu trả lời đầu tiên');
    expect(mockStartChat).toHaveBeenCalledWith({ history: [] });
  });

  it('TC-AI-GRADE-012: fallback sang model khác khi chat fail', async () => {
    process.env.GEMINI_API_KEY = 'test-key';

    mockStartChat
      .mockReturnValueOnce({
        sendMessage: vi.fn().mockRejectedValue(new Error('429 quota exceeded')),
      })
      .mockReturnValueOnce({
        sendMessage: vi.fn().mockResolvedValue({
          response: { text: () => 'Fallback response' },
        }),
      });

    const result = await aiGradingService.chatWithContext([], 'Test message');
    expect(result).toBe('Fallback response');
  });

  it('TC-AI-GRADE-013: ném HttpError 429 khi tất cả chat models fail', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    mockStartChat.mockReturnValue({
      sendMessage: vi.fn().mockRejectedValue(new Error('503 service unavailable')),
    });

    await expect(
      aiGradingService.chatWithContext([], 'Test')
    ).rejects.toMatchObject({
      status: 429,
    });
  });
});
