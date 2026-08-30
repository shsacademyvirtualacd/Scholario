import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { GeneratedTestSpecification } from '../types/questionBank';
import { renderLaTeXToText } from './latexRenderer';
import { containsUrdu } from './urduReshaper';

export const SHS_OFFICIAL_LOGO_URL =
  'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000c0808211bef4c03788e5a2c5.png';
export const SHS_LOCAL_LOGO_PATH = '/images/shs-academy-logo.png';

let cachedLogoDataUrl: string | null = null;

/**
 * Preload the official SHS Academy Logo to a base64 DataURL
 * to guarantee CORS-free, synchronous rendering in html2canvas without black boxes.
 */
async function getShsLogoDataUrl(): Promise<string> {
  if (cachedLogoDataUrl) {
    return cachedLogoDataUrl;
  }

  // 1. Attempt remote official R2 asset
  try {
    const res = await fetch(SHS_OFFICIAL_LOGO_URL, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      cachedLogoDataUrl = dataUrl;
      return dataUrl;
    }
  } catch (err) {
    console.warn('[PDFGenerator] Remote logo fetch failed, trying local fallback:', err);
  }

  // 2. Fallback to local asset
  try {
    const res = await fetch(SHS_LOCAL_LOGO_PATH);
    if (res.ok) {
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      cachedLogoDataUrl = dataUrl;
      return dataUrl;
    }
  } catch (err) {
    console.warn('[PDFGenerator] Local logo fetch failed:', err);
  }

  // 3. Fallback to raw URL
  return SHS_OFFICIAL_LOGO_URL;
}

/**
 * Generates an official, branded examination paper PDF with complete Urdu & RTL support,
 * block-level page-break pagination (keeping MCQs, questions, and the answer key atomic and unbroken),
 * and high-resolution vector capture.
 */
export async function generateTestPaperPDF(test: GeneratedTestSpecification): Promise<{
  blob: Blob;
  dataUrl: string;
  arrayBuffer: ArrayBuffer;
  filename: string;
}> {
  const sanitizeForFilename = (str: string, fallback: string) => {
    const cleaned = (str || '').trim().replace(/[\/\\?%*:|"<>]/g, '_').slice(0, 30);
    return cleaned && cleaned.replace(/_/g, '').length > 0 ? cleaned : fallback;
  };
  const cleanSubject = sanitizeForFilename(test.subject, 'Subject');
  const cleanTitle = sanitizeForFilename(test.title, 'Paper');
  const filename = `SHS_Test_${cleanSubject}_G${test.grade || '9'}_${cleanTitle}.pdf`;

  // If in browser environment with DOM access, use native HTML-to-PDF engine with pagination
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      return await generateTestPaperHtmlPDF(test, filename);
    } catch (err) {
      console.warn('[PDFGenerator] HTML-to-PDF engine fallback triggered:', err);
      return generateTestPaperFallbackNodePDF(test, filename);
    }
  }

  // Fallback for Node / headless environments
  return generateTestPaperFallbackNodePDF(test, filename);
}

/**
 * High-fidelity HTML-to-PDF multi-page layout engine.
 * Renders discrete A4 pages (794x1123px) with atomic block measurement,
 * preventing any question or answer-key panel from being split across page boundaries.
 */
