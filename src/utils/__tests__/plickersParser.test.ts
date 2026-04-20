import { describe, it, expect } from 'vitest';
import { parseQuestionsFromText } from '../plickersParser';

/**
 * @vitest-environment node
 */

describe('plickersParser', () => {
  describe('TC-PARSER-001: Parse basic question format', () => {
    it('should parse question with "Câu X:" format', () => {
      const input = `Câu 1: Trái đất quay quanh mặt trời?
Đáp án: A`;
      
      const result = parseQuestionsFromText(input);
      
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Trái đất quay quanh mặt trời?');
      expect(result[0].correctAnswer).toBe('A');
    });
  });

  describe('TC-PARSER-002: Parse numbered question format', () => {
    it('should parse question with "X." format', () => {
      const input = `1. Nước sôi ở nhiệt độ bao nhiêu?
Đáp án: B`;
      
      const result = parseQuestionsFromText(input);
      
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Nước sôi ở nhiệt độ bao nhiêu?');
      expect(result[0].correctAnswer).toBe('B');
    });
  });

  describe('TC-PARSER-003: Parse multiple questions', () => {
    it('should parse multiple questions correctly', () => {
      const input = `Câu 1: Câu hỏi đầu tiên
Đáp án: A

Câu 2: Câu hỏi thứ hai
Đáp án: B

Câu 3: Câu hỏi thứ ba
Đáp án: C`;
      
      const result = parseQuestionsFromText(input);
      
      expect(result).toHaveLength(3);
      expect(result[0].correctAnswer).toBe('A');
      expect(result[1].correctAnswer).toBe('B');
      expect(result[2].correctAnswer).toBe('C');
    });
  });

  describe('TC-PARSER-004: Parse multi-line questions', () => {
    it('should handle multi-line question text', () => {
      const input = `Câu 1: Đây là câu hỏi dài
có nhiều dòng
và tiếp tục ở đây
Đáp án: D`;
      
      const result = parseQuestionsFromText(input);
      
      expect(result).toHaveLength(1);
      expect(result[0].text).toContain('Đây là câu hỏi dài');
      expect(result[0].text).toContain('có nhiều dòng');
      expect(result[0].text).toContain('và tiếp tục ở đây');
      expect(result[0].correctAnswer).toBe('D');
    });
  });

  describe('TC-PARSER-005: Parse answer with colon', () => {
    it('should parse "Đáp án: X" format', () => {
      const input = `Câu 1: Test question
Đáp án: C`;
      
      const result = parseQuestionsFromText(input);
      
      expect(result[0].correctAnswer).toBe('C');
    });
  });

  describe('TC-PARSER-006: Parse answer without colon', () => {
    it('should parse "Đáp án X" format', () => {
      const input = `Câu 1: Test question
Đáp án D`;
      
      const result = parseQuestionsFromText(input);
      
      expect(result[0].correctAnswer).toBe('D');
    });
  });

  describe('TC-PARSER-007: Ignore option lines', () => {
    it('should ignore A. B. C. D. option lines', () => {
      const input = `Câu 1: Câu hỏi có đáp án
A. Đáp án A
B. Đáp án B
C. Đáp án C
D. Đáp án D
Đáp án: B`;
      
      const result = parseQuestionsFromText(input);
      
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Câu hỏi có đáp án');
      expect(result[0].correctAnswer).toBe('B');
    });
  });

  describe('TC-PARSER-008: Handle empty input', () => {
    it('should return empty array for empty string', () => {
      const result = parseQuestionsFromText('');
      expect(result).toHaveLength(0);
    });

    it('should return empty array for whitespace only', () => {
      const result = parseQuestionsFromText('   \n  \n  ');
      expect(result).toHaveLength(0);
    });
  });

  describe('TC-PARSER-009: Validate answer format', () => {
    it('should only accept A, B, C, D as valid answers', () => {
      const input = `Câu 1: Question 1
Đáp án: A

Câu 2: Question 2
Đáp án: E

Câu 3: Question 3
Đáp án: C`;
      
      const result = parseQuestionsFromText(input);
      
      expect(result).toHaveLength(3);
      expect(result[0].correctAnswer).toBe('A');
      expect(result[1].correctAnswer).toBe(''); // Invalid answer E should be empty
      expect(result[2].correctAnswer).toBe('C');
    });
  });

  describe('TC-PARSER-010: Handle case insensitive answers', () => {
    it('should convert lowercase answers to uppercase', () => {
      const input = `Câu 1: Test
Đáp án: a

Câu 2: Test 2
Đáp án: b`;
      
      const result = parseQuestionsFromText(input);
      
      expect(result[0].correctAnswer).toBe('A');
      expect(result[1].correctAnswer).toBe('B');
    });
  });

  describe('TC-PARSER-011: Handle mixed formats', () => {
    it('should parse mixed "Câu X:" and "X." formats', () => {
      const input = `Câu 1: First question
Đáp án: A

2. Second question
Đáp án: B

Câu 3: Third question
Đáp án: C`;
      
      const result = parseQuestionsFromText(input);
      
      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('First question');
      expect(result[1].text).toBe('Second question');
      expect(result[2].text).toBe('Third question');
    });
  });

  describe('TC-PARSER-012: Handle question without answer', () => {
    it('should parse question even if answer is missing', () => {
      const input = `Câu 1: Question without answer

Câu 2: Question with answer
Đáp án: B`;
      
      const result = parseQuestionsFromText(input);
      
      expect(result).toHaveLength(2);
      expect(result[0].correctAnswer).toBe('');
      expect(result[1].correctAnswer).toBe('B');
    });
  });

  describe('TC-PARSER-013: Handle extra whitespace', () => {
    it('should trim extra whitespace from questions and answers', () => {
      const input = `Câu 1:    Question with spaces    
Đáp án:   A   `;
      
      const result = parseQuestionsFromText(input);
      
      expect(result[0].text).toBe('Question with spaces');
      expect(result[0].correctAnswer).toBe('A');
    });
  });

  describe('TC-PARSER-014: Handle fallback for non-standard format', () => {
    it('should handle text without standard question prefix', () => {
      const input = `This is a question without prefix
Đáp án: A`;
      
      const result = parseQuestionsFromText(input);
      
      expect(result).toHaveLength(1);
      expect(result[0].text).toContain('This is a question without prefix');
      expect(result[0].correctAnswer).toBe('A');
    });
  });

  describe('TC-PARSER-015: Real-world example', () => {
    it('should parse a complete realistic quiz', () => {
      const input = `Câu 1: Hà Nội là thủ đô của nước nào?
A. Việt Nam
B. Thái Lan
C. Lào
D. Campuchia
Đáp án: A

Câu 2: Số nguyên tố nhỏ nhất là số nào?
A. 0
B. 1
C. 2
D. 3
Đáp án: C

3. Mặt trời mọc ở hướng nào?
Đáp án: A`;
      
      const result = parseQuestionsFromText(input);
      
      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('Hà Nội là thủ đô của nước nào?');
      expect(result[0].correctAnswer).toBe('A');
      expect(result[1].text).toBe('Số nguyên tố nhỏ nhất là số nào?');
      expect(result[1].correctAnswer).toBe('C');
      expect(result[2].text).toBe('Mặt trời mọc ở hướng nào?');
      expect(result[2].correctAnswer).toBe('A');
    });
  });
});
