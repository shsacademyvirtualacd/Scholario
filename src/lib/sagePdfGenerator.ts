/**
 * Scholario Sage AI Document & Content PDF Generator
 *
 * Generates publication-ready, beautifully styled academic PDFs client-side (using jsPDF + html2canvas)
 * for:
 * - Quizzes and Multiple Choice Questions (MCQs)
 * - Worksheets & Practice Problems
 * - Lesson Plans
 * - Detailed Chapter Notes & Revision Summaries
 * - Answer Keys & Marking Schemes
 *
 * Supports:
 * - Official Scholario & SHS Academy branding, logo, metadata
 * - Clean typography without raw markdown formatting (**, ###, etc.)
 * - Proper scientific/genetics/math notation (Tt, F₁, %, exponents, formulas, Punnett squares)
 * - Urdu RTL script with appropriate font fallbacks
 * - Automatic page breaks preventing broken questions/sections
 * - Dual export: "Student Copy" (without answers) vs "Teacher Copy" (with answers & explanations)
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { getShsLogoDataUrl } from './testPdfGenerator';
import { renderLaTeXToText } from './latexRenderer';
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
 * Checks whether content appears to be an academic assessment/quiz/worksheet/lesson plan/notes
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
  return /(?:\b[0-9]+[.:)]\s+)|(?:quiz|worksheet|lesson\s*plan|notes|exam|test|mcqs?|marking\s*scheme|chapter|definition|punnett)/i.test(content);
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
  return /\b(make\s*(this)?\s*(a\s*)?pdf|generate\s*(a\s*)?(worksheet\s*)?pdf|export\s*(to\s*)?pdf|download\s*(as\s*)?pdf|create\s*(a\s*)?pdf|pdf\s*format|save\s*(as\s*)?pdf)\b/i.test(prompt);
}

/**
 * Automatically extracts academic metadata (Subject, Class/Grade, Topic, etc.) from content
 */