async function generateTestPaperHtmlPDF(test: GeneratedTestSpecification, filename: string) {
  // Ensure fonts and logo are ready before measuring & capturing
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Non-blocking
    }
  }

  const logoDataUrl = await getShsLogoDataUrl();

  const isUrduSubject =
    test.subject?.toLowerCase().includes('urdu') ||
    test.subject?.toLowerCase().includes('islam') ||
    containsUrdu(test.title) ||
    containsUrdu(test.instructions) ||
    (test.mcqs && test.mcqs.some((m) => containsUrdu(m.question))) ||
    (test.shortQuestions && test.shortQuestions.some((s) => containsUrdu(s.question))) ||
    (test.longQuestions && test.longQuestions.some((l) => containsUrdu(l.question)));

  const mcqs = test.mcqs || [];
  const shortQuestions = test.shortQuestions || [];
  const longQuestions = test.longQuestions || [];

  const mcqMarksTotal = (test.mcqMarksEach || 1) * mcqs.length;
  const shortMarksTotal = (test.shortMarksEach || 2) * (test.shortAttemptCount || shortQuestions.length);
  const longMarksTotal = (test.longMarksEach || 5) * (test.longAttemptCount || longQuestions.length);

  const sectionLetters = ['A', 'B', 'C', 'D'];
  let sectionLetterIdx = 0;

  // Urdu font CSS family
  const urduFontFamily =
    "'Noto Nastaliq Urdu', 'Noto Naskh Arabic', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', 'Arabic Typesetting', serif";
  const standardFontFamily = "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, sans-serif";

  // Root container for off-screen page layout assembly
  const renderRoot = document.createElement('div');
  renderRoot.id = 'shs-pdf-multi-page-renderer';
  renderRoot.style.position = 'fixed';
  renderRoot.style.left = '-9999px';
  renderRoot.style.top = '0';
  renderRoot.style.width = '794px';
  renderRoot.style.backgroundColor = '#ffffff';
  renderRoot.style.zIndex = '-9999';
  document.body.appendChild(renderRoot);

  const PAGE_HEIGHT = 1123; // Exact A4 height at 96 DPI for 794px width (210mm x 297mm)
  // Maximum content boundary from the top edge of each page, leaving ample room before the footer
  const MAX_CONTENT_BOTTOM_OFFSET = 1060;

  interface PageRecord {
    pageEl: HTMLDivElement;
    contentEl: HTMLDivElement;
    pageNumber: number;
  }

  const pages: PageRecord[] = [];

  // Helper to create an authentic A4 Page DOM element
  function createNewPage(pageNum: number): PageRecord {
    const pageEl = document.createElement('div');
    pageEl.className = 'shs-pdf-page-container';
    pageEl.style.width = '794px';
    pageEl.style.height = `${PAGE_HEIGHT}px`;
    pageEl.style.minHeight = `${PAGE_HEIGHT}px`;
    pageEl.style.maxHeight = `${PAGE_HEIGHT}px`;
    pageEl.style.boxSizing = 'border-box';
    pageEl.style.position = 'relative';
    pageEl.style.backgroundColor = '#ffffff';
    pageEl.style.color = '#111111';
    pageEl.style.fontFamily = standardFontFamily;
    pageEl.style.padding = '30px 40px 44px 40px';
    pageEl.style.overflow = 'hidden';

    // 1. Watermark Overlay (Centered on every page)
    const watermarkEl = document.createElement('div');
    watermarkEl.style.position = 'absolute';
    watermarkEl.style.inset = '0';
    watermarkEl.style.display = 'flex';
    watermarkEl.style.alignItems = 'center';
    watermarkEl.style.justifyContent = 'center';
    watermarkEl.style.pointerEvents = 'none';
    watermarkEl.style.opacity = '0.04';
    watermarkEl.style.overflow = 'hidden';
    watermarkEl.style.zIndex = '1';
    watermarkEl.innerHTML = `
      <img src="${logoDataUrl}" alt="SHS Watermark" style="width: 440px; height: 440px; object-fit: contain; filter: grayscale(100%); background: transparent;" crossOrigin="anonymous" />
    `;
    pageEl.appendChild(watermarkEl);

    // 2. Page Header
    const headerEl = document.createElement('div');
    headerEl.style.position = 'relative';
    headerEl.style.zIndex = '10';

    if (pageNum === 1) {
      // Full branded header on Page 1
      headerEl.innerHTML = `
        <!-- Top Branded Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111111; padding-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: transparent;">
              <img src="${logoDataUrl}" alt="SHS Logo" style="max-width: 100%; max-height: 100%; object-fit: contain; background: transparent;" crossOrigin="anonymous" />
            </div>
            <div>
              <h1 style="margin: 0; font-size: 16.5px; font-weight: 900; letter-spacing: -0.02em; color: #111111; text-transform: uppercase;">SHS VIRTUAL ACADEMY</h1>
              <p style="margin: 2px 0 0 0; font-size: 10px; font-weight: 700; color: #525252; text-transform: uppercase; letter-spacing: 0.04em;">Department of Examinations & Academic Assessments</p>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 14.5px; font-weight: 900; color: #111111;">Scholario</div>
            <div style="font-size: 9.5px; font-weight: 700; color: #737373;">Powered by Scholario LMS</div>
            <div style="font-size: 9.5px; font-weight: 800; color: #d97706;">scholario.me</div>
          </div>
        </div>

        <!-- Title & Curriculum Details -->
        <div style="text-align: center; padding: 8px 0; border-bottom: 1px solid #e5e5e5;">
          <h2 style="margin: 0; font-size: 14px; font-weight: 900; text-transform: uppercase; color: #111111; letter-spacing: 0.02em;">
            ${test.title}
          </h2>
          <div style="font-size: 11px; font-weight: 600; color: #525252; margin-top: 2px;">
            Grade ${test.grade} (${test.stream || 'Science'}) • ${test.subject} • ${test.board.toUpperCase()} Curriculum ${test.chapter && test.chapter !== 'All' ? '• ' + test.chapter : ''}
          </div>
        </div>

        <!-- Student Metadata Table Box -->
        <div style="margin: 10px 0; padding: 8px 12px; background: #fafafa; border: 1px solid #d4d4d4; border-radius: 6px; font-size: 10.5px;">
          <div style="display: flex; justify-content: space-between; font-weight: 700; color: #374151; padding-bottom: 5px;">
            <div>Student Name: <span style="font-weight: 400; border-bottom: 1px solid #9ca3af; display: inline-block; width: 140px;">&nbsp;</span></div>
            <div>Roll No: <span style="font-weight: 400; border-bottom: 1px solid #9ca3af; display: inline-block; width: 100px;">&nbsp;</span></div>
            <div>Date: <span style="font-weight: 400;">${test.dueDate || new Date().toISOString().split('T')[0]}</span></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 700; color: #374151; padding-top: 5px; border-top: 1px solid #e5e5e5;">
            <div>Subject: <span style="color: #111111;">${test.subject}</span></div>
            <div>Time Allowed: <span style="color: #111111;">${test.timeAllowedMinutes} Mins</span></div>
            <div>Total Marks: <span style="color: #111111;">${test.totalMarks}</span></div>
          </div>
          ${
            test.instructions
              ? `<div style="font-size: 10px; color: #6b7280; font-style: italic; padding-top: 4px; margin-top: 4px; border-top: 1px solid #e5e5e5;">Instructions: ${test.instructions}</div>`
              : ''
          }
        </div>
      `;
    } else {
      // Compact official running header on subsequent pages
      headerEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #111111; padding-bottom: 6px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${logoDataUrl}" alt="SHS Logo" style="width: 22px; height: 22px; object-fit: contain; background: transparent;" crossOrigin="anonymous" />
            <span style="font-size: 11px; font-weight: 900; letter-spacing: -0.01em; color: #111111; text-transform: uppercase;">SHS VIRTUAL ACADEMY</span>
          </div>
          <div style="font-size: 10px; font-weight: 700; color: #404040; text-align: center; max-width: 360px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${test.subject} • Grade ${test.grade} • ${test.title}
          </div>
          <div style="font-size: 9.5px; font-weight: 800; color: #d97706;">
            Scholario • Dept of Examinations
          </div>
        </div>
      `;
    }
    pageEl.appendChild(headerEl);

    // 3. Main Question Content Container
    const contentEl = document.createElement('div');
    contentEl.className = 'shs-pdf-page-content';
    contentEl.style.position = 'relative';
    contentEl.style.zIndex = '10';
    contentEl.style.display = 'flex';
    contentEl.style.flexDirection = 'column';
    pageEl.appendChild(contentEl);

    // 4. Running Footer at bottom
    const footerEl = document.createElement('div');
    footerEl.style.position = 'absolute';
    footerEl.style.bottom = '16px';
    footerEl.style.left = '40px';
    footerEl.style.right = '40px';
    footerEl.style.borderTop = '1px solid #d4d4d4';
    footerEl.style.paddingTop = '6px';
    footerEl.style.display = 'flex';
    footerEl.style.justifyContent = 'space-between';
    footerEl.style.alignItems = 'center';
    footerEl.style.fontSize = '9px';
    footerEl.style.color = '#6b7280';
    footerEl.style.fontWeight = '600';
    footerEl.style.zIndex = '10';
    footerEl.innerHTML = `
      <div>SHS Virtual Academy • Confidential Examination Paper</div>
      <div class="pdf-page-number-indicator" data-page="${pageNum}">Page ${pageNum}</div>
      <div>Powered by Scholario LMS (scholario.me)</div>
    `;
    pageEl.appendChild(footerEl);

    renderRoot.appendChild(pageEl);

    const record: PageRecord = { pageEl, contentEl, pageNumber: pageNum };
    pages.push(record);
    return record;
  }

  let currentPage = createNewPage(1);

  /**
   * Appends an atomic block to the current page.
   * If the block overflows the remaining space on the current page,
   * it pushes the block (and any orphan section header) cleanly onto a fresh page.
   */
  function appendAtomicBlock(blockEl: HTMLElement) {
    currentPage.contentEl.appendChild(blockEl);

    const pageRect = currentPage.pageEl.getBoundingClientRect();
    const blockRect = blockEl.getBoundingClientRect();
    const blockBottomOffset = blockRect.bottom - pageRect.top;

    // Check if block overflows beyond the maximum page height allowance
    if (blockBottomOffset > MAX_CONTENT_BOTTOM_OFFSET) {
      currentPage.contentEl.removeChild(blockEl);

      // Prevent orphan section headers (a section header left at the bottom with no questions)
      let orphanHeader: HTMLElement | null = null;
      const lastChild = currentPage.contentEl.lastElementChild as HTMLElement | null;
      if (lastChild && lastChild.classList.contains('pdf-section-header-block')) {
        orphanHeader = currentPage.contentEl.removeChild(lastChild);
      }

      // Start fresh page
      currentPage = createNewPage(pages.length + 1);

      // Re-attach carried section header if any
      if (orphanHeader) {
        currentPage.contentEl.appendChild(orphanHeader);
      }

      // Append atomic block to new page
      currentPage.contentEl.appendChild(blockEl);
    }
  }

  // ==========================================
  // SECTION A: Multiple Choice Questions (MCQs)
  // ==========================================
  if (mcqs.length > 0) {
    const secLetter = sectionLetters[sectionLetterIdx++] || 'A';

    // Section A Header Block
    const secHeader = document.createElement('div');
    secHeader.className = 'pdf-section-header-block';
    secHeader.style.marginTop = '10px';
    secHeader.style.marginBottom = '6px';
    secHeader.innerHTML = `
      <div style="background: #111111; color: #ffffff; padding: 5px 10px; border-radius: 3px; display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 11px;">
        <span>SECTION – ${secLetter} : MULTIPLE CHOICE QUESTIONS (MCQs)</span>
        <span>[${mcqMarksTotal} Marks]</span>
      </div>
      <p style="font-size: 10px; color: #6b7280; font-style: italic; margin: 4px 0 6px 0;">
        Note: Attempt all questions. Each question carries ${test.mcqMarksEach || 1} mark.
      </p>
    `;
    appendAtomicBlock(secHeader);

    // Individual Atomic MCQ Blocks
    mcqs.forEach((mcq, idx) => {
      const qText = renderLaTeXToText(mcq.question);
      const isUrduQ = containsUrdu(qText) || isUrduSubject;
      const optA = renderLaTeXToText(mcq.options?.A || '');
      const optB = renderLaTeXToText(mcq.options?.B || '');
      const optC = renderLaTeXToText(mcq.options?.C || '');
      const optD = renderLaTeXToText(mcq.options?.D || '');

      const mcqEl = document.createElement('div');
      mcqEl.className = 'pdf-atomic-mcq-block';
      mcqEl.style.marginBottom = '6px';
      mcqEl.style.boxSizing = 'border-box';

      if (isUrduQ) {
        mcqEl.innerHTML = `
          <div dir="rtl" style="font-family: ${urduFontFamily}; text-align: right; padding: 6px 10px; background: rgba(250, 250, 250, 0.7); border: 1px solid #e5e5e5; border-radius: 4px;">
            <div style="font-weight: 700; font-size: 12.5px; color: #111111; line-height: 1.8;">
              سوال ۱. (${idx + 1})&nbsp;&nbsp;${qText}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin-top: 4px; font-size: 11.5px; color: #374151; padding-right: 12px; line-height: 1.6;">
              <div style="display: flex; align-items: flex-start; gap: 4px;"><strong style="color: #111111; shrink: 0;">(الف)</strong> <span>${optA}</span></div>
              <div style="display: flex; align-items: flex-start; gap: 4px;"><strong style="color: #111111; shrink: 0;">(ب)</strong> <span>${optB}</span></div>
              <div style="display: flex; align-items: flex-start; gap: 4px;"><strong style="color: #111111; shrink: 0;">(ج)</strong> <span>${optC}</span></div>
              <div style="display: flex; align-items: flex-start; gap: 4px;"><strong style="color: #111111; shrink: 0;">(د)</strong> <span>${optD}</span></div>
            </div>
          </div>
        `;
      } else {
        mcqEl.innerHTML = `
          <div dir="ltr" style="font-family: ${standardFontFamily}; text-align: left; padding: 6px 10px; background: rgba(250, 250, 250, 0.7); border: 1px solid #e5e5e5; border-radius: 4px;">
            <div style="font-weight: 800; font-size: 11px; color: #111111; line-height: 1.45;">
              Q1. (${idx + 1})&nbsp;&nbsp;${qText}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin-top: 4px; font-size: 10.5px; color: #374151; padding-left: 10px;">
              <div style="display: flex; align-items: flex-start; gap: 4px;"><strong style="color: #111111; shrink: 0;">(A)</strong> <span>${optA}</span></div>
              <div style="display: flex; align-items: flex-start; gap: 4px;"><strong style="color: #111111; shrink: 0;">(B)</strong> <span>${optB}</span></div>
              <div style="display: flex; align-items: flex-start; gap: 4px;"><strong style="color: #111111; shrink: 0;">(C)</strong> <span>${optC}</span></div>
              <div style="display: flex; align-items: flex-start; gap: 4px;"><strong style="color: #111111; shrink: 0;">(D)</strong> <span>${optD}</span></div>
            </div>
          </div>
        `;
      }

      appendAtomicBlock(mcqEl);
    });
  }

  // ==========================================
  // SECTION B: Short Answer Questions
  // ==========================================
  if (shortQuestions.length > 0) {
    const secLetter = sectionLetters[sectionLetterIdx++] || 'B';

    // Section B Header Block
    const secHeader = document.createElement('div');
    secHeader.className = 'pdf-section-header-block';
    secHeader.style.marginTop = '12px';
    secHeader.style.marginBottom = '6px';
    secHeader.innerHTML = `
      <div style="background: #111111; color: #ffffff; padding: 5px 10px; border-radius: 3px; display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 11px;">
        <span>SECTION – ${secLetter} : SHORT ANSWER QUESTIONS</span>
        <span>[${shortMarksTotal} Marks]</span>
      </div>
      <p style="font-size: 10px; color: #6b7280; font-style: italic; margin: 4px 0 6px 0;">
        Note: Attempt any ${test.shortAttemptCount || shortQuestions.length} questions. Each question carries ${test.shortMarksEach || 2} marks.
      </p>
    `;
    appendAtomicBlock(secHeader);

    // Individual Atomic Short Question Blocks
    shortQuestions.forEach((sq, idx) => {
      const roman = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'][idx] || `${idx + 1}`;
      const qText = renderLaTeXToText(sq.question);
      const isUrduQ = containsUrdu(qText) || isUrduSubject;
      const marks = sq.marks || test.shortMarksEach || 2;

      const sqEl = document.createElement('div');
      sqEl.className = 'pdf-atomic-short-block';
      sqEl.style.marginBottom = '6px';
      sqEl.style.boxSizing = 'border-box';

      if (isUrduQ) {
        sqEl.innerHTML = `
          <div dir="rtl" style="font-family: ${urduFontFamily}; display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; padding: 6px 10px; background: rgba(250, 250, 250, 0.7); border: 1px solid #e5e5e5; border-radius: 4px;">
            <div style="font-weight: 700; font-size: 12.5px; color: #111111; line-height: 1.8;">
              سوال ۲. (${roman})&nbsp;&nbsp;${qText}
            </div>
            <span style="font-size: 10px; font-weight: 700; color: #6b7280; white-space: nowrap; margin-top: 4px;">[${marks} Marks]</span>
          </div>
        `;
      } else {
        sqEl.innerHTML = `
          <div dir="ltr" style="font-family: ${standardFontFamily}; display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; padding: 6px 10px; background: rgba(250, 250, 250, 0.7); border: 1px solid #e5e5e5; border-radius: 4px;">
            <div style="font-weight: 800; font-size: 11px; color: #111111; line-height: 1.45;">
              Q2. (${roman})&nbsp;&nbsp;${qText}
            </div>
            <span style="font-size: 10px; font-weight: 700; color: #6b7280; white-space: nowrap;">[${marks} Marks]</span>
          </div>
        `;
      }

      appendAtomicBlock(sqEl);
    });
  }

  // ==========================================
  // SECTION C: Long / Detailed Questions
  // ==========================================
  if (longQuestions.length > 0) {
    const secLetter = sectionLetters[sectionLetterIdx++] || 'C';

    // Section C Header Block
    const secHeader = document.createElement('div');
    secHeader.className = 'pdf-section-header-block';
    secHeader.style.marginTop = '12px';
    secHeader.style.marginBottom = '6px';
    secHeader.innerHTML = `
      <div style="background: #111111; color: #ffffff; padding: 5px 10px; border-radius: 3px; display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 11px;">
        <span>SECTION – ${secLetter} : DETAILED / LONG QUESTIONS</span>
        <span>[${longMarksTotal} Marks]</span>
      </div>
      <p style="font-size: 10px; color: #6b7280; font-style: italic; margin: 4px 0 6px 0;">
        Note: Attempt any ${test.longAttemptCount || longQuestions.length} questions. Each question carries ${test.longMarksEach || 5} marks.
      </p>
    `;
    appendAtomicBlock(secHeader);

    // Individual Atomic Long Question Blocks (with sub-parts)
    longQuestions.forEach((lq, idx) => {
      const qText = renderLaTeXToText(lq.question);
      const isUrduQ = containsUrdu(qText) || isUrduSubject;
      const marks = lq.marks || test.longMarksEach || 5;

      const lqEl = document.createElement('div');
      lqEl.className = 'pdf-atomic-long-block';
      lqEl.style.marginBottom = '8px';
      lqEl.style.boxSizing = 'border-box';

      if (isUrduQ) {
        lqEl.innerHTML = `
          <div dir="rtl" style="font-family: ${urduFontFamily}; padding: 7px 10px; background: rgba(250, 250, 250, 0.7); border: 1px solid #e5e5e5; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; font-weight: 700; font-size: 12.5px; color: #111111; line-height: 1.8;">
              <div>سوال ${3 + idx}.&nbsp;&nbsp;${qText}</div>
              <span style="font-size: 10px; font-weight: 700; color: #6b7280; white-space: nowrap; margin-top: 4px;">[${marks} Marks]</span>
            </div>
            ${
              lq.parts && lq.parts.length > 0
                ? `<div style="padding-right: 14px; margin-top: 5px; display: flex; flex-direction: column; gap: 4px; font-size: 11.5px; color: #374151;">
                    ${lq.parts
                      .map(
                        (p) =>
                          `<div style="display: flex; justify-content: space-between;"><span>${p.label}&nbsp;${renderLaTeXToText(
                            p.text
                          )}</span><span style="color: #6b7280; font-size: 10px;">(${p.marks} Marks)</span></div>`
                      )
                      .join('')}
                  </div>`
                : ''
            }
          </div>
        `;
      } else {
        lqEl.innerHTML = `
          <div dir="ltr" style="font-family: ${standardFontFamily}; padding: 7px 10px; background: rgba(250, 250, 250, 0.7); border: 1px solid #e5e5e5; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; font-weight: 800; font-size: 11px; color: #111111; line-height: 1.45;">
              <div>Q${3 + idx}.&nbsp;&nbsp;${qText}</div>
              <span style="font-size: 10px; font-weight: 700; color: #6b7280; white-space: nowrap;">[${marks} Marks]</span>
            </div>
            ${
              lq.parts && lq.parts.length > 0
                ? `<div style="padding-left: 14px; margin-top: 5px; display: flex; flex-direction: column; gap: 4px; font-size: 10.5px; color: #374151;">
                    ${lq.parts
                      .map(
                        (p) =>
                          `<div style="display: flex; justify-content: space-between;"><span>${p.label}&nbsp;${renderLaTeXToText(
                            p.text
                          )}</span><span style="color: #6b7280; font-size: 10px;">(${p.marks} Marks)</span></div>`
                      )
                      .join('')}
                  </div>`
                : ''
            }
          </div>
        `;
      }

      appendAtomicBlock(lqEl);
    });
  }

  // ==========================================
  // ANSWER KEY & MARKING SCHEME (Atomic Panel)
  // ==========================================
  // Treated as an atomic unit: either fits entirely on current page or is pushed cleanly to a new page
  const answerKeyEl = document.createElement('div');
  answerKeyEl.className = 'pdf-atomic-answerkey-block';
  answerKeyEl.style.marginTop = '14px';
  answerKeyEl.style.paddingTop = '10px';
  answerKeyEl.style.borderTop = '2px dashed #f59e0b';
  answerKeyEl.style.boxSizing = 'border-box';
  answerKeyEl.innerHTML = `
    <div style="background: #d97706; color: #ffffff; padding: 4px 10px; border-radius: 3px; font-size: 10.5px; font-weight: 900; display: flex; justify-content: space-between; align-items: center;">
      <span>OFFICIAL ANSWER KEY & TEACHER MARKING SCHEME</span>
      <span style="font-size: 8.5px; text-transform: uppercase; background: #92400e; padding: 2px 6px; border-radius: 2px;">Confidential</span>
    </div>
    <div style="margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 10.5px;">
      ${
        mcqs.length > 0
          ? `<div style="padding: 8px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 4px;">
              <h5 style="margin: 0 0 5px 0; font-weight: 900; color: #92400e; font-size: 10.5px;">MCQ Answer Key</h5>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3px; font-size: 10px; color: #1f2937;">
                ${mcqs
                  .map(
                    (m, i) =>
                      `<div><strong>Q1.(${i + 1}):</strong> [${m.correctAnswer}]</div>`
                  )
                  .join('')}
              </div>
            </div>`
          : ''
      }
      ${
        shortQuestions.some((s) => s.modelAnswer)
          ? `<div style="padding: 8px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 4px;">
              <h5 style="margin: 0 0 5px 0; font-weight: 900; color: #92400e; font-size: 10.5px;">Short Question Model Answers</h5>
              <div style="display: flex; flex-direction: column; gap: 3px; font-size: 9.5px; color: #374151;">
                ${shortQuestions
                  .slice(0, 4)
                  .filter((s) => s.modelAnswer)
                  .map(
                    (s, i) =>
                      `<div><strong>(${i + 1}):</strong> ${renderLaTeXToText(s.modelAnswer)}</div>`
                  )
                  .join('')}
              </div>
            </div>`
          : ''
      }
    </div>
  `;
  appendAtomicBlock(answerKeyEl);

  // ==========================================
  // Update Running Page Counts on all Footers
  // ==========================================
  const totalPages = pages.length;
  pages.forEach((p, idx) => {
    const indicator = p.pageEl.querySelector('.pdf-page-number-indicator');
    if (indicator) {
      indicator.textContent = `Page ${idx + 1} of ${totalPages}`;
    }
  });

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Render each discreet A4 page individually
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      const pageEl = pages[i].pageEl;
      const pageCanvas = await html2canvas(pageEl, {
        scale: 2, // 2x DPI for crisp 300-DPI equivalent text & math
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(pageImgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    const blob = pdf.output('blob');
    const dataUrl = pdf.output('datauristring');
    const arrayBuffer = pdf.output('arraybuffer');

    return {
      blob,
      dataUrl,
      arrayBuffer,
      filename,
    };
  } finally {
    if (renderRoot.parentNode) {
      renderRoot.parentNode.removeChild(renderRoot);
    }
  }
}

/**
 * Server-safe fallback generator for Node environments
 */
async function generateTestPaperFallbackNodePDF(test: GeneratedTestSpecification, filename: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SHS VIRTUAL ACADEMY', 105, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.text(test.title || 'Examination Paper', 105, 28, { align: 'center' });

  doc.setFontSize(9);
  doc.text(`Subject: ${test.subject} • Grade: ${test.grade} • Marks: ${test.totalMarks}`, 105, 34, { align: 'center' });

  const blob = doc.output('blob');
  const dataUrl = doc.output('datauristring');
  const arrayBuffer = doc.output('arraybuffer');

  return {
    blob,
    dataUrl,
    arrayBuffer,
    filename,
  };
}

export default generateTestPaperPDF;
