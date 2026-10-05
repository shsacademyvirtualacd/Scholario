/**
 * Scholario Sage AI Document & Assessment PDF Generator
 *
 * Generates publication-ready, beautifully styled academic PDFs client-side (using jsPDF + html2canvas)
 * for:
 * - Quizzes and Multiple Choice Questions (MCQs)
 * - Worksheets & Practice Problems
 * - Detailed Chapter Notes & Revision Summaries
 * - Dual export: "Student Copy" (Zero answers in data model) vs "Teacher Copy" (With solutions & marking key)
 *
 * Guarantees:
 * - Mathematical notation rendered via KaTeX (fractions, radicals, overlines, sets ℝ, ℤ).
 * - Zero answers in Student Copy (answers array completely purged before rendering).
 * - Automatic page breaks with `break-inside: avoid` preventing cramped or cut questions.
 * - Conversational AI chatter and markdown artifacts stripped.
 * - Lightweight SVG branding watermark (zero lag, fast rendering).
 * - Blob / Object URL output for instant, buttery-smooth mobile preview.
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import katex from 'katex';
import {
  StructuredQuiz,
  parseQuizJsonOrMarkdown,
  sanitizeQuizForStudent,
} from './structuredQuizParser';
import { containsUrdu } from './urduReshaper';

export interface SagePdfOptions {
  teacherName?: string;
  subject?: string;
  className?: string;
  topic?: string;
  date?: string;
  mode?: 'student' | 'teacher'; // 'student' strips answers/solutions for quizzes/worksheets
  docType?: 'quiz' | 'lesson_plan' | 'worksheet' | 'notes' | 'general';
}

export interface GeneratedPdfResult {
  blob: Blob;
  dataUrl: string;
  filename: string;
  totalPages: number;
}

/**
 * Checks whether content appears to be an academic assessment/quiz/worksheet
 */
export function detectDocumentType(content: string): 'quiz' | 'lesson_plan' | 'worksheet' | 'notes' | 'general' {
  if (!content) return 'general';
  const lower = content.toLowerCase();
  if (/lesson\s*plan|learning\s*objectives|pedagogical|class\s*duration|instructional\s*plan/i.test(lower)) {
    return 'lesson_plan';
  }
  if (/(\b[0-9]+\.\s*.*\(?[A-Da-d]\)?)|mcqs?|multiple\s*choice|quiz|assessment/i.test(lower)) {
    return 'quiz';
  }
  if (/worksheet|exercise|practice\s*questions|fill\s*in\s*the\s*blanks?|solve\s*the\s*following/i.test(lower)) {
    return 'worksheet';
  }
  if (/notes|summary|revision|key\s*concepts|definition|overview|explanation/i.test(lower)) {
    return 'notes';
  }
  return 'general';
}

/**
 * Detects whether content has academic material suitable for PDF export
 */
export function hasAcademicContent(content: string): boolean {
  if (!content || content.length < 40) return false;
  const docType = detectDocumentType(content);
  if (docType !== 'general') return true;
  return /(?:\b[0-9]+[.:)]\s+)|(?:quiz|worksheet|lesson\s*plan|notes|exam|test|mcqs?|marking\s*scheme|chapter|definition|punnett)/i.test(
    content
  );
}

/**
 * Checks if content includes answers or solutions
 */
