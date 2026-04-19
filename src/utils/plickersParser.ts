export interface ParsedQuestion {
  text: string;
  correctAnswer: string;
}

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
      if (match) currentAns = match[1].toUpperCase();
    } 
    // Tìm phần đầu câu hỏi (Ví dụ: "Câu 1:", "1.")
    else if (/^Câu \d+:/i.test(txt) || /^[0-9]+\./.test(txt)) {
      if (currentQ) {
        newQuestions.push({ text: currentQ, correctAnswer: currentAns });
      }
      currentQ = txt.replace(/^Câu \d+:\s*/i, '').replace(/^[0-9]+\.\s*/, '');
      currentAns = ''; // Reset đáp án của dòng cũ
    } 
    // Tìm phần tử đáp án A. B. C. D. -> Bỏ qua không thiết lập vào correctAnswer (Tùy chọn hiển thị đề mộc)
    else if (/^[A-D]\./i.test(txt)) {
      // Bỏ qua options text vì Plickers không yêu cầu nhúng trực tiếp option vào form UI câu hỏi
    } 
    // Nếu dòng thuần văn bản, gán làm fallback cho câu hỏi
    else {
      if (!currentQ && newQuestions.length === 0) {
        currentQ = txt; // Fallback khi không có "Câu 1:" chuẩn mực ở đầu
      } else if (currentQ) {
        currentQ += "\n" + txt; // Nối dài câu văn
      }
    }
  }
  
  // Nạp câu hỏi cuối cùng
  if (currentQ) {
    newQuestions.push({ text: currentQ, correctAnswer: currentAns });
  }
  
  return newQuestions;
}
