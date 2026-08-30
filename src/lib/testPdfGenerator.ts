import { jsPDF } from 'jspdf';
import type { GeneratedTestSpecification } from '../types/questionBank';

// Cached base64 of SHS Academy logo for immediate rendering
let cachedShsLogoBase64: string | null = null;

/**
 * Loads an image from URL or path and converts to Base64 Data URL
 */
async function loadImageAsBase64(url: string): Promise<string | null> {
  if (cachedShsLogoBase64 && url.includes('shs')) {
    return cachedShsLogoBase64;
  }

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        if (url.includes('shs')) {
          cachedShsLogoBase64 = base64data;
        }
        resolve(base64data);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('[PDFGenerator] Image fetch error:', err);
    return null;
  }
}

/**
 * Generates an official, beautifully branded examination paper PDF
 * Strictly adheres to SHS Academy + Scholario LMS branding requirements.
 */
export async function generateTestPaperPDF(test: GeneratedTestSpecification): Promise<{
  blob: Blob;
  dataUrl: string;
  filename: string;
}> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm
  const bottomMargin = 20;

  // Attempt to load SHS Logo
  let shsLogoData = await loadImageAsBase64('/images/shs-academy-logo.png');
  if (!shsLogoData) {
    shsLogoData = await loadImageAsBase64('https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000c0808211bef4c03788e5a2c5.png');
  }

  let currentPage = 1;
  let cursorY = 14;

  /**
   * Renders background watermark and running headers/footers
   */
  const renderPageDecorations = (pageNumber: number) => {
    // 1. Semi-transparent background watermark centered on the page
    if (shsLogoData) {
      try {
        // @ts-ignore
        doc.saveGraphicsState && doc.saveGraphicsState();
        // @ts-ignore
        if (typeof doc.setGState === 'function') {
          // @ts-ignore
          doc.setGState(new doc.GState({ opacity: 0.055 }));
        }

        const watermarkSize = 130; // 130mm wide
        const wmX = (pageWidth - watermarkSize) / 2;
        const wmY = (pageHeight - watermarkSize) / 2;
        doc.addImage(shsLogoData, 'PNG', wmX, wmY, watermarkSize, watermarkSize);

        // @ts-ignore
        doc.restoreGraphicsState && doc.restoreGraphicsState();
      } catch {
        // Fallback if GState unsupported
      }
    }

    // 2. Running footer on every page
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);

    // Footer divider line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.text('SHS Virtual Academy • Confidential Examination Paper', marginX, pageHeight - 7);
    doc.text('Powered by Scholario LMS (scholario.me)', pageWidth / 2, pageHeight - 7, { align: 'center' });
    doc.text(`Page ${pageNumber}`, pageWidth - marginX, pageHeight - 7, { align: 'right' });
  };

  /**
   * Checks if content will exceed page and creates new page with header
   */
  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - bottomMargin) {
      renderPageDecorations(currentPage);
      doc.addPage();
      currentPage++;
      cursorY = 18;

      // Small secondary header for subsequent pages
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(`SHS VIRTUAL ACADEMY — ${test.subject.toUpperCase()} (GRADE ${test.grade})`, marginX, cursorY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`${test.title}`, pageWidth - marginX, cursorY, { align: 'right' });

      cursorY += 3;
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
      cursorY += 6;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. FIRST PAGE TOP BRANDED HEADER (SHS Logo Left + Scholario Lockup Right)
  // ═══════════════════════════════════════════════════════════════════════════

  // Top Left: SHS Academy Logo
  if (shsLogoData) {
    try {
      doc.addImage(shsLogoData, 'PNG', marginX, 12, 22, 22);
    } catch {
      // Fallback text box if image loading issue
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(17, 17, 17);
      doc.text('SHS ACADEMY', marginX, 22);
    }
  }

  // Top Right: Scholario Logo & Lockup
  const lockupRightX = pageWidth - marginX;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 17, 17);
  doc.text('Scholario', lockupRightX, 17, { align: 'right' });

  // Line 1: Powered by Scholario LMS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Powered by Scholario LMS', lockupRightX, 21.5, { align: 'right' });

  // Line 2: scholario.me
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 130, 20); // Golden accent
  doc.text('scholario.me', lockupRightX, 25.5, { align: 'right' });

  // Center: Academy Title & Subject
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(17, 17, 17);
  doc.text('SHS VIRTUAL ACADEMY', pageWidth / 2, 17, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(test.title.toUpperCase(), pageWidth / 2, 22.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const chapterSub = test.chapter && test.chapter !== 'All' ? ` • ${test.chapter}` : '';
  doc.text(`Grade ${test.grade} (${test.stream || 'Science'}) • ${test.board.toUpperCase()} Curriculum${chapterSub}`, pageWidth / 2, 27, { align: 'center' });

  cursorY = 38;

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. STUDENT METADATA & EXAM PARAMETERS BOX
  // ═══════════════════════════════════════════════════════════════════════════
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(marginX, cursorY, contentWidth, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);

  // Row 1
  doc.text('Student Name: ____________________________', marginX + 4, cursorY + 5.5);
  doc.text('Roll No: _______________', marginX + 90, cursorY + 5.5);
  doc.text(`Date: ${test.dueDate || new Date().toISOString().split('T')[0]}`, lockupRightX - 4, cursorY + 5.5, { align: 'right' });

  // Row 2
  doc.text(`Subject: ${test.subject}`, marginX + 4, cursorY + 11.5);
  doc.text(`Time Allowed: ${test.timeAllowedMinutes} Mins`, marginX + 70, cursorY + 11.5);
  doc.text(`Total Marks: ${test.totalMarks}`, lockupRightX - 4, cursorY + 11.5, { align: 'right' });

  cursorY += 21;

  // Special Instructions (if any)
  if (test.instructions) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Instructions: ${test.instructions}`, marginX, cursorY);
    cursorY += 5;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. SECTION A: MULTIPLE CHOICE QUESTIONS (MCQs)
  // ═══════════════════════════════════════════════════════════════════════════
  if (test.mcqs && test.mcqs.length > 0) {
    checkPageBreak(18);
    const mcqMarksTotal = test.mcqs.length * (test.mcqMarksEach || 1);

    // Section Header Box
    doc.setFillColor(17, 17, 17);
    doc.rect(marginX, cursorY, contentWidth, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`SECTION – A : MULTIPLE CHOICE QUESTIONS (MCQs)`, marginX + 4, cursorY + 4.5);
    doc.text(`[${mcqMarksTotal} Marks]`, lockupRightX - 4, cursorY + 4.5, { align: 'right' });
    cursorY += 9;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text('Note: Attempt ALL questions. Choose the correct option and fill the corresponding bubble.', marginX, cursorY);
    cursorY += 5;

    test.mcqs.forEach((mcq, idx) => {
      const qNum = `Q1. (${idx + 1})`;
      const cleanQuestion = mcq.question.replace(/\$([^\$]+)\$/g, '$1');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(20, 20, 20);

      const splitQuestion = doc.splitTextToSize(`${qNum}  ${cleanQuestion}`, contentWidth);
      checkPageBreak(splitQuestion.length * 4 + 10);

      doc.text(splitQuestion, marginX, cursorY);
      cursorY += splitQuestion.length * 4 + 1;

      // 4 Options Layout (2 columns x 2 rows)
      const colWidth = (contentWidth - 6) / 2;
      const optA = `(A)  ${(mcq.options.A || '').replace(/\$([^\$]+)\$/g, '$1')}`;
      const optB = `(B)  ${(mcq.options.B || '').replace(/\$([^\$]+)\$/g, '$1')}`;
      const optC = `(C)  ${(mcq.options.C || '').replace(/\$([^\$]+)\$/g, '$1')}`;
      const optD = `(D)  ${(mcq.options.D || '').replace(/\$([^\$]+)\$/g, '$1')}`;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(40, 40, 40);

      doc.text(doc.splitTextToSize(optA, colWidth), marginX + 4, cursorY);
      doc.text(doc.splitTextToSize(optB, colWidth), marginX + 4 + colWidth + 4, cursorY);
      cursorY += 4.5;

      doc.text(doc.splitTextToSize(optC, colWidth), marginX + 4, cursorY);
      doc.text(doc.splitTextToSize(optD, colWidth), marginX + 4 + colWidth + 4, cursorY);
      cursorY += 6;
    });

    cursorY += 2;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. SECTION B: SHORT ANSWER QUESTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  if (test.shortQuestions && test.shortQuestions.length > 0) {
    checkPageBreak(22);
    const marksPerShort = test.shortMarksEach || 3;
    const attemptCount = test.shortAttemptCount || test.shortQuestions.length;
    const shortMarksTotal = attemptCount * marksPerShort;

    // Section Header Box
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(marginX, cursorY, contentWidth, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`SECTION – B : SHORT ANSWER QUESTIONS`, marginX + 4, cursorY + 4.5);
    doc.text(`[${shortMarksTotal} Marks]`, lockupRightX - 4, cursorY + 4.5, { align: 'right' });
    cursorY += 9;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const attemptMsg = attemptCount < test.shortQuestions.length
      ? `Note: Attempt any ${attemptCount} questions out of ${test.shortQuestions.length}. Each question carries ${marksPerShort} marks.`
      : `Note: Attempt ALL questions. Each question carries ${marksPerShort} marks.`;
    doc.text(attemptMsg, marginX, cursorY);
    cursorY += 5;

    test.shortQuestions.forEach((sq, idx) => {
      const roman = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'][idx] || `${idx + 1}`;
      const qPrefix = `Q2. (${roman})`;
      const cleanQuestion = sq.question.replace(/\$([^\$]+)\$/g, '$1');
      const marksLabel = `[${sq.marks || marksPerShort} Marks]`;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(20, 20, 20);

      const splitQuestion = doc.splitTextToSize(`${qPrefix}  ${cleanQuestion}`, contentWidth - 20);
      checkPageBreak(splitQuestion.length * 4.5 + 4);

      doc.text(splitQuestion, marginX, cursorY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(90, 90, 90);
      doc.text(marksLabel, lockupRightX, cursorY, { align: 'right' });

      cursorY += splitQuestion.length * 4.5 + 3.5;
    });

    cursorY += 2;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. SECTION C: DETAILED / LONG ANSWER QUESTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  if (test.longQuestions && test.longQuestions.length > 0) {
    checkPageBreak(25);
    const marksPerLong = test.longMarksEach || 8;
    const attemptCount = test.longAttemptCount || test.longQuestions.length;
    const longMarksTotal = attemptCount * marksPerLong;

    // Section Header Box
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(marginX, cursorY, contentWidth, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`SECTION – C : DETAILED / LONG ANSWER QUESTIONS`, marginX + 4, cursorY + 4.5);
    doc.text(`[${longMarksTotal} Marks]`, lockupRightX - 4, cursorY + 4.5, { align: 'right' });
    cursorY += 9;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const attemptMsg = attemptCount < test.longQuestions.length
      ? `Note: Attempt any ${attemptCount} questions out of ${test.longQuestions.length}. Draw neat and labeled diagrams where necessary.`
      : `Note: Attempt ALL questions. Draw neat and labeled diagrams where necessary.`;
    doc.text(attemptMsg, marginX, cursorY);
    cursorY += 5;

    test.longQuestions.forEach((lq, idx) => {
      const qNum = `Q${idx + 3}.`;
      const cleanQuestion = lq.question.replace(/\$([^\$]+)\$/g, '$1');
      const marksLabel = `[${lq.marks || marksPerLong} Marks]`;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(20, 20, 20);

      const splitQuestion = doc.splitTextToSize(`${qNum}  ${cleanQuestion}`, contentWidth - 20);
      checkPageBreak(splitQuestion.length * 4.5 + (lq.parts ? lq.parts.length * 8 : 4));

      doc.text(splitQuestion, marginX, cursorY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(90, 90, 90);
      doc.text(marksLabel, lockupRightX, cursorY, { align: 'right' });
      cursorY += splitQuestion.length * 4.5 + 2;

      // Render parts (a), (b) if present
      if (lq.parts && lq.parts.length > 0) {
        lq.parts.forEach((part) => {
          const cleanPart = part.text.replace(/\$([^\$]+)\$/g, '$1');
          const splitPart = doc.splitTextToSize(`${part.label}  ${cleanPart}`, contentWidth - 26);
          checkPageBreak(splitPart.length * 4 + 2);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(40, 40, 40);
          doc.text(splitPart, marginX + 6, cursorY);
          doc.setTextColor(110, 110, 110);
          doc.text(`(${part.marks} Marks)`, lockupRightX, cursorY, { align: 'right' });

          cursorY += splitPart.length * 4 + 2.5;
        });
      }

      cursorY += 3;
    });
  }

  // Render decorations on the final page
  renderPageDecorations(currentPage);

  const pdfBlob = doc.output('blob');
  const pdfDataUrl = doc.output('datauristring');
  const cleanSubject = test.subject.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const cleanTitle = test.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
  const filename = `SHS_Test_${cleanSubject}_G${test.grade}_${cleanTitle}.pdf`;

  return {
    blob: pdfBlob,
    dataUrl: pdfDataUrl,
    filename,
  };
}

export default generateTestPaperPDF;
