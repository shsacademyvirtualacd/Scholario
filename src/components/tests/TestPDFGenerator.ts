import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { MCQQuestion } from '../../types/selfTest';
import type { StoredShortQuestion, StoredLongQuestion } from '../../types/questionBank';
import { shsLogoBase64 } from '../../lib/logoBase64';

interface GeneratePDFParams {
  board: string;
  grade: string;
  subject: string;
  mcqs: MCQQuestion[];
  shortQuestions: StoredShortQuestion[];
  longQuestions: StoredLongQuestion[];
  testType: 1 | 2 | 3;
}

export const generateTestPDF = async (params: GeneratePDFParams): Promise<boolean> => {
  try {
    const { board, grade, subject, mcqs, shortQuestions, longQuestions, testType } = params;

    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;

    let cursorY = margin;

    // --- Header ---
    try {
      doc.addImage(shsLogoBase64, 'JPEG', pageWidth / 2 - 40, margin - 10, 80, 80);
      cursorY += 80;
    } catch (e) {
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('SHS ACADEMY', pageWidth / 2, cursorY, { align: 'center' });
      cursorY += 25;
    }

    doc.setFontSize(14);
    doc.text(`Grade ${grade} - ${subject.toUpperCase()} (${board.toUpperCase()})`, pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 30;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Name: _______________________   Roll No: _______   Date: _______', margin, cursorY);
    cursorY += 15;

    // Total Marks
    const mcqMarks = mcqs.length * 1;
    const shortMarks = shortQuestions.reduce((sum, q) => sum + q.marks, 0);
    const longMarks = longQuestions.reduce((sum, q) => sum + q.marks, 0);
    const totalMarks = mcqMarks + shortMarks + longMarks;

    doc.text(`Total Marks: ${totalMarks}`, pageWidth - margin - 80, cursorY - 15);

    doc.setLineWidth(1);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 25;

    // --- Watermark Function ---
    const addWatermark = () => {
      // Save current graphics state
      doc.saveGraphicsState();
      doc.setGState(new (doc.GState as any)({opacity: 0.1}));

      try {
        // Render logo as watermark in center
        const wmWidth = 400;
        const wmHeight = 400;
        doc.addImage(shsLogoBase64, 'JPEG', (pageWidth - wmWidth) / 2, (pageHeight - wmHeight) / 2, wmWidth, wmHeight);
      } catch (e) {
        // Fallback text watermark
        doc.setTextColor(230, 230, 230);
        doc.setFontSize(60);
        doc.setFont('helvetica', 'bold');
        doc.text('SHS ACADEMY', pageWidth / 2, pageHeight / 2, {
          align: 'center',
          angle: 45
        });
      }

      doc.restoreGraphicsState();
      doc.setTextColor(0, 0, 0); // Reset color
    };

    addWatermark();

    // Helper for pagination
    const checkPageBreak = (neededHeight: number) => {
      if (cursorY + neededHeight > pageHeight - margin) {
        doc.addPage();
        addWatermark();
        cursorY = margin;
        return true;
      }
      return false;
    };

    // --- SECTION A: MCQs ---
    if (mcqs.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`SECTION A: Multiple Choice Questions (Marks: ${mcqMarks})`, margin, cursorY);
      cursorY += 20;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      mcqs.forEach((q, idx) => {
        // Estimate height: Question (multi-line) + 4 options
        const splitQ = doc.splitTextToSize(`Q${idx + 1}. ${q.question}`, pageWidth - 2 * margin);
        const qHeight = splitQ.length * 14;
        const optionsHeight = 4 * 14;

        checkPageBreak(qHeight + optionsHeight + 20);

        doc.text(splitQ, margin, cursorY);
        cursorY += qHeight + 5;

        const options = [`A) ${q.options.A}`, `B) ${q.options.B}`, `C) ${q.options.C}`, `D) ${q.options.D}`];

        // Print options in 2 columns if short, or 1 column if long
        let maxOptLen = Math.max(...options.map(o => o.length));
        if (maxOptLen < 40) {
          // 2 columns
          doc.text(options[0], margin + 15, cursorY);
          doc.text(options[1], pageWidth / 2, cursorY);
          cursorY += 16;
          doc.text(options[2], margin + 15, cursorY);
          doc.text(options[3], pageWidth / 2, cursorY);
          cursorY += 20;
        } else {
          // 1 column
          options.forEach(opt => {
            const splitOpt = doc.splitTextToSize(opt, pageWidth - 2 * margin - 15);
            doc.text(splitOpt, margin + 15, cursorY);
            cursorY += splitOpt.length * 14 + 2;
          });
          cursorY += 10;
        }
      });
    }

    // --- SECTION B: Short Questions ---
    if (testType >= 2 && shortQuestions.length > 0) {
      checkPageBreak(60); // Ensure space for header
      cursorY += 10;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`SECTION B: Short Questions (Marks: ${shortMarks})`, margin, cursorY);
      cursorY += 20;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      shortQuestions.forEach((q, idx) => {
        const qText = `Q${idx + 1}. ${q.question}`;
        const splitQ = doc.splitTextToSize(qText, pageWidth - 2 * margin - 30);
        const marksText = `[${q.marks}]`;

        // Give ~100pt space for short answers
        const answerSpace = 100;
        const needed = splitQ.length * 14 + answerSpace + 20;

        checkPageBreak(needed);

        doc.setFont('helvetica', 'bold');
        doc.text(splitQ, margin, cursorY);
        doc.text(marksText, pageWidth - margin - 20, cursorY);
        doc.setFont('helvetica', 'normal');

        cursorY += splitQ.length * 14 + 10;

        // Draw lines for answer
        doc.setDrawColor(200, 200, 200);
        for(let i=0; i < 4; i++) {
          doc.line(margin, cursorY, pageWidth - margin, cursorY);
          cursorY += 20;
        }
        cursorY += 15;
      });
    }

    // --- SECTION C: Long Questions ---
    if (testType === 3 && longQuestions.length > 0) {
      checkPageBreak(60);
      cursorY += 10;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`SECTION C: Long Questions (Marks: ${longMarks})`, margin, cursorY);
      cursorY += 20;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      longQuestions.forEach((q, idx) => {
        const qText = `Q${idx + 1}. ${q.question}`;
        const splitQ = doc.splitTextToSize(qText, pageWidth - 2 * margin - 30);
        const marksText = `[${q.marks}]`;

        const needed = splitQ.length * 14 + 40; // Just check question fits, lines can span pages

        checkPageBreak(needed);

        doc.setFont('helvetica', 'bold');
        doc.text(splitQ, margin, cursorY);
        doc.text(marksText, pageWidth - margin - 20, cursorY);
        doc.setFont('helvetica', 'normal');

        cursorY += splitQ.length * 14 + 15;

        // Draw lines for long answer
        doc.setDrawColor(200, 200, 200);
        let linesDrawn = 0;
        while(linesDrawn < 12) {
          if (checkPageBreak(20)) {
            // Re-apply watermark if page breaks
          }
          doc.line(margin, cursorY, pageWidth - margin, cursorY);
          cursorY += 20;
          linesDrawn++;
        }
        cursorY += 20;
      });
    }

    // Download PDF
    const filename = `${subject}_${grade}th_${board}_TestPaper.pdf`;
    doc.save(filename);
    return true;

  } catch (err) {
    console.error('PDF Generation Error:', err);
    return false;
  }
};
