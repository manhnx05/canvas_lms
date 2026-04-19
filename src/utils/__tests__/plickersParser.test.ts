/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { parseQuestionsFromText } from '../plickersParser';

describe('[UNIT] utils/plickersParser', () => {
  it('TC-PARSER-001: parse một câu hỏi hợp lệ với chuẩn "Câu X:" và "Đáp án: Y"', () => {
    const input = `
Câu 1: Lịch sử ra đời của Plickers?
A. 2010
B. 2011
C. 2012
Đáp án: A
`;
    const result = parseQuestionsFromText(input);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Lịch sử ra đời của Plickers?');
    expect(result[0].correctAnswer).toBe('A');
  });

  it('TC-PARSER-002: parse văn bản rỗng, null hoặc undefined', () => {
    expect(parseQuestionsFromText('')).toEqual([]);
    expect(parseQuestionsFromText('   ')).toEqual([]);
    expect(parseQuestionsFromText(null as any)).toEqual([]);
  });

  it('TC-PARSER-003: parse văn bản hỗn hợp nhiều câu, loại bỏ tiền tố số', () => {
    const input = `
1. 1 + 1 bằng mấy?
A. 2
B. 3
Đáp án: A

Câu 2: Hình tam giác có bao nhiêu cạnh?
A. 3
B. 4
C. 5
Đáp án: A
`;
    const result = parseQuestionsFromText(input);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('1 + 1 bằng mấy?');
    expect(result[0].correctAnswer).toBe('A');
    expect(result[1].text).toBe('Hình tam giác có bao nhiêu cạnh?');
    expect(result[1].correctAnswer).toBe('A');
  });

  it('TC-PARSER-004: fallback gộp chữ nếu dòng đầu tiên không có "Câu 1:"', () => {
    const input = `
Đây là câu hỏi đặc biệt
không có tiền tố "Câu X" ở đầu
Đáp án B
`;
    const result = parseQuestionsFromText(input);
    expect(result).toHaveLength(1);
    expect(result[0].text).toContain('Đây là câu hỏi đặc biệt');
    expect(result[0].text).toContain('không có tiền tố "Câu X" ở đầu');
    expect(result[0].correctAnswer).toBe('B');
  });
});
