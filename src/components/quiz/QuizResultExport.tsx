import React from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import type { QuizResult, QuizQuestion } from './QuizSystem';
import toast from 'react-hot-toast';

interface QuizResultExportProps {
  result: QuizResult;
  questions: QuizQuestion[];
  topic: string;
  studentName: string;
  elementIdToPrint: string;
}

export function QuizResultExport({ result, questions, topic, studentName, elementIdToPrint }: QuizResultExportProps) {
  
  const handleExportPDF = async () => {
    const el = document.getElementById(elementIdToPrint);
    if (!el) {
      toast.error('Không tìm thấy nội dung để xuất PDF');
      return;
    }
    try {
      const toastId = toast.loading('Đang tạo file PDF...');
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Ket_Qua_Quiz_${studentName}_${topic || 'N/A'}.pdf`);
      toast.success('Xuất PDF thành công!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi tạo PDF');
    }
  };

  const handleExportExcel = () => {
    try {
      // Create worksheet data
      const wsData = [
        ['BÁO CÁO KẾT QUẢ BÀI KIỂM TRA'],
        [],
        ['Học sinh:', studentName],
        ['Chủ đề:', topic || 'Không xác định'],
        ['Điểm số:', `${result.score}/${result.total}`],
        ['Tỷ lệ phần trăm:', `${result.percentage}%`],
        ['Thời gian làm bài:', `${result.timeTaken} giây`],
        [],
        ['CHI TIẾT CÂU HỎI'],
        ['STT', 'Câu hỏi', 'Đáp án đúng', 'Học sinh chọn', 'Kết quả'],
      ];

      questions.forEach((q, idx) => {
        const studentAns = result.answers[q.id];
        const isFillBlank = q.type === 'fill_blank';
        let studentAnsText = studentAns || '(chưa trả lời)';
        let correctAnsText = q.correctOptionId;

        if (!isFillBlank) {
           const sOpt = q.options.find(o => o.id === studentAns);
           if (sOpt) studentAnsText = sOpt.text;
           const cOpt = q.options.find(o => o.id === q.correctOptionId);
           if (cOpt) correctAnsText = cOpt.text;
        }

        const isCorrect = isFillBlank 
           ? (studentAns || '').trim().toLowerCase() === (q.correctOptionId || '').trim().toLowerCase() 
           : studentAns === q.correctOptionId;

        wsData.push([
          (idx + 1).toString(),
          q.question,
          correctAnsText,
          studentAnsText,
          isCorrect ? 'Đúng' : 'Sai'
        ]);
      });

      if (result.aiFeedback) {
        wsData.push([]);
        wsData.push(['NHẬN XÉT CỦA AI GIÁO VIÊN']);
        // simple text clean up
        const cleanFeedback = result.aiFeedback.replace(/\*\*/g, '');
        wsData.push([cleanFeedback]);
      }

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Auto size cols somewhat
      ws['!cols'] = [
        { wch: 5 },  // STT
        { wch: 40 }, // Câu hỏi
        { wch: 20 }, // Đáp án đúng
        { wch: 20 }, // HS chọn
        { wch: 10 }, // Kết quả
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ket_Qua');
      XLSX.writeFile(wb, `Ket_Qua_Quiz_${studentName}_${topic || 'NA'}.xlsx`);
      toast.success('Xuất Excel thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi tạo Excel');
    }
  };

  return (
    <div className="flex gap-2 w-full mt-2">
      <button 
        onClick={handleExportPDF}
        className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-700 font-bold rounded-2xl hover:bg-red-100 transition-colors border border-red-200"
      >
        <FileText className="w-4 h-4" /> Xuất PDF
      </button>
      <button 
        onClick={handleExportExcel}
        className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 font-bold rounded-2xl hover:bg-green-100 transition-colors border border-green-200"
      >
        <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
      </button>
    </div>
  );
}