export function hasAnswerKeyOrSolutions(content: string): boolean {
  if (!content) return false;
  return /(?:answer\s*key|marking\s*scheme|solutions?|correct\s*answer|\(ans\b|ans:|answer:)/i.test(content);
}

/**
 * Detects if a user message is asking Sage to make/generate a PDF
 */
export function detectPdfRequest(prompt: string): boolean {
  if (!prompt) return false;
  return /\b(make\s*(this)?\s*(a\s*)?pdf|generate\s*(a\s*)?(worksheet\s*)?pdf|export\s*(to\s*)?pdf|download\s*(as\s*)?pdf|create\s*(a\s*)?pdf|pdf\s*format|save\s*(as\s*)?pdf)\b/i.test(
    prompt
  );
}

/**
 * Automatically extracts academic metadata (Subject, Class/Grade, Topic, etc.) from content
 */
export function extractAcademicMetadata(text: string, userFullName?: string): SagePdfOptions {
  let subject = 'Scholario Academic';
  if (/\bbiolog(y|ical)\b/i.test(text)) subject = 'Biology';
  else if (/\bphysic(s|al)\b/i.test(text)) subject = 'Physics';
  else if (/\bchemistr(y|ical)\b/i.test(text)) subject = 'Chemistry';
  else if (/\bmath(ematics)?|calculus|algebra|geometry|real\s*numbers\b/i.test(text)) subject = 'Mathematics';
  else if (/\benglish|comprehension|grammar\b/i.test(text)) subject = 'English';
  else if (/\burdu\b/i.test(text)) subject = 'Urdu';
  else if (/\bcomputer|programming|coding|cs\b/i.test(text)) subject = 'Computer Science';
  else if (/\bpakistan\s*studies|pak\s*study\b/i.test(text)) subject = 'Pakistan Studies';
  else if (/\bislamiat|islamic\s*studies\b/i.test(text)) subject = 'Islamiat';

  let className = 'Grade 9-10';
  const gradeMatch = text.match(/\b(?:grade|class)\s*(?:9th|10th|11th|12th|9|10|11|12|ix|x|xi|xii|ssc-?i+|hssc-?i+)\b/i);
  if (gradeMatch) {
    className = gradeMatch[0].replace(/\bgrade\b/i, 'Grade ').replace(/\bclass\b/i, 'Class ');
  }

  let topic = 'Academic Assessment & Revision Notes';
  const chapterMatch = text.match(/(?:chapter|unit|topic|lesson)\s*[:\-\s]*([^\n,\.]{4,60})/i);
  if (chapterMatch) {
    topic = chapterMatch[0].trim().replace(/^#+\s*/, '');
  } else {
    const firstHeading = text.match(/^#+\s*(.+)$/m);
    if (firstHeading) {
      topic = firstHeading[1].trim();
    }
  }

  return {
    subject,
    className,
    topic,
    teacherName: userFullName || 'Faculty Instructor',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    docType: detectDocumentType(text),
  };
}

/**
 * Render mathematical expressions using KaTeX and format typography.
 * Handles fractions, square roots, overlines for recurring decimals (e.g. 0.6̄),
 * and sets like ℝ, ℤ seamlessly.
 */
export function renderMathAndTypography(rawText: string | undefined | null): string {
  if (!rawText) return '';
  let str = String(rawText);

  // 1. Convert standard LaTeX math delimiters ($...$, $$...$$, \(...\), \[...\])
  str = str.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?!\$)[\s\S]*?\$|\\\([\s\S]*?\\\))/g, (match) => {
    let formula = '';
    let isBlock = false;
    if (match.startsWith('$$') && match.endsWith('$$')) {
      formula = match.slice(2, -2).trim();
      isBlock = true;
    } else if (match.startsWith('\\[') && match.endsWith('\\]')) {
      formula = match.slice(2, -2).trim();
      isBlock = true;
    } else if (match.startsWith('\\(') && match.endsWith('\\)')) {
      formula = match.slice(2, -2).trim();
    } else if (match.startsWith('$') && match.endsWith('$')) {
      formula = match.slice(1, -1).trim();
    }

    try {
      return katex.renderToString(formula, {
        displayMode: isBlock,
        throwOnError: false,
        output: 'html',
        strict: false,
      });
    } catch {
      return match;
    }
  });

  // 2. Render unwrapped standalone LaTeX math expressions (like \frac{3}{\sqrt{5}-\sqrt{2}}, \mathbb{R}, \mathbb{Z}, 0.\overline{6})
  if (
    /\\(?:frac|dfrac|tfrac|sqrt|mathbb|overline|times|pm|cdot|approx|neq|leq|geq|in|to)\b/.test(str) &&
    !str.includes('class="katex"')
  ) {
    str = str.replace(
      /(\\frac\s*\{[^{}]*\}\s*\{[^{}]*\}|\\sqrt\s*(?:\[[^\]]*\])?\{[^{}]*\}|\\mathbb\{[^{}]+\}|\\overline\{[^{}]+\}|\b\d+\s*\\cdot\s*\d+\b|\\pm|\\neq|\\leq|\\geq|\\times|\\approx)/g,
      (match) => {
        try {
          return katex.renderToString(match, {
            displayMode: false,
            throwOnError: false,
            output: 'html',
            strict: false,
          });
        } catch {
          return match;
        }
      }
    );
  }

  // 3. Genetics notations & chemistry subscripts: F_1 -> F₁, H2O -> H₂O, CO2 -> CO₂
  str = str.replace(/\bF_?1\b/g, 'F₁');
  str = str.replace(/\bF_?2\b/g, 'F₂');
  str = str.replace(/\bP_?1\b/g, 'P₁');
  str = str.replace(/\bH2O\b/g, 'H₂O');
  str = str.replace(/\bCO2\b/g, 'CO₂');

  // 4. Exponents shorthand: x^2 -> x², x^3 -> x³
  str = str.replace(/\^2\b/g, '²');
  str = str.replace(/\^3\b/g, '³');

  // 5. Code backticks
  str = str.replace(
    /`([^`]+)`/g,
    '<code style="background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-family: monospace; font-size: 9px; color: #0f172a;">$1</code>'
  );

  // 6. Markdown bold & italics
  str = str.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  str = str.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  str = str.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');
  str = str.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  str = str.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  str = str.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');

  // 7. Clean rogue markdown headers
  str = str.replace(/^#{1,6}\s*/g, '');

  return str;
}

/**
 * Lightweight SVG Watermark (avoids heavy 800KB base64 images that lag mobile preview)
 */
const SVG_WATERMARK_DATA = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360" viewBox="0 0 100 100" opacity="0.035"><polygon points="50,5 95,28 95,72 50,95 5,72 5,28" fill="%23111111"/><text x="50" y="58" font-family="sans-serif" font-size="28" font-weight="900" fill="%23F4C430" text-anchor="middle">SHS</text></svg>`;

