export interface ParsedQuestion {
  text: string;
  correctAnswer: string;
}

/**
 * Parse questions from text input
 * Supports formats:
 * - "Câu 1: [question text]" or "1. [question text]"
 * - "Đáp án: A" or "Đáp án A"
 * - Multi-line questions
 */
export function parseQuestionsFromText(importText: string): ParsedQuestion[] {
  if (!importText || !importText.trim()) return [];
  
  const lines = importText.split('\n');
  const newQuestions: ParsedQuestion[] = [];
  
  let currentQ = '';
  let currentAns = '';
  
  for (const line of lines) {
    const txt = line.trim();
    if (!txt) continue;
    
    // Tìm đáp án (Ví dụ: "Đáp án: A", "Đáp án A")
    if (/^Đáp án:?\s*([A-D])/i.test(txt)) {
      const match = txt.match(/^Đáp án:?\s*([A-D])/i);
      if (match) {
        const answer = match[1].toUpperCase();
        // Validate answer is A, B, C, or D
        if (['A', 'B', 'C', 'D'].includes(answer)) {
          currentAns = answer;
        }
      }
    } 
    // Tìm phần đầu câu hỏi (Ví dụ: "Câu 1:", "1.")
    else if (/^Câu \d+:/i.test(txt) || /^[0-9]+\./.test(txt)) {
      // Save previous question if exists
      if (currentQ.trim()) {
        newQuestions.push({ 
          text: currentQ.trim(), 
          correctAnswer: currentAns 
        });
      }
      
      // Start new question
      currentQ = txt.replace(/^Câu \d+:\s*/i, '').replace(/^[0-9]+\.\s*/, '');
      currentAns = ''; // Reset answer
    } 
    // Tìm phần tử đáp án A. B. C. D. -> Bỏ qua không thiết lập vào correctAnswer
    else if (/^[A-D]\./i.test(txt)) {
      // Bỏ qua options text vì Plickers không yêu cầu nhúng trực tiếp option vào form UI câu hỏi
    } 
    // Nếu dòng thuần văn bản, gán làm fallback hoặc nối vào câu hỏi hiện tại
    else {
      if (!currentQ && newQuestions.length === 0) {
        // Fallback khi không có "Câu 1:" chuẩn mực ở đầu
        currentQ = txt;
      } else if (currentQ) {
        // Nối dài câu văn (multi-line support)
        currentQ += ' ' + txt;
      }
    }
  }
  
  // Nạp câu hỏi cuối cùng
  if (currentQ.trim()) {
    newQuestions.push({ 
      text: currentQ.trim(), 
      correctAnswer: currentAns 
    });
  }
  
  return newQuestions;
}
