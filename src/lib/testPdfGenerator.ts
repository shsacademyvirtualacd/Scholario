import { jsPDF } from 'jspdf';
import type { GeneratedTestSpecification } from '../types/questionBank';
import { renderLaTeXToText } from './latexRenderer';

// Cached base64 of SHS Academy logo for immediate rendering
let cachedShsLogoBase64: string | null = null;

/**
 * Loads an image from URL or path and converts to Base64 Data URL with strict timeout
 */
async function loadImageAsBase64(url: string, timeoutMs: number = 2500): Promise<string | null> {
  if (cachedShsLogoBase64 && (url.includes('shs') || url.includes('logo'))) {
    return cachedShsLogoBase64;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob || blob.size === 0 || !blob.type.startsWith('image/')) return null;

    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        if (url.includes('shs') || url.includes('logo')) {
          cachedShsLogoBase64 = base64data;
        }
        resolve(base64data);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[PDFGenerator] Image fetch timed out or failed for:', url);
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
  arrayBuffer: ArrayBuffer;
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

  // Attempt to load SHS Logo with fast timeout and fallback
  let shsLogoData: string | null = null;
  try {
    shsLogoData = await loadImageAsBase64('/images/shs-academy-logo.png', 2000);
    if (!shsLogoData) {
      shsLogoData = await loadImageAsBase64('https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000c0808211bef4c03788e5a2c5.png', 2000);
    }
  } catch (e) {
    console.warn('[PDFGenerator] Non-blocking logo load issue, continuing with fallback:', e);
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
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);

    // Footer divider line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 11, pageWidth - marginX, pageHeight - 11);

    // Left side: Academy confidential paper tag
    doc.text('SHS Virtual Academy • Confidential Examination Paper', marginX, pageHeight - 6.5);

    // Right side: Page number and Scholario platform credit (no center collision)
    doc.text(`Page ${pageNumber}  •  Powered by Scholario LMS (scholario.me)`, pageWidth - marginX, pageHeight - 6.5, { align: 'right' });
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
  const leftColWidth = 32;
  const rightColWidth = 40;
  const centerColWidth = contentWidth - leftColWidth - rightColWidth; // ~110mm
  const centerColX = marginX + leftColWidth + centerColWidth / 2; // 105mm
  const maxCenterTextWidth = centerColWidth - 4; // 106mm

  // Top Left: SHS Academy Logo (Fixed 20x20mm box at marginX, 11)
  if (shsLogoData) {
    try {
      doc.addImage(shsLogoData, 'PNG', marginX, 11, 20, 20);
    } catch {
      // Fallback text box if image loading issue
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(17, 17, 17);
      doc.text('SHS ACADEMY', marginX, 21);
    }
  }

  // Top Right: Scholario Logo & Lockup (Fixed right-aligned lockup at pageWidth - marginX)
  const lockupRightX = pageWidth - marginX;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 17, 17);
  doc.text('Scholario', lockupRightX, 15, { align: 'right' });

  // Line 1: Powered by Scholario LMS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(110, 110, 110);
  doc.text('Powered by Scholario LMS', lockupRightX, 19.5, { align: 'right' });

  // Line 2: scholario.me
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(180, 130, 20); // Golden accent
  doc.text('scholario.me', lockupRightX, 23.5, { align: 'right' });

  // Center: Academy Title, Test Title & Curriculum Details (strictly bounded within maxCenterTextWidth)
  let centerCursorY = 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(17, 17, 17);
  doc.text('SHS VIRTUAL ACADEMY', centerColX, centerCursorY, { align: 'center', maxWidth: maxCenterTextWidth });
  centerCursorY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(45, 45, 45);
  const splitTitle = doc.splitTextToSize(test.title.toUpperCase(), maxCenterTextWidth);
  splitTitle.forEach((line: string) => {
    doc.text(line, centerColX, centerCursorY, { align: 'center' });
    centerCursorY += 4.2;
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  const chapterSub = test.chapter && test.chapter !== 'All' ? ` • ${test.chapter}` : '';
  const subText = `Grade ${test.grade} (${test.stream || 'Science'}) • ${test.board.toUpperCase()} Curriculum${chapterSub}`;
  const splitSub = doc.splitTextToSize(subText, maxCenterTextWidth);
  splitSub.forEach((line: string) => {
    doc.text(line, centerColX, centerCursorY, { align: 'center' });
    centerCursorY += 3.5;
  });

  // Calculate dynamic header bottom to prevent any overlap with student box
  const headerBottomY = Math.max(34, 11 + 20, centerCursorY + 1);
  cursorY = headerBottomY + 3;

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
  // 3. SECTION RENDERING (ADAPTIVE LETTERING & QUESTION NUMBERING)
  // ═══════════════════════════════════════════════════════════════════════════
  const hasMCQs = !!(test.mcqs && test.mcqs.length > 0);
  const hasShort = !!(test.shortQuestions && test.shortQuestions.length > 0);
  const hasLong = !!(test.longQuestions && test.longQuestions.length > 0);

  let sectionCount = 0;
  const sectionLetters = ['A', 'B', 'C', 'D'];

  // 3.1 SECTION: MULTIPLE CHOICE QUESTIONS (MCQs)
  if (hasMCQs && test.mcqs) {
    const secLetter = sectionLetters[sectionCount++];
    checkPageBreak(18);
    const mcqMarksTotal = test.mcqs.length * (test.mcqMarksEach || 1);

    // Section Header Box
    doc.setFillColor(17, 17, 17);
    doc.rect(marginX, cursorY, contentWidth, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`SECTION – ${secLetter} : MULTIPLE CHOICE QUESTIONS (MCQs)`, marginX + 4, cursorY + 4.5);
    doc.text(`[${mcqMarksTotal} Marks]`, lockupRightX - 4, cursorY + 4.5, { align: 'right' });
    cursorY += 9;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text('Note: Attempt ALL questions. Choose the correct option and fill the corresponding bubble.', marginX, cursorY);
    cursorY += 5;

    test.mcqs.forEach((mcq, idx) => {
      const qNum = `Q1. (${idx + 1})`;
      const cleanQuestion = renderLaTeXToText(mcq.question);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(20, 20, 20);

      const splitQuestion = doc.splitTextToSize(`${qNum}  ${cleanQuestion}`, contentWidth);
      checkPageBreak(splitQuestion.length * 4 + 10);

      doc.text(splitQuestion, marginX, cursorY);
      cursorY += splitQuestion.length * 4 + 1;

      // 4 Options Layout (2 columns x 2 rows)
      const colWidth = (contentWidth - 6) / 2;
      const optA = `(A)  ${renderLaTeXToText(mcq.options?.A || '')}`;
      const optB = `(B)  ${renderLaTeXToText(mcq.options?.B || '')}`;
      const optC = `(C)  ${renderLaTeXToText(mcq.options?.C || '')}`;
      const optD = `(D)  ${renderLaTeXToText(mcq.options?.D || '')}`;

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

  // 3.2 SECTION: SHORT ANSWER QUESTIONS
  if (hasShort && test.shortQuestions) {
    const secLetter = sectionLetters[sectionCount++];
    const shortQPrefix = hasMCQs ? 'Q2' : 'Q1';
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
    doc.text(`SECTION – ${secLetter} : SHORT ANSWER QUESTIONS`, marginX + 4, cursorY + 4.5);
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
      const qPrefix = `${shortQPrefix}. (${roman})`;
      const cleanQuestion = renderLaTeXToText(sq.question);
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

  // 3.3 SECTION: DETAILED / LONG ANSWER QUESTIONS
  if (hasLong && test.longQuestions) {
    const secLetter = sectionLetters[sectionCount++];
    const longQStartNum = (hasMCQs ? 1 : 0) + (hasShort ? 1 : 0) + 1;
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
    doc.text(`SECTION – ${secLetter} : DETAILED / LONG ANSWER QUESTIONS`, marginX + 4, cursorY + 4.5);
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
      const qNum = `Q${longQStartNum + idx}.`;
      const cleanQuestion = renderLaTeXToText(lq.question);
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
          const cleanPart = renderLaTeXToText(part.text);
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. ANSWER KEY & MARKING SCHEME APPENDIX (TEACHER'S REFERENCE)
  // ═══════════════════════════════════════════════════════════════════════════
  const hasAnswers =
    (test.mcqs && test.mcqs.some((m) => m.correctAnswer || m.explanation)) ||
    (test.shortQuestions && test.shortQuestions.some((s) => s.modelAnswer || s.keyPoints)) ||
    (test.longQuestions && test.longQuestions.some((l) => l.modelAnswer || l.markingScheme));

  if (hasAnswers) {
    // Start Answer Key on a fresh new page
    renderPageDecorations(currentPage);
    doc.addPage();
    currentPage++;
    cursorY = 20;

    // Answer Key Header Box
    doc.setFillColor(180, 130, 20); // Golden accent
    doc.rect(marginX, cursorY, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text('OFFICIAL ANSWER KEY & MARKING SCHEME (TEACHER’S COPY)', marginX + 4, cursorY + 4.8);
    cursorY += 11;

    // MCQs Answer Key
    if (test.mcqs && test.mcqs.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(17, 17, 17);
      doc.text('SECTION A: MULTIPLE CHOICE ANSWERS', marginX, cursorY);
      cursorY += 5;

      test.mcqs.forEach((mcq, idx) => {
        const correctOptKey = mcq.correctAnswer || 'A';
        const correctOptText = (mcq.options as any)?.[correctOptKey] || '';
        const renderedOptText = renderLaTeXToText(correctOptText);
        const renderedExp = renderLaTeXToText(mcq.explanation || '');

        const ansHeader = `Q1.(${idx + 1}) Correct Option: [${correctOptKey}] ${renderedOptText}`;
        const splitAns = doc.splitTextToSize(ansHeader, contentWidth);
        checkPageBreak(splitAns.length * 4 + 8);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(splitAns, marginX + 2, cursorY);
        cursorY += splitAns.length * 3.8 + 0.5;

        if (renderedExp) {
          const expText = `Explanation: ${renderedExp}`;
          const splitExp = doc.splitTextToSize(expText, contentWidth - 6);
          checkPageBreak(splitExp.length * 3.6 + 4);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(90, 90, 90);
          doc.text(splitExp, marginX + 4, cursorY);
          cursorY += splitExp.length * 3.6 + 2;
        }
      });
      cursorY += 4;
    }

    // Short Questions Key Points
    if (test.shortQuestions && test.shortQuestions.some((s) => s.modelAnswer || (s.keyPoints && s.keyPoints.length > 0))) {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(17, 17, 17);
      doc.text('SECTION B: SHORT QUESTIONS MODEL ANSWERS & KEY CRITERIA', marginX, cursorY);
      cursorY += 5;

      test.shortQuestions.forEach((sq, idx) => {
        const roman = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'][idx] || `${idx + 1}`;
        const qTitle = `(${roman}) ${renderLaTeXToText(sq.question)}`;
        const splitQ = doc.splitTextToSize(qTitle, contentWidth - 4);
        checkPageBreak(splitQ.length * 4 + 8);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(splitQ, marginX + 2, cursorY);
        cursorY += splitQ.length * 3.8 + 1;

        if (sq.modelAnswer) {
          const renderedAns = renderLaTeXToText(sq.modelAnswer);
          const splitAns = doc.splitTextToSize(`Model Answer: ${renderedAns}`, contentWidth - 6);
          checkPageBreak(splitAns.length * 3.6 + 3);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(60, 60, 60);
          doc.text(splitAns, marginX + 4, cursorY);
          cursorY += splitAns.length * 3.6 + 1.5;
        }

        if (sq.keyPoints && sq.keyPoints.length > 0) {
          sq.keyPoints.forEach((kp) => {
            const renderedKp = renderLaTeXToText(kp);
            const splitKp = doc.splitTextToSize(`• ${renderedKp}`, contentWidth - 8);
            checkPageBreak(splitKp.length * 3.5 + 2);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(80, 80, 80);
            doc.text(splitKp, marginX + 6, cursorY);
            cursorY += splitKp.length * 3.5 + 1;
          });
        }

        cursorY += 2;
      });
      cursorY += 4;
    }

    // Long Questions Marking Scheme
    if (test.longQuestions && test.longQuestions.some((l) => l.modelAnswer || (l.markingScheme && l.markingScheme.length > 0))) {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(17, 17, 17);
      doc.text('SECTION C: DETAILED QUESTIONS MARKING SCHEME', marginX, cursorY);
      cursorY += 5;

      test.longQuestions.forEach((lq, idx) => {
        const qTitle = `Q.${idx + 1} ${renderLaTeXToText(lq.question)}`;
        const splitQ = doc.splitTextToSize(qTitle, contentWidth - 4);
        checkPageBreak(splitQ.length * 4 + 8);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(splitQ, marginX + 2, cursorY);
        cursorY += splitQ.length * 3.8 + 1;

        if (lq.modelAnswer) {
          const renderedAns = renderLaTeXToText(lq.modelAnswer);
          const splitAns = doc.splitTextToSize(`Solution Outline: ${renderedAns}`, contentWidth - 6);
          checkPageBreak(splitAns.length * 3.6 + 3);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(60, 60, 60);
          doc.text(splitAns, marginX + 4, cursorY);
          cursorY += splitAns.length * 3.6 + 1.5;
        }

        if (lq.markingScheme && lq.markingScheme.length > 0) {
          lq.markingScheme.forEach((ms) => {
            const renderedMs = renderLaTeXToText(ms);
            const splitMs = doc.splitTextToSize(`- ${renderedMs}`, contentWidth - 8);
            checkPageBreak(splitMs.length * 3.5 + 2);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(80, 80, 80);
            doc.text(splitMs, marginX + 6, cursorY);
            cursorY += splitMs.length * 3.5 + 1;
          });
        }

        cursorY += 2;
      });
    }
  }

  // Render decorations on the final page
  renderPageDecorations(currentPage);

  const pdfBlob = doc.output('blob');
  const pdfDataUrl = doc.output('datauristring');
  const pdfArrayBuffer = doc.output('arraybuffer');
  const cleanSubject = test.subject.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const cleanTitle = test.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
  const filename = `SHS_Test_${cleanSubject}_G${test.grade}_${cleanTitle}.pdf`;

  return {
    blob: pdfBlob,
    dataUrl: pdfDataUrl,
    arrayBuffer: pdfArrayBuffer,
    filename,
  };
}

export default generateTestPaperPDF;