export function extractAcademicMetadata(text: string, userFullName?: string): SagePdfOptions {
  let subject = 'Scholario Academic';
  if (/\bbiolog(y|ical)\b/i.test(text)) subject = 'Biology';
  else if (/\bphysic(s|al)\b/i.test(text)) subject = 'Physics';
  else if (/\bchemistr(y|ical)\b/i.test(text)) subject = 'Chemistry';
  else if (/\bmath(ematics)?|calculus|algebra|geometry\b/i.test(text)) subject = 'Mathematics';
  else if (/\benglish|comprehension|grammar\b/i.test(text)) subject = 'English';
  else if (/\burdu\b/i.test(text)) subject = 'Urdu';
  else if (/\bcomputer|programming|coding|cs\b/i.test(text)) subject = 'Computer Science';
  else if (/\bpakistan\s*studies|pak\s*study\b/i.test(text)) subject = 'Pakistan Studies';
  else if (/\bislamiat|islamic\s*studies\b/i.test(text)) subject = 'Islamiat';

  let className = 'Grade 9';
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
 * Format inline typography:
 * Converts markdown bold, italic, code, math/genetics notation (Tt, F₁, %, exponents)
 * into pristine HTML spans while stripping rogue markdown characters.
 */
export function formatInlineTypography(text: string): string {
  if (!text) return '';

  let formatted = text;

  // 1. Process LaTeX delimiters with renderer
  formatted = renderLaTeXToText(formatted);

  // 2. Genetics notations: F_1 -> F₁, F_2 -> F₂, P_1 -> P₁
  formatted = formatted.replace(/\bF_?1\b/g, 'F₁');
  formatted = formatted.replace(/\bF_?2\b/g, 'F₂');
  formatted = formatted.replace(/\bP_?1\b/g, 'P₁');
  formatted = formatted.replace(/\b([TtBbAaPpRr])_([0-9]+)\b/g, '$1<sub>$2</sub>');

  // 3. Mathematical superscripts / subscripts: x^2 -> x², x^3 -> x³, H2O, CO2
  formatted = formatted.replace(/\^2\b/g, '²');
  formatted = formatted.replace(/\^3\b/g, '³');
  formatted = formatted.replace(/\bH2O\b/g, 'H₂O');
  formatted = formatted.replace(/\bCO2\b/g, 'CO₂');

  // 4. Inline code blocks
  formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-family: monospace; font-size: 9px; color: #0f172a;">$1</code>');

  // 5. Bold: **text** or __text__ -> <strong>text</strong>
  formatted = formatted.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');
  formatted = formatted.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // 6. Italic: *text* or _text_ -> <em>text</em>
  formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  formatted = formatted.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');

  // 7. Strip leftover rogue markers
  formatted = formatted.replace(/^#{1,6}\s*/g, '');
  formatted = formatted.replace(/\*{2,}/g, '');

  return formatted;
}

/**
 * Clean plain text (strips markdown symbols completely for plain headings/meta)
 */
export function cleanMarkdownForPdf(md: string): string {
  if (!md) return '';
  return md
    .replace(/```[a-zA-Z]*\n([\s\S]*?)\n```/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/___([^_]+)___/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[•*]\s+/gm, '• ')
    .trim();
}

/**
 * Parses markdown text into structured sections and question blocks
 */
export interface ParsedTableData {
  headers: string[];
  rows: string[][];
}

export interface ParsedBlock {
  type: 'heading' | 'subheading' | 'paragraph' | 'mcq' | 'question' | 'answer_key' | 'table' | 'bullet_list';
  title?: string;
  content: string;
  isUrdu?: boolean;
  options?: { A: string; B: string; C: string; D: string };
  answer?: string;
  explanation?: string;
  tableData?: ParsedTableData;
}

export function parseContentForPdf(content: string, mode: 'student' | 'teacher'): ParsedBlock[] {
  const lines = content.split('\n');
  const blocks: ParsedBlock[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push({
        type: 'bullet_list',
        content: currentList.join('\n'),
        isUrdu: containsUrdu(currentList.join(' ')),
      });
      currentList = [];
    }
  };

  let inAnswerKeySection = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // ── 1. Check for Table Row (starts and ends with '|') ──
    if (line.startsWith('|') && line.endsWith('|')) {
      flushList();
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      i--; // adjust loop counter

      if (tableLines.length >= 2) {
        // First line is header
        const rawHeaders = tableLines[0].split('|').map((s) => s.trim()).filter((_cell, idx, arr) => idx > 0 && idx < arr.length - 1);
        // Look for separator
        let bodyStartIndex = 1;
        if (tableLines[1].replace(/[\s|\-:]/g, '') === '') {
          bodyStartIndex = 2;
        }
        const rows: string[][] = [];
        for (let r = bodyStartIndex; r < tableLines.length; r++) {
          const cells = tableLines[r].split('|').map((s) => s.trim()).filter((_cell, idx, arr) => idx > 0 && idx < arr.length - 1);
          if (cells.length > 0) {
            rows.push(cells);
          }
        }

        blocks.push({
          type: 'table',
          content: 'Table',
          tableData: {
            headers: rawHeaders,
            rows,
          },
        });
        continue;
      }
    }

    // ── 2. Check for Answer Key Header ──
    if (/^(#*\s*)?(answer\s*key|marking\s*scheme|solutions?|answers?):?/i.test(line)) {
      flushList();
      inAnswerKeySection = true;
      if (mode === 'teacher') {
        blocks.push({
          type: 'heading',
          title: 'OFFICIAL ANSWER KEY & MARKING SCHEME',
          content: 'Verified solutions, pedagogical marking criteria, and grading keys',
        });
      }
      continue;
    }

    // If student copy and we've reached the answer key, omit entire section
    if (inAnswerKeySection && mode === 'student') {
      continue;
    }

    // ── 3. Check Headings ──
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const title = cleanMarkdownForPdf(headingMatch[2]);
      blocks.push({
        type: level === 1 ? 'heading' : 'subheading',
        title,
        content: title,
        isUrdu: containsUrdu(title),
      });
      continue;
    }

    // ── 4. Check Bullet or Numbered List ──
    if (/^[-*•]\s+/.test(line)) {
      const itemText = line.replace(/^[-*•]\s+/, '');
      currentList.push(itemText);
      continue;
    }

    // ── 5. Check for MCQ Question (e.g., "1. What is..." or "Q1. ...") ──
    const mcqMatch = line.match(/^(\*{0,2}(?:Q\s*)?[0-9]+[.:)]\s*\*{0,2})\s*(.+)$/i);
    if (mcqMatch && i + 1 < lines.length) {
      let lookahead = i + 1;
      const opts: Record<string, string> = {};
      let inlineAnswer = '';
      let inlineExplanation = '';

      while (lookahead < lines.length && lookahead <= i + 8) {
        const nextL = lines[lookahead].trim();
        const optMatch = nextL.match(/^\(?([A-Da-d])[\).:\-]\s*(.+)$/);
        const ansMatch = nextL.match(/^(?:correct\s*)?ans(?:wer)?:?\s*(.+)$/i);
        const expMatch = nextL.match(/^explanation:?\s*(.+)$/i);

        if (optMatch) {
          opts[optMatch[1].toUpperCase()] = optMatch[2];
          lookahead++;
        } else if (ansMatch) {
          inlineAnswer = ansMatch[1];
          lookahead++;
        } else if (expMatch) {
          inlineExplanation = expMatch[1];
          lookahead++;
        } else if (nextL === '') {
          lookahead++;
        } else {
          break;
        }
      }

      if (Object.keys(opts).length >= 2) {
        flushList();
        i = lookahead - 1; // Advance loop
        const qNum = mcqMatch[1].replace(/[*.:)]/g, '').trim();
        const qText = mcqMatch[2];

        blocks.push({
          type: 'mcq',
          title: `Question ${qNum}`,
          content: qText,
          isUrdu: containsUrdu(qText),
          options: {
            A: opts.A || '',
            B: opts.B || '',
            C: opts.C || '',
            D: opts.D || '',
          },
          answer: mode === 'teacher' ? inlineAnswer : undefined,
          explanation: mode === 'teacher' ? inlineExplanation : undefined,
        });
        continue;
      }
    }

    // ── 6. Standard Numbered Question ──
    if (mcqMatch) {
      flushList();
      const qNum = mcqMatch[1].replace(/[*.:)]/g, '').trim();
      const qText = mcqMatch[2];
      blocks.push({
        type: 'question',
        title: `Q${qNum}.`,
        content: qText,
        isUrdu: containsUrdu(qText),
      });
      continue;
    }

    // ── 7. Regular Paragraph ──
    flushList();
    if (line) {
      // In student mode, if an isolated paragraph says "Answer: B", skip it
      if (mode === 'student' && /^(?:correct\s*)?ans(?:wer)?:/i.test(line)) {
        continue;
      }
      blocks.push({
        type: inAnswerKeySection ? 'answer_key' : 'paragraph',
        content: line,
        isUrdu: containsUrdu(line),
      });
    }
  }

  flushList();
  return blocks;
}

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

  const sanitize = (s: string) => s.replace(/[\/\\?%*:|"<> ]/g, '_').slice(0, 25) || 'Academic';
  const copyLabel = mode === 'student' ? 'Student_Copy' : 'Teacher_Copy';
  const filename = `${sanitize(subject)}_${sanitize(className)}_${sanitize(topic)}_${copyLabel}.pdf`;

  const logoDataUrl = await getShsLogoDataUrl();

  const PAGE_HEIGHT = 1123;
  const MAX_CONTENT_BOTTOM_OFFSET = 1055;
  const urduFontFamily = "'Noto Nastaliq Urdu', 'Noto Naskh Arabic', 'Jameel Noori Nastaleeq', serif";
  const standardFontFamily = "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, sans-serif";

  // Create temporary render root in DOM
  const renderRoot = document.createElement('div');
  renderRoot.id = 'sage-pdf-renderer-root';
  renderRoot.style.position = 'fixed';
  renderRoot.style.left = '0';
  renderRoot.style.top = '0';
  renderRoot.style.width = '794px';
  renderRoot.style.backgroundColor = '#ffffff';
  renderRoot.style.opacity = '0.001';
  renderRoot.style.pointerEvents = 'none';
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
    pageEl.style.padding = '28px 40px 44px 40px';
    pageEl.style.overflow = 'hidden';

    // 1. Watermark
    const watermarkEl = document.createElement('div');
    watermarkEl.style.position = 'absolute';
    watermarkEl.style.inset = '0';
    watermarkEl.style.display = 'flex';
    watermarkEl.style.alignItems = 'center';
    watermarkEl.style.justifyContent = 'center';
    watermarkEl.style.pointerEvents = 'none';
    watermarkEl.style.opacity = '0.035';
    watermarkEl.style.zIndex = '1';
    watermarkEl.innerHTML = `<img src="${logoDataUrl}" alt="" style="width: 440px; height: 440px; object-fit: contain; filter: grayscale(100%); background: transparent;" />`;
    pageEl.appendChild(watermarkEl);

    // 2. Header
    const headerEl = document.createElement('div');
    headerEl.style.position = 'relative';
    headerEl.style.zIndex = '10';

    const topBanner = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111111; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <img src="${logoDataUrl}" alt="Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
          <div>
            <h1 style="margin: 0; font-size: 15px; font-weight: 900; letter-spacing: -0.02em; color: #111111; text-transform: uppercase; line-height: 1.15;">
              SHS VIRTUAL ACADEMY
            </h1>
            <p style="margin: 2px 0 0 0; font-size: 9px; font-weight: 700; color: #525252; text-transform: uppercase; letter-spacing: 0.04em;">
              Scholario Sage v2.0 • Academic Resources
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
            ${formatInlineTypography(topic)}
          </h2>
          <div style="font-size: 10px; font-weight: 600; color: #525252; margin-top: 2px;">
            ${subject} • ${className} • Prepared by ${teacherName}
          </div>
        </div>
        <div style="margin: 8px 0 10px 0; padding: 6px 12px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px; font-size: 9.5px; display: flex; justify-content: space-between; color: #374151;">
          <div><strong>Subject:</strong> ${subject}</div>
          <div><strong>Class / Grade:</strong> ${className}</div>
          <div><strong>Date:</strong> ${dateStr}</div>
          <div><strong>Instructor:</strong> ${teacherName}</div>
        </div>
      `;
    } else {
      headerEl.innerHTML = `
        ${topBanner}
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 9.5px; font-weight: 700; color: #475569; margin-top: 4px; margin-bottom: 8px;">
          <span>${subject} • ${className}</span>
          <span style="color: #0f172a; font-weight: 800;">${formatInlineTypography(topic)}</span>
          <span style="color: #94a3b8; font-size: 8.5px; font-weight: 700; text-transform: uppercase;">Continued</span>
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

  // Parse markdown content into atomic DOM elements
  const blocks = parseContentForPdf(rawContent, mode);

  for (const b of blocks) {
    const el = document.createElement('div');
    el.style.boxSizing = 'border-box';
    el.style.marginBottom = '6px';

    const isUrdu = b.isUrdu || containsUrdu(b.content);
    if (isUrdu) {
      el.dir = 'rtl';
      el.style.fontFamily = urduFontFamily;
      el.style.textAlign = 'right';
      el.style.lineHeight = '1.8';
    } else {
      el.dir = 'ltr';
      el.style.fontFamily = standardFontFamily;
      el.style.textAlign = 'left';
      el.style.lineHeight = '1.5';
    }

    if (b.type === 'heading') {
      el.style.marginTop = '10px';
      el.style.marginBottom = '6px';
      el.innerHTML = `
        <div style="background: #111111; color: #ffffff; padding: 5px 10px; border-radius: 4px; font-weight: 800; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.02em;">
          ${formatInlineTypography(b.title || '')}
        </div>
      `;
    } else if (b.type === 'subheading') {
      el.style.marginTop = '8px';
      el.style.marginBottom = '4px';
      el.innerHTML = `
        <div style="font-weight: 800; font-size: 11px; color: #111111; border-bottom: 1.5px solid #d4d4d4; padding-bottom: 2px;">
          ${formatInlineTypography(b.title || '')}
        </div>
      `;
    } else if (b.type === 'table' && b.tableData) {
      const { headers, rows } = b.tableData;
      let tableHtml = `
        <div style="margin: 6px 0; overflow: hidden; border: 1px solid #cbd5e1; border-radius: 6px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; text-align: left;">
            <thead style="background: #f1f5f9; border-bottom: 1.5px solid #cbd5e1;">
              <tr>
                ${headers.map((h) => `<th style="padding: 5px 8px; font-weight: 800; color: #0f172a; border-right: 1px solid #cbd5e1; last-child: border-right: none;">${formatInlineTypography(h)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map((row, rIdx) => `
                <tr style="background: ${rIdx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                  ${row.map((cell) => `<td style="padding: 4px 8px; color: #334155; border-right: 1px solid #e2e8f0; last-child: border-right: none;">${formatInlineTypography(cell)}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      el.innerHTML = tableHtml;
    } else if (b.type === 'mcq' && b.options) {
      const qText = formatInlineTypography(b.content);
      const optA = formatInlineTypography(b.options.A);
      const optB = formatInlineTypography(b.options.B);
      const optC = formatInlineTypography(b.options.C);
      const optD = formatInlineTypography(b.options.D);

      let answerHtml = '';
      if (mode === 'teacher' && b.answer) {
        answerHtml = `
          <div style="margin-top: 5px; padding: 4px 8px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 4px; font-size: 9.5px; color: #065f46;">
            <strong>Correct Answer:</strong> ${formatInlineTypography(b.answer)}
            ${b.explanation ? `<span style="margin-left: 8px; color: #047857;">• ${formatInlineTypography(b.explanation)}</span>` : ''}
          </div>
        `;
      }

      el.innerHTML = `
        <div style="padding: 7px 10px; background: rgba(250, 250, 250, 0.85); border: 1px solid #e5e5e5; border-radius: 4px; font-size: 10px;">
          <div style="font-weight: 800; color: #111111; margin-bottom: 5px;">
            ${b.title}: ${qText}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; font-size: 9.5px; color: #374151; padding-left: 6px;">
            <div><strong>(A)</strong> ${optA}</div>
            <div><strong>(B)</strong> ${optB}</div>
            <div><strong>(C)</strong> ${optC}</div>
            <div><strong>(D)</strong> ${optD}</div>
          </div>
          ${answerHtml}
        </div>
      `;
    } else if (b.type === 'question') {
      const qText = formatInlineTypography(b.content);
      el.innerHTML = `
        <div style="padding: 6px 10px; background: #ffffff; border-left: 3px solid #111111; border: 1px solid #e5e5e5; border-left-width: 3px; border-radius: 3px; font-size: 10px;">
          <strong style="color: #111111;">${b.title}</strong> ${qText}
        </div>
      `;
    } else if (b.type === 'bullet_list') {
      const items = b.content.split('\n');
      el.innerHTML = `
        <ul style="margin: 2px 0; padding-left: 18px; font-size: 9.5px; color: #262626; line-height: 1.55;">
          ${items.map((it) => `<li style="margin-bottom: 2px;">${formatInlineTypography(it)}</li>`).join('')}
        </ul>
      `;
    } else {
      // Paragraph or note line
      const cleanLine = formatInlineTypography(b.content);
      el.innerHTML = `
        <p style="margin: 0; font-size: 9.5px; color: #262626; line-height: 1.55;">
          ${cleanLine}
        </p>
      `;
    }

    appendBlock(el);
  }

  // Update total page numbers
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
    const dataUrl = pdf.output('datauristring');

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
  const downloadUrl = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
  return result.filename;
}
