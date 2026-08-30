import { jsPDF } from 'jspdf';
import type { GeneratedTestSpecification } from '../types/questionBank';
import { renderLaTeXToText } from './latexRenderer';
import { containsUrdu, formatUrduTextForPdf } from './urduReshaper';
import { NOTO_NASKH_ARABIC_BASE64 } from './urduFontBase64';

// Cached Base64 of SHS Academy Logo and Urdu Fonts
let cachedShsLogoBase64: string | null = null;
let cachedUrduFontBase64: string | null = NOTO_NASKH_ARABIC_BASE64;

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
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Loads the Urdu/Arabic compatible TrueType font and converts to Base64 for jsPDF embedding
 */
async function loadUrduFontBase64(timeoutMs: number = 3500): Promise<string | null> {
  if (cachedUrduFontBase64) {
    return cachedUrduFontBase64;
  }

  const fontSources = [
    '/fonts/NotoNaskhArabic-Regular.ttf',
    '/fonts/NotoNastaliqUrdu-Regular.ttf',
    '/fonts/Amiri-Regular.ttf',
    'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoNaskhArabic/NotoNaskhArabic-Regular.ttf',
  ];

  for (const src of fontSources) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(src, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        if (buffer && buffer.byteLength > 1000) {
          let binary = '';
          const bytes = new Uint8Array(buffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i += 8192) {
            binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, Math.min(i + 8192, len))));
          }
          const base64 = btoa(binary);
          cachedUrduFontBase64 = base64;
          return base64;
        }
      }
    } catch {
      clearTimeout(timeoutId);
    }
  }

  return null;
}