/**
 * Generate client-side PDF from Sage AI message content
 */
export async function generateSageContentPdf(
  rawContent: string,
  options?: SagePdfOptions
): Promise<GeneratedPdfResult> {
  const mode = options?.mode || 'teacher';
  const autoMeta = extractAcademicMetadata(rawContent, options?.teacherName);

  const teacherName = options?.teacherName || autoMeta.teacherName || 'Faculty Mentor';
  const subject = options?.subject || autoMeta.subject || 'Scholario Academic';
  const className = options?.className || autoMeta.className || 'Grade 9-12';
  const topic = options?.topic || autoMeta.topic || 'Academic Assessment';
  const dateStr = options?.date || autoMeta.date || new Date().toISOString().split('T')[0];

  const sanitizeFilename = (s: string) => s.replace(/[\/\\?%*:|"<> ]/g, '_').slice(0, 25) || 'Academic';
  const copyLabel = mode === 'student' ? 'Student_Copy' : 'Teacher_Copy';
  const filename = `${sanitizeFilename(subject)}_${sanitizeFilename(className)}_${sanitizeFilename(topic)}_${copyLabel}.pdf`;

  // Parse structured assessment data
  const parsedQuiz = parseQuizJsonOrMarkdown(rawContent, {
    subject,
    className,
    topic,
    teacherName,
    date: dateStr,
  });

  // Strict enforcement: Student Copy template receives zero answers in data model
  const quizData: StructuredQuiz = mode === 'student' ? sanitizeQuizForStudent(parsedQuiz) : parsedQuiz;

  const PAGE_HEIGHT = 1123;
  const MAX_CONTENT_BOTTOM_OFFSET = 1040;
  const standardFontFamily = "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, sans-serif";
  const urduFontFamily = "'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif";

  // Create temporary hidden render root in DOM
  const renderRoot = document.createElement('div');
  renderRoot.id = 'sage-pdf-renderer-root';
  renderRoot.style.position = 'fixed';
  renderRoot.style.left = '-9999px';
  renderRoot.style.top = '0';
  renderRoot.style.width = '794px';
  renderRoot.style.backgroundColor = '#ffffff';
  renderRoot.style.zIndex = '-9999';
  document.body.appendChild(renderRoot);

  interface PageRecord {
    pageEl: HTMLDivElement;
    contentEl: HTMLDivElement;
    pageNumber: number;
  }
  const pages: PageRecord[] = [];

  function createNewPage(pageNum: number): PageRecord {
    const pageEl = document.createElement('div');
    pageEl.className = 'sage-pdf-page-container';
    pageEl.style.width = '794px';
    pageEl.style.height = `${PAGE_HEIGHT}px`;
    pageEl.style.minHeight = `${PAGE_HEIGHT}px`;
    pageEl.style.maxHeight = `${PAGE_HEIGHT}px`;
    pageEl.style.boxSizing = 'border-box';
    pageEl.style.position = 'relative';
    pageEl.style.backgroundColor = '#ffffff';
    pageEl.style.color = '#111111';
    pageEl.style.fontFamily = standardFontFamily;
    pageEl.style.padding = '28px 40px 42px 40px';
    pageEl.style.overflow = 'hidden';

    // 1. Lightweight Vector Watermark
    const watermarkEl = document.createElement('div');
    watermarkEl.style.position = 'absolute';
    watermarkEl.style.inset = '0';
    watermarkEl.style.display = 'flex';
    watermarkEl.style.alignItems = 'center';
    watermarkEl.style.justifyContent = 'center';
    watermarkEl.style.pointerEvents = 'none';
    watermarkEl.style.zIndex = '1';
    watermarkEl.innerHTML = `<img src="${SVG_WATERMARK_DATA}" alt="" style="width: 360px; height: 360px; object-fit: contain; pointer-events: none;" />`;
    pageEl.appendChild(watermarkEl);

    // 2. Header
    const headerEl = document.createElement('div');
    headerEl.style.position = 'relative';
    headerEl.style.zIndex = '10';

    const topBanner = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111111; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; background: #111111; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #F4C430; font-weight: 900; font-size: 16px; flex-shrink: 0;">
            SHS
          </div>
          <div>
            <h1 style="margin: 0; font-size: 15px; font-weight: 900; letter-spacing: -0.02em; color: #111111; text-transform: uppercase; line-height: 1.15;">
              SHS VIRTUAL ACADEMY
            </h1>
            <p style="margin: 2px 0 0 0; font-size: 9px; font-weight: 700; color: #525252; text-transform: uppercase; letter-spacing: 0.04em;">
              Scholario Sage v2.0 • Academic Testing & Assessment
            </p>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 13.5px; font-weight: 900; color: #111111; line-height: 1.15;">Scholario</div>
          <div style="font-size: 9px; font-weight: 700; color: #737373;">scholario.me</div>
          <div style="font-size: 8.5px; font-weight: 800; color: ${mode === 'student' ? '#059669' : '#d97706'}; text-transform: uppercase; margin-top: 1px;">
            ${mode === 'student' ? 'Student Edition (No Answers)' : 'Faculty & Teacher Copy (With Solutions)'}
          </div>
        </div>
      </div>
    `;

    if (pageNum === 1) {
      headerEl.innerHTML = `
        ${topBanner}
        <div style="text-align: center; padding: 7px 0; border-bottom: 1px solid #e5e5e5;">
          <h2 style="margin: 0; font-size: 14px; font-weight: 900; text-transform: uppercase; color: #111111; letter-spacing: 0.02em;">
            ${renderMathAndTypography(quizData.title)}
          </h2>
          <div style="font-size: 9.5px; font-weight: 600; color: #525252; margin-top: 2px;">
            ${quizData.subject} • ${quizData.grade} • Prepared by ${quizData.instructor}
          </div>
        </div>
        <div style="margin: 6px 0 8px 0; padding: 6px 12px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px; font-size: 9px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; color: #374151;">
          <div><strong>Subject:</strong> ${quizData.subject}</div>
          <div><strong>Grade:</strong> ${quizData.grade}</div>
          <div><strong>Total Marks:</strong> ${quizData.totalMarks || 20}</div>
          <div><strong>Time Allowed:</strong> ${quizData.timeAllowed || '45 Mins'}</div>
        </div>
        ${
          mode === 'student'
            ? `<div style="margin-bottom: 10px; padding: 6px 12px; background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 6px; font-size: 9.5px; display: flex; justify-content: space-between; color: #1e293b;">
                <div><strong>Student Name:</strong> _____________________________</div>
                <div><strong>Roll No:</strong> ______________</div>
                <div><strong>Date:</strong> ______________</div>
              </div>`
            : ''
        }
      `;
    } else {
      headerEl.innerHTML = `
        ${topBanner}
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 9px; font-weight: 700; color: #475569; margin-top: 4px; margin-bottom: 8px;">
          <span>${quizData.subject} • ${quizData.grade}</span>
          <span style="color: #0f172a; font-weight: 800;">${renderMathAndTypography(quizData.title)}</span>
          <span style="color: #94a3b8; font-size: 8px; font-weight: 700; text-transform: uppercase;">Continued</span>
        </div>
      `;
    }
    pageEl.appendChild(headerEl);

    // 3. Content layer
    const contentEl = document.createElement('div');
    contentEl.className = 'sage-pdf-page-content';
    contentEl.style.position = 'relative';
    contentEl.style.zIndex = '10';
    contentEl.style.display = 'flex';
    contentEl.style.flexDirection = 'column';
    pageEl.appendChild(contentEl);

    // 4. Footer
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
    footerEl.style.fontSize = '8.5px';
    footerEl.style.color = '#6b7280';
    footerEl.style.fontWeight = '600';
    footerEl.style.zIndex = '10';
    footerEl.innerHTML = `
      <div>SHS Virtual Academy • Sage AI Academic Resources</div>
      <div class="pdf-page-number-indicator" data-page="${pageNum}">Page ${pageNum}</div>
      <div>Scholario Platform (scholario.me)</div>
    `;
    pageEl.appendChild(footerEl);

    renderRoot.appendChild(pageEl);
    const rec: PageRecord = { pageEl, contentEl, pageNumber: pageNum };
    pages.push(rec);
    return rec;
  }

  let currentPage = createNewPage(1);

  function appendBlock(blockEl: HTMLElement) {
    currentPage.contentEl.appendChild(blockEl);
    const pageRect = currentPage.pageEl.getBoundingClientRect();
    const blockRect = blockEl.getBoundingClientRect();
    const blockBottomOffset = blockRect.bottom - pageRect.top;

    if (blockBottomOffset > MAX_CONTENT_BOTTOM_OFFSET) {
      currentPage.contentEl.removeChild(blockEl);
      currentPage = createNewPage(pages.length + 1);
      currentPage.contentEl.appendChild(blockEl);
    }
  }

  // ── Render Sections & Questions ──
  for (const section of quizData.sections) {
    if (section.questions.length === 0) continue;

    const secHeader = document.createElement('div');
    secHeader.style.boxSizing = 'border-box';
    secHeader.style.breakInside = 'avoid';
    secHeader.style.pageBreakInside = 'avoid';
    secHeader.style.marginTop = '8px';
    secHeader.style.marginBottom = '6px';
    secHeader.innerHTML = `
      <div style="font-weight: 800; font-size: 10.5px; text-transform: uppercase; background: #111111; color: #ffffff; padding: 4px 10px; border-radius: 4px; letter-spacing: 0.02em; display: flex; justify-content: space-between;">
        <span>${renderMathAndTypography(section.name)}</span>
        ${section.marks ? `<span>[${section.marks} Marks]</span>` : ''}
      </div>
    `;
    appendBlock(secHeader);

    for (const q of section.questions) {
      const qBlock = document.createElement('div');
      qBlock.style.boxSizing = 'border-box';
      qBlock.style.breakInside = 'avoid';
      qBlock.style.pageBreakInside = 'avoid';
      qBlock.style.marginBottom = '8px';
      qBlock.style.padding = '8px 12px';
      qBlock.style.background = '#ffffff';
      qBlock.style.border = '1px solid #e2e8f0';
      qBlock.style.borderRadius = '6px';
      qBlock.style.fontSize = '9.5px';

      const isUrdu = containsUrdu(q.text);
      if (isUrdu) {
        qBlock.dir = 'rtl';
        qBlock.style.fontFamily = urduFontFamily;
        qBlock.style.textAlign = 'right';
      }

      if (q.type === 'mcq' && q.options) {
        qBlock.innerHTML = `
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px; line-height: 1.45;">
            <strong>${q.number}.</strong> ${renderMathAndTypography(q.text)}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; padding: 6px 10px; background: #f8fafc; border-radius: 4px; border: 1px solid #f1f5f9;">
            <div><strong>(A)</strong> ${renderMathAndTypography(q.options.A)}</div>
            <div><strong>(B)</strong> ${renderMathAndTypography(q.options.B)}</div>
            <div><strong>(C)</strong> ${renderMathAndTypography(q.options.C)}</div>
            <div><strong>(D)</strong> ${renderMathAndTypography(q.options.D)}</div>
          </div>
        `;
      } else {
        // Short / descriptive question
        qBlock.innerHTML = `
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px; line-height: 1.45;">
            <strong>${q.number}.</strong> ${renderMathAndTypography(q.text)}
          </div>
          ${
            mode === 'student'
              ? `<div style="margin-top: 6px; min-height: 48px; border: 1px dashed #cbd5e1; border-radius: 4px; background: #fafafa; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; font-style: italic;">
                  Student Answer / Working Space
                </div>`
              : ''
          }
        `;
      }

      appendBlock(qBlock);
    }
  }

  // ── Render Solutions (FACULTY / TEACHER COPY ONLY) ──
  if (mode === 'teacher' && quizData.answers && quizData.answers.length > 0) {
    const ansHeader = document.createElement('div');
    ansHeader.style.boxSizing = 'border-box';
    ansHeader.style.breakInside = 'avoid';
    ansHeader.style.pageBreakInside = 'avoid';
    ansHeader.style.marginTop = '12px';
    ansHeader.style.marginBottom = '8px';
    ansHeader.innerHTML = `
      <div style="font-weight: 900; font-size: 11px; text-transform: uppercase; background: #111111; color: #F4C430; padding: 6px 12px; border-radius: 4px; letter-spacing: 0.03em;">
        OFFICIAL ANSWER KEY & STEP-BY-STEP SOLUTIONS
      </div>
    `;
    appendBlock(ansHeader);

    for (const ans of quizData.answers) {
      const ansBlock = document.createElement('div');
      ansBlock.style.boxSizing = 'border-box';
      ansBlock.style.breakInside = 'avoid';
      ansBlock.style.pageBreakInside = 'avoid';
      ansBlock.style.marginBottom = '8px';
      ansBlock.style.padding = '8px 12px';
      ansBlock.style.background = '#f0fdf4';
      ansBlock.style.border = '1px solid #bbf7d0';
      ansBlock.style.borderRadius = '6px';
      ansBlock.style.fontSize = '9.5px';

      const stepsHtml = ans.steps && ans.steps.length > 0
        ? `<div style="margin-top: 5px; padding-left: 8px; border-left: 2px solid #86efac; font-size: 9px; color: #166534;">
            ${ans.steps.map((st, sIdx) => `<div style="margin-bottom: 2px;"><strong>Step ${sIdx + 1}:</strong> ${renderMathAndTypography(st.replace(/^step\s*[0-9]+:?\s*/i, ''))}</div>`).join('')}
          </div>`
        : '';

      ansBlock.innerHTML = `
        <div style="display: flex; align-items: baseline; gap: 8px; font-weight: 800; color: #15803d; margin-bottom: 3px;">
          <span>Question ${ans.questionNumber}:</span>
          <span style="background: #dcfce7; padding: 1px 6px; border-radius: 4px; border: 1px solid #86efac; font-family: monospace;">${renderMathAndTypography(ans.answer)}</span>
        </div>
        ${ans.explanation ? `<div style="color: #166534; font-size: 9px; line-height: 1.4;">${renderMathAndTypography(ans.explanation)}</div>` : ''}
        ${stepsHtml}
      `;

      appendBlock(ansBlock);
    }
  }

  // Update total page numbers across all rendered pages
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

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage();
      const pageEl = pages[i].pageEl;
      const pageCanvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: PAGE_HEIGHT,
      });
      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(pageImgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    const blob = pdf.output('blob');
    // Use fast native Object URL instead of multi-megabyte base64 string
    const dataUrl = URL.createObjectURL(blob);

    return {
      blob,
      dataUrl,
      filename,
      totalPages,
    };
  } finally {
    if (renderRoot.parentNode) {
      renderRoot.parentNode.removeChild(renderRoot);
    }
  }
}

/**
 * Downloads generated PDF directly in browser
 */
export async function downloadSagePdf(rawContent: string, options?: SagePdfOptions): Promise<string> {
  const result = await generateSageContentPdf(rawContent, options);
  const a = document.createElement('a');
  a.href = result.dataUrl;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(result.dataUrl), 10000);
  return result.filename;
}

/**
 * Helper to revoke object URL when a preview modal is closed
 */
export function revokeSagePdfUrl(url?: string): void {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
}
