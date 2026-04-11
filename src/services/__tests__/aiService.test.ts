/**
 * @vitest-environment node
 *
 * UNIT TESTS — aiService
 * Coverage: generateQuiz (input sanitization, error handling),
 *           evaluateSubmission (API call), chat (validation)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Gemini model
const mockGenerateContent = vi.fn();
vi.mock('@/src/lib/gemini', () => ({
  getGeminiModel: () => ({ generateContent: mockGenerateContent }),
}));

import { aiService } from '../aiService';

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — aiService.generateQuiz — sanitization logic
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] aiService.generateQuiz — sanitization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'fake-key-for-test';
  });

  it('TC-AI-001: loại bỏ prefix "A. " khỏi options dạng chuỗi', async () => {
    const rawQuestions = JSON.stringify([
      {
        id: 'q1',
        question: 'Thủ đô của Việt Nam?',
        options: ['A. Hà Nội', 'B. TP.HCM', 'C. Đà Nẵng', 'D. Huế'],
        correctOptionId: 'A',
      },
    ]);
    mockGenerateContent.mockResolvedValue({ response: { text: () => rawQuestions } });

    const result = await aiService.generateQuiz({ topic: 'Địa lý', numQuestions: 1 });
    expect(result[0].options[0]).toBe('Hà Nội');
    expect(result[0].options[1]).toBe('TP.HCM');
  });

  it('TC-AI-002: loại bỏ prefix "B) " khỏi options dạng object {id, text}', async () => {
    const rawQuestions = JSON.stringify([
      {
        id: 'q1',
        question: 'Câu hỏi?',
        options: [
          { id: 'A', text: 'A. Đáp án A' },
          { id: 'B', text: 'B) Đáp án B' },
        ],
        correctOptionId: 'A',
      },
    ]);
    mockGenerateContent.mockResolvedValue({ response: { text: () => rawQuestions } });

    const result = await aiService.generateQuiz({ topic: 'test' });
    expect(result[0].options[0].text).toBe('Đáp án A');
    expect(result[0].options[1].text).toBe('Đáp án B');
  });

  it('TC-AI-003: xử lý response bọc trong ```json...```', async () => {
    const wrapped = '```json\n[{"id":"q1","question":"?","options":[],"correctOptionId":"A"}]\n```';
    mockGenerateContent.mockResolvedValue({ response: { text: () => wrapped } });

    const result = await aiService.generateQuiz({ topic: 'test' });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].id).toBe('q1');
  });

  it('TC-AI-004: ném HttpError 500 nếu AI trả về JSON không hợp lệ', async () => {
    mockGenerateContent.mockResolvedValue({ response: { text: () => 'not json!!!' } });

    await expect(aiService.generateQuiz({ topic: 'test' })).rejects.toMatchObject({
      status: 500,
    });
  });

  it('TC-AI-005: ném HttpError 500 nếu thiếu GEMINI_API_KEY', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(aiService.generateQuiz({ topic: 'x' })).rejects.toMatchObject({ status: 500 });
    process.env.GEMINI_API_KEY = 'fake-key-for-test';
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — aiService.evaluateSubmission
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] aiService.evaluateSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'fake-key';
  });

  it('TC-AI-006: trả về chuỗi nhận xét từ AI', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => '**1. Phần đã tốt**\n- Kiến thức: Tốt' },
    });

    const result = await aiService.evaluateSubmission({
      questions: [],
      answers: {},
      studentName: 'An',
      assignmentTitle: 'Bài 1',
    });
    expect(typeof result).toBe('string');
    expect(result).toContain('Phần đã tốt');
  });

  it('TC-AI-007: ném HttpError 500 nếu GEMINI_API_KEY không tồn tại', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(
      aiService.evaluateSubmission({ questions: [], answers: {} })
    ).rejects.toMatchObject({ status: 500 });
    process.env.GEMINI_API_KEY = 'fake-key';
  });

  it('TC-AI-008: ném HttpError 500 nếu Gemini API throw', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API quota exceeded'));
    await expect(
      aiService.evaluateSubmission({ questions: [], answers: {}, studentName: 'B' })
    ).rejects.toMatchObject({ status: 500 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — aiService.chat
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] aiService.chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'fake-key';
  });

  it('TC-AI-009: ném HttpError 400 khi message rỗng', async () => {
    await expect(aiService.chat({ message: '' })).rejects.toMatchObject({ status: 400 });
  });

  it('TC-AI-010: ném HttpError 400 khi message chỉ có khoảng trắng', async () => {
    await expect(aiService.chat({ message: '   ' })).rejects.toMatchObject({ status: 400 });
  });

  it('TC-AI-011: ném HttpError 500 nếu thiếu GEMINI_API_KEY', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(aiService.chat({ message: 'Hello?' })).rejects.toMatchObject({ status: 500 });
    process.env.GEMINI_API_KEY = 'fake-key';
  });

  it('TC-AI-012: trả về response hợp lệ từ Gemini', async () => {
    mockGenerateContent.mockResolvedValue({ response: { text: () => 'Chào bạn! 👋' } });
    const result = await aiService.chat({ message: 'Xin chào', studentName: 'An' });
    expect(result).toContain('Chào');
  });
});
