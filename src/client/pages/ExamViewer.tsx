import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Download, Printer, ArrowLeft, DownloadCloud } from 'lucide-react';
import { LatexRenderer } from '../components/LatexRenderer';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import { saveAs } from 'file-saver';

export const ExamViewer: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewAnswers, setViewAnswers] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await fetch(`/api/exams/${id}`);
        const data = await res.json();
        setExam(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    try {
      // Tự động tải fonts vào HTML2Canvas qua scale lớn để nét
      const canvas = await html2canvas(printRef.current, { 
        scale: 2, 
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${exam.title}.pdf`);
    } catch (error) {
      console.error('Lỗi xuất PDF', error);
      alert('Không thể xuất PDF. Vui lòng sử dụng tính năng in của trình duyệt.');
    }
  };

  const handleDownloadWord = async () => {
    if (!exam) return;
    try {
      const children = [
        new Paragraph({
          children: [
            new TextRun({ text: exam.title, bold: true, size: 32 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Môn: ${exam.subject} - Lớp: ${exam.grade} - Thời gian: ${exam.duration} phút`, italics: true, size: 24 }),
          ],
        }),
      ];

      exam.questions.forEach((q: any, i: number) => {
        children.push(new Paragraph({ text: '' })); // spacer
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Câu ${i + 1} (${q.score}đ): `, bold: true }),
              // Word format không native hỗ trợ Latex string ra công thức trực tiếp mà cần MathML
              // Ở đây export thô string text kèm LaTeX markup
              new TextRun({ text: q.content }), 
            ]
          })
        );
        if (q.options) {
          q.options.forEach((opt: string) => {
             children.push(new Paragraph({ children: [new TextRun({ text: `    ${opt}` })] }));
          });
        }
        
        if (viewAnswers) {
          children.push(new Paragraph({ children: [new TextRun({ text: `Đáp án: ${q.answer}`, bold: true })] }));
          if (q.explanation) {
             children.push(new Paragraph({ children: [new TextRun({ text: `Giải thích: ${q.explanation}`, italics: true })] }));
          }
        }
      });

      const doc = new Document({ sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${exam.title}.docx`);
    } catch (err) {
      console.error('Lỗi tạo file Word', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải đề thi...</div>;
  if (!exam) return <div className="p-8 text-center text-red-500">Không tìm thấy đề thi.</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 print:p-0 print:max-w-none">
      
      {/* Action Bar (Not visible in print) */}
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200 print:hidden">
        <button onClick={() => navigate('/exams')} className="flex items-center text-gray-500 hover:text-gray-800 transition">
          <ArrowLeft size={20} className="mr-2" /> Quay lại
        </button>

        <div className="flex items-center gap-4">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button 
              onClick={() => setViewAnswers(false)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${!viewAnswers ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Xem đề bài
            </button>
            <button 
              onClick={() => setViewAnswers(true)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewAnswers ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Kèm đáp án
            </button>
          </div>
          
          <button onClick={handleDownloadWord} className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
            <DownloadCloud size={18} /> Word
          </button>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition">
            <Download size={18} /> PDF
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition">
            <Printer size={18} /> In
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div ref={printRef} className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0">
        
        {/* Header Đề thi */}
        <div className="text-center mb-10 pb-6 border-b-2 border-gray-800">
          <h1 className="text-3xl font-bold uppercase mb-4 text-gray-900">{exam.title}</h1>
          <div className="flex justify-center gap-8 text-gray-700 font-medium text-lg">
            <span>Môn: {exam.subject.toUpperCase()}</span>
            <span>Lớp: {exam.grade}</span>
            <span>Thời gian: {exam.duration} phút</span>
          </div>
        </div>

        {/* Danh sách câu hỏi */}
        <div className="space-y-8 print:text-sm">
          {exam.questions.map((q: any, idx: number) => (
            <div key={idx} className="break-inside-avoid text-gray-900">
              <div className="flex gap-2 font-medium mb-3">
                <span className="whitespace-nowrap font-bold">Câu {idx + 1}:</span>
                <div className="flex-1"><LatexRenderer content={q.content} /></div>
              </div>

              {q.options && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 pl-12 mt-4 text-gray-800">
                  {q.options.map((opt: string, oIdx: number) => {
                    const isCorrect = viewAnswers && q.answer === String.fromCharCode(65 + oIdx);
                    return (
                      <div key={oIdx} className={`flex gap-2 ${isCorrect ? 'text-green-700 font-bold bg-green-50 px-2 py-1 rounded' : ''}`}>
                         <LatexRenderer content={opt} />
                      </div>
                    );
                  })}
                </div>
              )}

              {viewAnswers && q.explanation && (
                <div className="mt-4 pl-12 text-gray-600 italic border-l-2 border-indigo-200 ml-2 py-1">
                  <strong>HD:</strong> <LatexRenderer content={q.explanation} />
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