/**
 * Generates an official, beautifully branded examination paper PDF with full Urdu & RTL support.
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
  const lockupRightX = pageWidth - marginX; // 196mm

  // Determine whether this test contains Urdu content
  const isUrduSubject =
    test.subject?.toLowerCase().includes('urdu') ||
    test.subject?.toLowerCase().includes('islam') ||
    containsUrdu(test.title) ||
    containsUrdu(test.instructions) ||
    (test.mcqs && test.mcqs.some((m) => containsUrdu(m.question))) ||
    (test.shortQuestions && test.shortQuestions.some((s) => containsUrdu(s.question))) ||
    (test.longQuestions && test.longQuestions.some((l) => containsUrdu(l.question)));

  // 1. Attempt to load and register Urdu TrueType font in jsPDF
  let isUrduFontLoaded = false;
  try {
    const urduFontBase64 = cachedUrduFontBase64 || NOTO_NASKH_ARABIC_BASE64 || (await loadUrduFontBase64());
    if (urduFontBase64) {
      doc.addFileToVFS('UrduFont.ttf', urduFontBase64);
      doc.addFont('UrduFont.ttf', 'UrduFont', 'normal');
      doc.addFont('UrduFont.ttf', 'UrduFont', 'bold');
      isUrduFontLoaded = true;
    }
  } catch (err) {
    console.warn('[PDFGenerator] Warning: Could not register Urdu font in jsPDF:', err);
  }

  // Helper to set font based on text language
  const setFontForText = (text: string | null | undefined, isBold: boolean = false, fontSize: number = 8.5): boolean => {
    const textHasUrdu = isUrduFontLoaded && (containsUrdu(text) || isUrduSubject);
    if (textHasUrdu) {
      doc.setFont('UrduFont', isBold ? 'bold' : 'normal');
      doc.setFontSize(fontSize + 0.5); // Urdu glyphs render best at slightly larger optical size
      return true;
    } else {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      return false;
    }
  };

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
      const isHeaderUrdu = setFontForText(test.subject, true, 9);
      doc.setTextColor(50, 50, 50);
      if (isHeaderUrdu) {
        const subHeader = formatUrduTextForPdf(`SHS VIRTUAL ACADEMY — ${test.subject} (GRADE ${test.grade})`);
        doc.text(subHeader, lockupRightX, cursorY, { align: 'right' });
      } else {
        doc.text(`SHS VIRTUAL ACADEMY — ${test.subject.toUpperCase()} (GRADE ${test.grade})`, marginX, cursorY);
        setFontForText(test.title, false, 8);
        doc.setTextColor(120, 120, 120);
        doc.text(`${test.title}`, lockupRightX, cursorY, { align: 'right' });
      }

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
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(17, 17, 17);
      doc.text('SHS ACADEMY', marginX, 21);
    }
  }

  // Top Right: Scholario Logo & Lockup (Fixed right-aligned lockup at pageWidth - marginX)
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

  const isTitleUrdu = setFontForText(test.title, true, 10);
  doc.setTextColor(45, 45, 45);

  if (isTitleUrdu) {
    const formattedTitle = formatUrduTextForPdf(test.title);
    const splitTitle = doc.splitTextToSize(formattedTitle, maxCenterTextWidth);
    splitTitle.forEach((line: string) => {
      doc.text(line, centerColX, centerCursorY, { align: 'center' });
      centerCursorY += 4.5;
    });
  } else {
    const splitTitle = doc.splitTextToSize(test.title.toUpperCase(), maxCenterTextWidth);
    splitTitle.forEach((line: string) => {
      doc.text(line, centerColX, centerCursorY, { align: 'center' });
      centerCursorY += 4.2;
    });
  }

  setFontForText(test.chapter, false, 7.5);
  doc.setTextColor(100, 100, 100);
  const chapterSub = test.chapter && test.chapter !== 'All' ? ` • ${test.chapter}` : '';
  const subText = `Grade ${test.grade} (${test.stream || 'Science'}) • ${test.board.toUpperCase()} Curriculum${chapterSub}`;
  const splitSub = doc.splitTextToSize(containsUrdu(subText) ? formatUrduTextForPdf(subText) : subText, maxCenterTextWidth);
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
  if (containsUrdu(test.subject) && isUrduFontLoaded) {
    doc.text('Subject: ', marginX + 4, cursorY + 11.5);
    setFontForText(test.subject, true, 8.5);
    doc.text(formatUrduTextForPdf(test.subject), marginX + 17, cursorY + 11.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
  } else {
    doc.text(`Subject: ${test.subject}`, marginX + 4, cursorY + 11.5);
  }

  doc.text(`Time Allowed: ${test.timeAllowedMinutes} Mins`, marginX + 70, cursorY + 11.5);
  doc.text(`Total Marks: ${test.totalMarks}`, lockupRightX - 4, cursorY + 11.5, { align: 'right' });

  cursorY += 21;

  // Special Instructions (if any)
  if (test.instructions) {
    const isInstUrdu = setFontForText(test.instructions, false, 8);
    doc.setTextColor(100, 100, 100);
    if (isInstUrdu) {
      const instFormatted = formatUrduTextForPdf(`ہدایات: ${test.instructions}`);
      const splitInst = doc.splitTextToSize(instFormatted, contentWidth);
      splitInst.forEach((line: string) => {
        doc.text(line, lockupRightX, cursorY, { align: 'right' });
        cursorY += 4;
      });
      cursorY += 1;
    } else {
      doc.text(`Instructions: ${test.instructions}`, marginX, cursorY);
      cursorY += 5;
    }
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

    const isMcqSecUrdu = isUrduSubject || test.mcqs.some((m) => containsUrdu(m.question));
    if (isMcqSecUrdu && isUrduFontLoaded) {
      setFontForText('اردو', false, 8);
      doc.setTextColor(80, 80, 80);
      const noteUrdu = formatUrduTextForPdf('نوٹ: تمام سوالات لازمی ہیں۔ درست جواب کا انتخاب کریں اور دیے گئے دائرے کو پر کریں۔');
      doc.text(noteUrdu, lockupRightX, cursorY, { align: 'right' });
      cursorY += 5.5;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text('Note: Attempt ALL questions. Choose the correct option and fill the corresponding bubble.', marginX, cursorY);
      cursorY += 5;
    }

    test.mcqs.forEach((mcq, idx) => {
      const rawQuestion = renderLaTeXToText(mcq.question);
      const isUrduQ = containsUrdu(rawQuestion) || isUrduSubject;
      checkPageBreak(24);

      setFontForText(rawQuestion, true, 8.5);
      doc.setTextColor(20, 20, 20);

      if (isUrduQ) {
        // Urdu Right-to-Left Question Layout
        const urduFullQ = formatUrduTextForPdf(`${rawQuestion}   (${idx + 1}) .1Q`);
        const splitQ = doc.splitTextToSize(urduFullQ, contentWidth - 4);
        splitQ.forEach((line: string) => {
          doc.text(line, lockupRightX, cursorY, { align: 'right' });
          cursorY += 4.5;
        });
        cursorY += 1;

        // 4 Options Layout (2 columns x 2 rows, Right-to-Left aligned)
        const colWidth = (contentWidth - 6) / 2;
        const optA = formatUrduTextForPdf(`${renderLaTeXToText(mcq.options?.A || '')}  (A)`);
        const optB = formatUrduTextForPdf(`${renderLaTeXToText(mcq.options?.B || '')}  (B)`);
        const optC = formatUrduTextForPdf(`${renderLaTeXToText(mcq.options?.C || '')}  (C)`);
        const optD = formatUrduTextForPdf(`${renderLaTeXToText(mcq.options?.D || '')}  (D)`);

        setFontForText(optA, false, 8);
        doc.setTextColor(40, 40, 40);

        // Row 1: Opt A on Right Column, Opt B on Left Column
        doc.text(doc.splitTextToSize(optA, colWidth), lockupRightX - 2, cursorY, { align: 'right' });
        doc.text(doc.splitTextToSize(optB, colWidth), marginX + colWidth - 2, cursorY, { align: 'right' });
        cursorY += 5;

        // Row 2: Opt C on Right Column, Opt D on Left Column
        doc.text(doc.splitTextToSize(optC, colWidth), lockupRightX - 2, cursorY, { align: 'right' });
        doc.text(doc.splitTextToSize(optD, colWidth), marginX + colWidth - 2, cursorY, { align: 'right' });
        cursorY += 6.5;
      } else {
        // Standard Left-to-Right Question Layout
        const qNum = `Q1. (${idx + 1})`;
        const splitQuestion = doc.splitTextToSize(`${qNum}  ${rawQuestion}`, contentWidth);
        doc.text(splitQuestion, marginX, cursorY);
        cursorY += splitQuestion.length * 4 + 1;

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
      }
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

    const isShortSecUrdu = isUrduSubject || test.shortQuestions.some((s) => containsUrdu(s.question));
    if (isShortSecUrdu && isUrduFontLoaded) {
      setFontForText('اردو', false, 8);
      doc.setTextColor(80, 80, 80);
      const attemptMsg = attemptCount < test.shortQuestions.length
        ? formatUrduTextForPdf(`نوٹ: کوئی سے ${attemptCount} سوالات حل کریں۔ کل ${test.shortQuestions.length} سوالات ہیں۔ ہر سوال کے ${marksPerShort} نمبر ہیں۔`)
        : formatUrduTextForPdf(`نوٹ: تمام سوالات کے مختصر جوابات تحریر کریں۔ ہر سوال کے ${marksPerShort} نمبر ہیں۔`);
      doc.text(attemptMsg, lockupRightX, cursorY, { align: 'right' });
      cursorY += 5.5;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const attemptMsg = attemptCount < test.shortQuestions.length
        ? `Note: Attempt any ${attemptCount} questions out of ${test.shortQuestions.length}. Each question carries ${marksPerShort} marks.`
        : `Note: Attempt ALL questions. Each question carries ${marksPerShort} marks.`;
      doc.text(attemptMsg, marginX, cursorY);
      cursorY += 5;
    }

    test.shortQuestions.forEach((sq, idx) => {
      const roman = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'][idx] || `${idx + 1}`;
      const cleanQuestion = renderLaTeXToText(sq.question);
      const isUrduQ = containsUrdu(cleanQuestion) || isUrduSubject;
      const marksLabel = `[${sq.marks || marksPerShort} Marks]`;

      setFontForText(cleanQuestion, true, 8.5);
      doc.setTextColor(20, 20, 20);

      if (isUrduQ) {
        const fullShortQ = formatUrduTextForPdf(`${cleanQuestion}   (${roman}) .${shortQPrefix}`);
        const splitQuestion = doc.splitTextToSize(fullShortQ, contentWidth - 22);
        checkPageBreak(splitQuestion.length * 4.5 + 4);

        doc.text(splitQuestion, lockupRightX, cursorY, { align: 'right' });

        // Left-aligned marks badge
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        doc.text(marksLabel, marginX, cursorY);

        cursorY += splitQuestion.length * 4.5 + 3.5;
      } else {
        const qPrefix = `${shortQPrefix}. (${roman})`;
        const splitQuestion = doc.splitTextToSize(`${qPrefix}  ${cleanQuestion}`, contentWidth - 20);
        checkPageBreak(splitQuestion.length * 4.5 + 4);

        doc.text(splitQuestion, marginX, cursorY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        doc.text(marksLabel, lockupRightX, cursorY, { align: 'right' });

        cursorY += splitQuestion.length * 4.5 + 3.5;
      }
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

    const isLongSecUrdu = isUrduSubject || test.longQuestions.some((l) => containsUrdu(l.question));
    if (isLongSecUrdu && isUrduFontLoaded) {
      setFontForText('اردو', false, 8);
      doc.setTextColor(80, 80, 80);
      const attemptMsg = attemptCount < test.longQuestions.length
        ? formatUrduTextForPdf(`نوٹ: کوئی سے ${attemptCount} تفصیلی سوالات کے جامع جوابات تحریر کریں۔ کل ${test.longQuestions.length} سوالات ہیں۔`)
        : formatUrduTextForPdf('نوٹ: تمام تفصیلی سوالات کے جامع اور مفصل جوابات تحریر کریں۔');
      doc.text(attemptMsg, lockupRightX, cursorY, { align: 'right' });
      cursorY += 5.5;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const attemptMsg = attemptCount < test.longQuestions.length
        ? `Note: Attempt any ${attemptCount} questions out of ${test.longQuestions.length}. Draw neat and labeled diagrams where necessary.`
        : `Note: Attempt ALL questions. Draw neat and labeled diagrams where necessary.`;
      doc.text(attemptMsg, marginX, cursorY);
      cursorY += 5;
    }

    test.longQuestions.forEach((lq, idx) => {
      const qNum = `Q${longQStartNum + idx}.`;
      const cleanQuestion = renderLaTeXToText(lq.question);
      const isUrduQ = containsUrdu(cleanQuestion) || isUrduSubject;
      const marksLabel = `[${lq.marks || marksPerLong} Marks]`;

      setFontForText(cleanQuestion, true, 8.5);
      doc.setTextColor(20, 20, 20);

      if (isUrduQ) {
        const fullLongQ = formatUrduTextForPdf(`${cleanQuestion}   ${qNum}`);
        const splitQuestion = doc.splitTextToSize(fullLongQ, contentWidth - 22);
        checkPageBreak(splitQuestion.length * 4.5 + (lq.parts ? lq.parts.length * 8 : 4));

        doc.text(splitQuestion, lockupRightX, cursorY, { align: 'right' });

        // Left-aligned marks badge
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        doc.text(marksLabel, marginX, cursorY);

        cursorY += splitQuestion.length * 4.5 + 2;

        // Render sub-parts (الف), (ب) / (a), (b)
        if (lq.parts && lq.parts.length > 0) {
          lq.parts.forEach((part) => {
            const cleanPart = renderLaTeXToText(part.text);
            const fullPart = formatUrduTextForPdf(`${cleanPart}   ${part.label}`);
            const splitPart = doc.splitTextToSize(fullPart, contentWidth - 28);
            checkPageBreak(splitPart.length * 4 + 2);

            setFontForText(cleanPart, false, 8);
            doc.setTextColor(40, 40, 40);
            doc.text(splitPart, lockupRightX - 6, cursorY, { align: 'right' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(110, 110, 110);
            doc.text(`(${part.marks} Marks)`, marginX + 4, cursorY);

            cursorY += splitPart.length * 4 + 2.5;
          });
        }
      } else {
        const splitQuestion = doc.splitTextToSize(`${qNum}  ${cleanQuestion}`, contentWidth - 20);
        checkPageBreak(splitQuestion.length * 4.5 + (lq.parts ? lq.parts.length * 8 : 4));

        doc.text(splitQuestion, marginX, cursorY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        doc.text(marksLabel, lockupRightX, cursorY, { align: 'right' });
        cursorY += splitQuestion.length * 4.5 + 2;

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
        const isOptUrdu = containsUrdu(renderedOptText) || isUrduSubject;

        if (isOptUrdu) {
          const ansUrduHeader = formatUrduTextForPdf(`[${correctOptKey}] ${renderedOptText}   :درست جواب   (${idx + 1}) .1Q`);
          setFontForText(renderedOptText, true, 8);
          doc.setTextColor(30, 41, 59);
          const splitAns = doc.splitTextToSize(ansUrduHeader, contentWidth - 4);
          checkPageBreak(splitAns.length * 4 + 8);
          splitAns.forEach((line: string) => {
            doc.text(line, lockupRightX, cursorY, { align: 'right' });
            cursorY += 4;
          });
          cursorY += 0.5;

          if (renderedExp) {
            const expUrdu = formatUrduTextForPdf(`وضاحت: ${renderedExp}`);
            setFontForText(renderedExp, false, 7.5);
            doc.setTextColor(90, 90, 90);
            const splitExp = doc.splitTextToSize(expUrdu, contentWidth - 6);
            checkPageBreak(splitExp.length * 3.6 + 4);
            splitExp.forEach((line: string) => {
              doc.text(line, lockupRightX - 4, cursorY, { align: 'right' });
              cursorY += 3.6;
            });
            cursorY += 2;
          }
        } else {
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
        const cleanQuestion = renderLaTeXToText(sq.question);
        const isUrduQ = containsUrdu(cleanQuestion) || isUrduSubject;

        if (isUrduQ) {
          const qUrduTitle = formatUrduTextForPdf(`${cleanQuestion}   (${roman})`);
          setFontForText(cleanQuestion, true, 8);
          doc.setTextColor(30, 41, 59);
          const splitQ = doc.splitTextToSize(qUrduTitle, contentWidth - 4);
          checkPageBreak(splitQ.length * 4 + 8);
          splitQ.forEach((line: string) => {
            doc.text(line, lockupRightX, cursorY, { align: 'right' });
            cursorY += 4;
          });
          cursorY += 0.5;

          if (sq.modelAnswer) {
            const renderedAns = renderLaTeXToText(sq.modelAnswer);
            const ansUrdu = formatUrduTextForPdf(`نمونہ جواب: ${renderedAns}`);
            setFontForText(renderedAns, false, 7.5);
            doc.setTextColor(60, 60, 60);
            const splitAns = doc.splitTextToSize(ansUrdu, contentWidth - 6);
            checkPageBreak(splitAns.length * 3.6 + 3);
            splitAns.forEach((line: string) => {
              doc.text(line, lockupRightX - 4, cursorY, { align: 'right' });
              cursorY += 3.6;
            });
            cursorY += 1.5;
          }

          if (sq.keyPoints && sq.keyPoints.length > 0) {
            sq.keyPoints.forEach((kp) => {
              const renderedKp = renderLaTeXToText(kp);
              const kpUrdu = formatUrduTextForPdf(`• ${renderedKp}`);
              setFontForText(renderedKp, false, 7.5);
              doc.setTextColor(80, 80, 80);
              const splitKp = doc.splitTextToSize(kpUrdu, contentWidth - 8);
              checkPageBreak(splitKp.length * 3.5 + 2);
              splitKp.forEach((line: string) => {
                doc.text(line, lockupRightX - 6, cursorY, { align: 'right' });
                cursorY += 3.5;
              });
              cursorY += 1;
            });
          }
        } else {
          const qTitle = `(${roman}) ${cleanQuestion}`;
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
        const cleanQuestion = renderLaTeXToText(lq.question);
        const isUrduQ = containsUrdu(cleanQuestion) || isUrduSubject;

        if (isUrduQ) {
          const qUrduTitle = formatUrduTextForPdf(`${cleanQuestion}   Q.${idx + 1}`);
          setFontForText(cleanQuestion, true, 8);
          doc.setTextColor(30, 41, 59);
          const splitQ = doc.splitTextToSize(qUrduTitle, contentWidth - 4);
          checkPageBreak(splitQ.length * 4 + 8);
          splitQ.forEach((line: string) => {
            doc.text(line, lockupRightX, cursorY, { align: 'right' });
            cursorY += 4;
          });
          cursorY += 0.5;

          if (lq.modelAnswer) {
            const renderedAns = renderLaTeXToText(lq.modelAnswer);
            const ansUrdu = formatUrduTextForPdf(`خاکہ حل: ${renderedAns}`);
            setFontForText(renderedAns, false, 7.5);
            doc.setTextColor(60, 60, 60);
            const splitAns = doc.splitTextToSize(ansUrdu, contentWidth - 6);
            checkPageBreak(splitAns.length * 3.6 + 3);
            splitAns.forEach((line: string) => {
              doc.text(line, lockupRightX - 4, cursorY, { align: 'right' });
              cursorY += 3.6;
            });
            cursorY += 1.5;
          }

          if (lq.markingScheme && lq.markingScheme.length > 0) {
            lq.markingScheme.forEach((ms) => {
              const renderedMs = renderLaTeXToText(ms);
              const msUrdu = formatUrduTextForPdf(`- ${renderedMs}`);
              setFontForText(renderedMs, false, 7.5);
              doc.setTextColor(80, 80, 80);
              const splitMs = doc.splitTextToSize(msUrdu, contentWidth - 8);
              checkPageBreak(splitMs.length * 3.5 + 2);
              splitMs.forEach((line: string) => {
                doc.text(line, lockupRightX - 6, cursorY, { align: 'right' });
                cursorY += 3.5;
              });
              cursorY += 1;
            });
          }
        } else {
          const qTitle = `Q.${idx + 1} ${cleanQuestion}`;
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
  const sanitizeForFilename = (str: string, fallback: string) => {
    const cleaned = str.trim().replace(/[\/\\?%*:|"<>]/g, '_').slice(0, 30);
    return cleaned && cleaned.replace(/_/g, '').length > 0 ? cleaned : fallback;
  };
  const cleanSubject = sanitizeForFilename(test.subject, 'Subject');
  const cleanTitle = sanitizeForFilename(test.title, 'Paper');
  const filename = `SHS_Test_${cleanSubject}_G${test.grade}_${cleanTitle}.pdf`;

  return {
    blob: pdfBlob,
    dataUrl: pdfDataUrl,
    arrayBuffer: pdfArrayBuffer,
    filename,
  };
}

export default generateTestPaperPDF;
