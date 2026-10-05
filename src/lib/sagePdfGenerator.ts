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
 * - Official SHS Virtual Academy logo image rendered in header with CORS and decode wait.
 * - KaTeX CSS imported and all KaTeX fonts preloaded/awaited prior to html2canvas capture.
 * - Mathematical notation rendered at high resolution (font-size ≥ 12pt, html2canvas scale: 3, #ffffff).
 * - Complete delimiter and LaTeX sanitization (no broken raw delimiters or malformed options).
 * - Sequential numbering (1..N) with exact matching Total Marks.
 * - 2-column option grid with min-width: 0, word-break, and overflow-wrap: anywhere (no clipping).
 * - Real pagination splitting only at atomic question blocks with "Page X of Y" footer.
 */

import 'katex/dist/katex.min.css';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import katex from 'katex';
import {
  StructuredQuiz,
  parseQuizJsonOrMarkdown,
  sanitizeQuizForStudent,
  sanitizeMathAndDelimiters,
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

export const SHS_OFFICIAL_LOGO_URL =
  'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000c0808211bef4c03788e5a2c5.png';
export const SHS_LOCAL_LOGO_PATH = '/images/shs-academy-logo.png';
export const SHS_EMBEDDED_LOGO_SVG_DATA =
  'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgdmlld0JveD0iMCAwIDIwNDggMjA0OCIgd2lkdGg9IjEwMjQiIGhlaWdodD0iMTAyNCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+CjxyZWN0IHdpZHRoPSIyMDQ4IiBoZWlnaHQ9IjIwNDgiIHJ4PSIzNjQiIGZpbGw9InJnYigxNiwxNiwxNykiLz4KPHBhdGggdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwwKSIgZmlsbD0icmdiKDIzOSwxNjksMjIpIiBkPSJNIDkyMC4yODcgMTI2My4xNSBDIDg5Ny4zNTQgMTI0MC41NSA4NTYuNzQyIDEyMDkuNDMgODMwLjg5OCAxMTg4LjMzIEwgNjc1LjQ2OSAxMDYxLjE5IEMgNjM1LjQwMSAxMDI4LjQ2IDU4Ny45OTcgOTk0LjQ4MSA1NTkuNDM2IDk1MS44NzIgQyA1MzMuMTEgOTEyLjU5NiA1MTguNTIzIDg2My44MjkgNTE4LjE4NCA4MTYuNjkyIEMgNTE3LjYyNiA3NDYuNjAxIDU0NS4wNjggNjc5LjE4NiA1OTQuNDIgNjI5LjQxMSBDIDYwNi4zNDggNjE3LjM1NSA2MTkuNzg3IDYwNi42NCA2MzMuMjg5IDU5Ni40IEMgNTk1Ljk5OCA2NTIuMTQyIDU5OC45NjMgNzE3LjYwNSA2MzcuOTU4IDc3MS4yODggQyA2NzYuMDc2IDgyMy43NjQgNzMxLjIwOCA4NjMuMjc3IDc4MC44OTUgOTA0LjM1IEwgMTAwMy45NSAxMDg3LjUyIEMgMTAzNC4zNiAxMTEyLjUxIDEwNzkuMjYgMTE0NS43IDExMDIuMSAxMTc2LjM4IEMgMTE1NC41MyAxMjQ2Ljc4IDExNjIuNjYgMTMzNC4xNSAxMTEzLjQgMTQwOC44MyBDIDEwOTIuMjkgMTQ0MC44MyAxMDQzLjE2IDE0ODUuMTQgMTAwOC4yNCAxNTAxLjc1IEMgMTAwOC4yNiAxNTAwLjMxIDEwMDguMjcgMTQ5OC44MiAxMDA5LjMxIDE0OTcuNjYgQyAxMDQ0LjQzIDE0NTguNjIgMTA1NS44NSAxNDEwLjk5IDEwMjcuNjEgMTM2My4xNSBDIDEwMjEuNCAxMzUyLjY5IDEwMTQuMDMgMTM0Mi45NiAxMDA1LjYzIDEzMzQuMTYgQyA5OTYuMzIxIDEzMjQuMjYgOTI5LjYwNiAxMjY1LjUxIDkyMC4yODcgMTI2My4xNSB6Ii8+CjxwYXRoIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMCkiIGZpbGw9InJnYigxOTgsMTQ0LDQyKSIgZD0iTSAxMDQyLjA0IDU0NS4zMTEgTCAxMDQyLjQ1IDU0Ny41NjEgQyAxMDE4LjMxIDU3OC4wNzUgOTk5LjYzIDU5OS43NzEgMTAwNC45MyA2NDEuNzIzIEMgMTAxMS43MiA2OTUuNTA4IDEwNTcuMDEgNzMxLjA5NyAxMDk3LjMyIDc2MS42MjYgQyAxMTA2LjI2IDc2OC4zOTMgMTExNC44OSA3NzkuOTg0IDExMjUuNjIgNzgzLjEzMyBDIDExMzcuMDggNzk2LjA1NiAxMTgxLjgxIDgzMS4xODEgMTE5Ny4xNCA4NDMuNzA3IEwgMTM0MC4xOCA5NjAuNzkgTCAxNDAxLjQ4IDEwMTAuODQgQyAxNDM0LjQ3IDEwMzcuODMgMTQ2Mi4yOSAxMDU5LjIzIDE0ODcuMDkgMTA5NC45NCBDIDE1MjQuMDMgMTE0OS4yOCAxNTM3Ljg4IDEyMTYuMDYgMTUyNS41OSAxMjgwLjYgQyAxNTEzLjA1IDEzNDcuMDkgMTQ3MS4zMyAxNDEzLjYyIDE0MTUuMDggMTQ1MS43NiBDIDE0MjMuOTIgMTQzNi41MyAxNDMwLjYyIDE0MjMuMzIgMTQzNS40MSAxNDA2LjE4IEMgMTQ0NS4zNCAxMzY5LjY1IDE0NDAuNzggMTMzMC43IDE0MjIuNjcgMTI5Ny40NSBDIDEzOTQuMyAxMjQ1LjU2IDEzNDYuMTQgMTIwOC41OCAxMzAxLjA4IDExNzEuODggTCAxMjI1LjgzIDExMTAuMjMgTCAxMDQxLjY4IDk1OC4zODUgQyA5OTguNjg5IDkyMi40MjkgOTU2LjQxOCA4OTQuOTIyIDkyOC42NTIgODQ0LjY3NSBDIDkwMi40ODQgNzk4LjIyMSA4OTUuODcgNzQzLjI2NSA5MTAuMjcgNjkxLjkyOSBDIDkzMC4wNyA2MjMuOTQ0IDk4Mi4yMzIgNTc4LjM4NiAxMDQyLjA0IDU0NS4zMTEgeiIvPgo8cGF0aCB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDApIiBmaWxsPSJyZ2IoMTk4LDE0NCw0MikiIGQ9Ik0gOTIwLjI4NyAxMjYzLjE1IEMgOTI5LjYwNiAxMjY1LjUxIDk5Ni4zMjEgMTMyNC4yNiAxMDA1LjYzIDEzMzQuMTYgQyAxMDE0LjAzIDEzNDIuOTYgMTAyMS40IDEzNTIuNjkgMTAyNy42MSAxMzYzLjE1IEMgMTA1NS44NSAxNDEwLjk5IDEwNDQuNDMgMTQ1OC42MiAxMDA5LjMxIDE0OTcuNjYgQyAxMDA4LjI3IDE0OTguODIgMTAwOC4yNiAxNTAwLjMxIDEwMDguMjQgMTUwMS43NSBDIDEwMDUuOTIgMTUwNC40NiA5MzEuMTI5IDE1NDIuNDYgOTIzLjMxNSAxNTQ2LjU0IEwgNTU0LjI2NSAxNzM4LjU1IEMgNTUwLjY0OSAxNzAzLjEgNTQ3LjI5NiAxNjc1LjI4IDU1My4xMDQgMTYzOS41MiBDIDU2NC40MjIgMTU2OS44MyA2MDUuMjc0IDE1MTEuODEgNjY1LjA3NyAxNDc0Ljk4IEMgNjg3LjE1NiAxNDYxLjM4IDcxMy43NzcgMTQ0OC45NyA3MzcuMjE1IDE0MzYuOTUgTCA4NDguMTE1IDEzNzkuOSBDIDg2OC43NTggMTM2OS4zMSA4OTMuMjA4IDEzNTguNDUgOTEyLjA0OCAxMzQ1LjcgQyA5NDIuNzUxIDEzMjQuOTEgOTQwLjg5MiAxMjg5Ljc1IDkyMC4yODcgMTI2My4xNSB6Ii8+CjxwYXRoIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMCkiIGZpbGw9InJnYigxNjQsMTE5LDMyKSIgZD0iTSAxMDQyLjA0IDU0NS4zMTEgQyAxMDUyLjExIDUzOC44MTMgMTA3My43NSA1MjguMjQ0IDEwODUuMjcgNTIyLjIzIEwgMTE3MS43IDQ3Ny40MzMgTCAxMzg5LjU1IDM2My45OTEgQyAxNDIzLjEzIDM0Ni40NjQgMTQ1OS41IDMyOC4zODcgMTQ5Mi40OSAzMTAuMzA5IEMgMTQ5NC45OSAzMjcuNDY0IDE0OTcuNTMgMzQzLjE3OSAxNDk4LjE1IDM2MC41NDEgQyAxNTAwLjM4IDQxNC4zMDcgMTQ4NC4xNSA0NjcuMjIgMTQ1Mi4xNCA1MTAuNDc5IEMgMTQxMC40NCA1NjYuNjY2IDEzNTcuMiA1ODcuMTg5IDEyOTcuMzggNjE3Ljg3NyBMIDExODcuNzQgNjc0LjM0OCBDIDExNzQuMTggNjgxLjM1NiAxMTYwLjM4IDY4OC4zOTcgMTE0Ni45IDY5NS41NjYgQyAxMTA5LjQ0IDcxNS40OTUgMTEwMy4zIDc0Ny4xNTggMTEyNS42MiA3ODMuMTMzIEMgMTExNC44OSA3NzkuOTg0IDExMDYuMjYgNzY4LjM5MyAxMDk3LjMyIDc2MS42MjYgQyAxMDU3LjAxIDczMS4wOTcgMTAxMS43MiA2OTUuNTA4IDEwMDQuOTMgNjQxLjcyMyBDIDk5OS42MyA1OTkuNzcxIDEwMTguMzEgNTc4LjA3NSAxMDQyLjQ1IDU0Ny41NjEgTCAxMDQyLjA0IDU0NS4zMTEgeiIvPgo8cGF0aCB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDApIiBmaWxsPSJyZ2IoMTk4LDE0NCw0MikiIGQ9Ik0gNzkyLjU5MyA1NTcuNDI1IEMgODAzLjgzNiA1NTYuMTM1IDgzNC44NTMgNTU2Ljk1NCA4NDcuMzgxIDU1Ni45NTcgTCA5NjAuNTI2IDU1Ny4xMTQgQyA5NTEuOTI3IDU2NC4xNTcgOTQzLjcwOSA1NzEuNjUyIDkzNS45MDUgNTc5LjU2NyBDIDg4NS40IDYzMC45NjQgODY1LjIxNSA2ODUuMzE5IDg2NS44OSA3NTYuNjY2IEMgODM3LjY3NiA3NTcuMzMzIDc4NS4xMjcgNzU2LjY2MSA3NjEuNDg3IDc2OC40NzQgQyA3NDAuNTc5IDc4MS41NTYgNzM3LjQ0MiA3OTYuMzIgNzM1LjkyNSA4MTkuMDkyIEwgNzIwLjg3MSA4MDYuNjA2IEMgNjg2LjU1NSA3NzcuOTE4IDY0Ny4wNyA3MzQuNjAxIDY0My42MzEgNjg4LjM5NSBDIDY0MS4zOTggNjU4LjM5NSA2NTEuNjY1IDYzMS40NDYgNjcxLjIyMyA2MDguOTY2IEMgNzAyLjQxNyA1NzMuMTEzIDc0Ni44NDkgNTYwLjY5MSA3OTIuNTkzIDU1Ny40MjUgeiIvPgo8cGF0aCB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDApIiBmaWxsPSJyZ2IoMTY0LDExOSwzMikiIGQ9Ik0gMTMxMi4xMiAxMjI4Ljg5IEMgMTMyMy41NSAxMjM2LjggMTMzNi45MiAxMjUwLjUyIDEzNDcuMzIgMTI2MC4xMyBDIDE0MDMuNzIgMTMxMi4yOCAxNDI5LjQgMTM4Ni4xMSAxMzY4LjkxIDE0NDcuNDcgQyAxMzE5LjkgMTQ5Ny4xOSAxMjQ4LjE2IDE0OTAuODcgMTE4My4yNSAxNDkwLjk0IEwgMTA4Ny40MiAxNDkwLjk3IEMgMTA5NS45OSAxNDg0LjA0IDExMDQuMTUgMTQ3Ni42MiAxMTExLjg4IDE0NjguNzYgQyAxMTYyLjc4IDE0MTYuOTQgMTE4My41MyAxMzYyLjcxIDExODIuODYgMTI5MC45NSBDIDEyMzcuMTkgMTI5MC4zIDEzMDguNTkgMTMwMC41NCAxMzEyLjEyIDEyMjguODkgeiIvPgo8L3N2Zz4K';

let cachedShsLogoBase64: string | null = null;

/**
 * Preload the official SHS Virtual Academy logo as a base64 Data URL.
 * Guarantees CORS-free, synchronous rendering in html2canvas without black boxes or dropped images.
 */
export async function loadAcademyLogoDataUrl(): Promise<string> {
  if (cachedShsLogoBase64) {
    return cachedShsLogoBase64;
  }

  const candidateUrls = [
    SHS_LOCAL_LOGO_PATH,
    '/logo.png',
    '/logo.svg',
    SHS_OFFICIAL_LOGO_URL,
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        if (dataUrl && dataUrl.startsWith('data:image')) {
          cachedShsLogoBase64 = dataUrl;
          return dataUrl;
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  // Fallback: create via Image and canvas
  for (const url of candidateUrls) {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 120;
            canvas.height = img.naturalHeight || 120;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
            } else {
              reject(new Error('Canvas context is null'));
            }
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = reject;
        img.src = url;
      });
      if (dataUrl && dataUrl.startsWith('data:image')) {
        cachedShsLogoBase64 = dataUrl;
        return dataUrl;
      }
    } catch {
      // Continue
    }
  }

  // Guaranteed pristine SVG Academy Logo fallback
  cachedShsLogoBase64 = SHS_EMBEDDED_LOGO_SVG_DATA;
  return SHS_EMBEDDED_LOGO_SVG_DATA;
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
 * Sanitizes delimiters, wraps raw LaTeX commands, and renders fractions, square roots,
 * overlines, and sets seamlessly with KaTeX HTML output.
 */
export function renderMathAndTypography(rawText: string | undefined | null): string {
  if (!rawText) return '';
  let str = sanitizeMathAndDelimiters(rawText);

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
      return formula;
    }
  });

  // 2. Genetics notations & chemistry subscripts: F_1 -> F₁, H2O -> H₂O, CO2 -> CO₂
  str = str.replace(/\bF_?1\b/g, 'F₁');
  str = str.replace(/\bF_?2\b/g, 'F₂');
  str = str.replace(/\bP_?1\b/g, 'P₁');
  str = str.replace(/\bH2O\b/g, 'H₂O');
  str = str.replace(/\bCO2\b/g, 'CO₂');

  // 3. Exponents shorthand: x^2 -> x², x^3 -> x³
  str = str.replace(/\^2\b/g, '²');
  str = str.replace(/\^3\b/g, '³');

  // 4. Code backticks
  str = str.replace(
    /`([^`]+)`/g,
    '<code style="background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-family: monospace; font-size: 11px; color: #0f172a;">$1</code>'
  );

  // 5. Markdown bold & italics
  str = str.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  str = str.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  str = str.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');
  str = str.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  str = str.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  str = str.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');

  // 6. Clean rogue markdown headers
  str = str.replace(/^#{1,6}\s*/g, '');

  return str;
}

/**
 * Lightweight SVG Watermark
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

  // Calculate actual total marks matching all rendered questions
  let calculatedMarks = 0;
  let totalQuestionCount = 0;
  for (const s of quizData.sections) {
    for (const q of s.questions) {
      totalQuestionCount++;
      calculatedMarks += q.marks || 1;
    }
  }
  const displayTotalMarks = calculatedMarks > 0 ? calculatedMarks : (quizData.totalMarks || totalQuestionCount || 5);

  // Preload KaTeX CSS into document head if not present
  if (typeof document !== 'undefined') {
    if (!document.getElementById('katex-css-bundle')) {
      const link = document.createElement('link');
      link.id = 'katex-css-bundle';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  }

  // Preload Academy Logo base64
  const logoDataUrl = await loadAcademyLogoDataUrl();

  // Await document.fonts.ready and explicit KaTeX web fonts
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
      const katexFontList = [
        '1em KaTeX_Main',
        '1em KaTeX_Math',
        '1em KaTeX_Size1',
        '1em KaTeX_Size2',
        '1em KaTeX_Size3',
        '1em KaTeX_Size4',
        '1em KaTeX_AMS',
        '1em KaTeX_Caligraphic',
        '1em KaTeX_Fraktur',
        '1em KaTeX_SansSerif',
        '1em KaTeX_Script',
        '1em KaTeX_Typewriter',
      ];
      await Promise.allSettled(katexFontList.map((f) => document.fonts.load(f)));
      await document.fonts.ready;
    } catch (err) {
      console.warn('[PDFGenerator] Font loading warning:', err);
    }
  }

  const PAGE_HEIGHT = 1123;
  const MAX_CONTENT_BOTTOM_OFFSET = 1030;
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
    pageEl.style.padding = '24px 36px 36px 36px';
    pageEl.style.overflow = 'hidden';

    // Inject KaTeX support styles directly on pageEl
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .katex {
        font-size: 1.15em !important;
        line-height: 1.25 !important;
        text-rendering: auto !important;
      }
      .katex-html {
        display: inline-block !important;
      }
      .katex .frac-line {
        border-bottom-width: 1.5px !important;
      }
      .katex .sqrt > .vlist-t {
        display: inline-table !important;
      }
      .katex .sqrt-line {
        border-top-width: 1.5px !important;
      }
    `;
    pageEl.appendChild(styleEl);

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

    const logoHtml = logoDataUrl
      ? `<img src="${logoDataUrl}" alt="SHS Virtual Academy" style="width: 48px; height: 48px; object-fit: contain; flex-shrink: 0;" crossOrigin="anonymous" />`
      : `<div style="width: 48px; height: 48px; background: #111111; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #F4C430; font-weight: 900; font-size: 16px; flex-shrink: 0;">SHS</div>`;

    const topBanner = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111111; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${logoHtml}
          <div>
            <h1 style="margin: 0; font-size: 16px; font-weight: 900; letter-spacing: -0.02em; color: #111111; text-transform: uppercase; line-height: 1.15;">
              SHS VIRTUAL ACADEMY
            </h1>
            <p style="margin: 2px 0 0 0; font-size: 9.5px; font-weight: 700; color: #525252; text-transform: uppercase; letter-spacing: 0.04em;">
              Scholario Sage v2.0 • Academic Testing & Assessment
            </p>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 14px; font-weight: 900; color: #111111; line-height: 1.15;">Scholario</div>
          <div style="font-size: 9.5px; font-weight: 700; color: #737373;">scholario.me</div>
          <div style="font-size: 9px; font-weight: 800; color: ${mode === 'student' ? '#059669' : '#d97706'}; text-transform: uppercase; margin-top: 1px;">
            ${mode === 'student' ? 'Student Edition (No Answers)' : 'Faculty & Teacher Copy (With Solutions)'}
          </div>
        </div>
      </div>
    `;

    if (pageNum === 1) {
      headerEl.innerHTML = `
        ${topBanner}
        <div style="text-align: center; padding: 8px 0; border-bottom: 1px solid #e5e5e5;">
          <h2 style="margin: 0; font-size: 15px; font-weight: 900; text-transform: uppercase; color: #111111; letter-spacing: 0.02em;">
            ${renderMathAndTypography(quizData.title)}
          </h2>
          <div style="font-size: 10px; font-weight: 600; color: #525252; margin-top: 2px;">
            ${quizData.subject} • ${quizData.grade} • Prepared by ${quizData.instructor}
          </div>
        </div>
        <div style="margin: 8px 0 10px 0; padding: 8px 14px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px; font-size: 10px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; color: #374151;">
          <div><strong>Subject:</strong> ${quizData.subject}</div>
          <div><strong>Grade:</strong> ${quizData.grade}</div>
          <div><strong>Total Marks:</strong> ${displayTotalMarks}</div>
          <div><strong>Time Allowed:</strong> ${quizData.timeAllowed || '45 Mins'}</div>
        </div>
        ${
          mode === 'student'
            ? `<div style="margin-bottom: 12px; padding: 8px 14px; background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 6px; font-size: 10.5px; display: flex; justify-content: space-between; color: #1e293b;">
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
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 9.5px; font-weight: 700; color: #475569; margin-top: 4px; margin-bottom: 10px;">
          <span>${quizData.subject} • ${quizData.grade}</span>
          <span style="color: #0f172a; font-weight: 800;">${renderMathAndTypography(quizData.title)}</span>
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
    footerEl.style.left = '36px';
    footerEl.style.right = '36px';
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

    if (blockBottomOffset > MAX_CONTENT_BOTTOM_OFFSET && currentPage.contentEl.children.length > 1) {
      currentPage.contentEl.removeChild(blockEl);
      currentPage = createNewPage(pages.length + 1);
      currentPage.contentEl.appendChild(blockEl);
    }
  }

  // ── Render Sections & Questions ──
  let sequentialQuestionNumber = 0;

  for (const section of quizData.sections) {
    if (section.questions.length === 0) continue;

    const secHeader = document.createElement('div');
    secHeader.style.boxSizing = 'border-box';
    secHeader.style.breakInside = 'avoid';
    secHeader.style.pageBreakInside = 'avoid';
    secHeader.style.marginTop = '10px';
    secHeader.style.marginBottom = '8px';
    secHeader.innerHTML = `
      <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; background: #111111; color: #ffffff; padding: 5px 12px; border-radius: 4px; letter-spacing: 0.02em; display: flex; justify-content: space-between;">
        <span>${renderMathAndTypography(section.name)}</span>
        ${section.marks ? `<span>[${section.marks} Marks]</span>` : ''}
      </div>
    `;
    appendBlock(secHeader);

    for (let qIdx = 0; qIdx < section.questions.length; qIdx++) {
      const q = section.questions[qIdx];
      sequentialQuestionNumber++;
      const displayNumber = sequentialQuestionNumber; // Sequentially numbered 1, 2, 3, 4, 5...

      const qBlock = document.createElement('div');
      qBlock.style.boxSizing = 'border-box';
      qBlock.style.width = '100%';
      qBlock.style.breakInside = 'avoid';
      qBlock.style.pageBreakInside = 'avoid';
      qBlock.style.marginBottom = '10px';
      qBlock.style.padding = '10px 14px';
      qBlock.style.background = '#ffffff';
      qBlock.style.border = '1px solid #e2e8f0';
      qBlock.style.borderRadius = '6px';
      qBlock.style.fontSize = '12pt';

      const isUrdu = containsUrdu(q.text);
      if (isUrdu) {
        qBlock.dir = 'rtl';
        qBlock.style.fontFamily = urduFontFamily;
        qBlock.style.textAlign = 'right';
      }

      try {
        const questionText = q.text || '[Question content unavailable]';

        if (q.type === 'mcq' && q.options) {
          const optA = q.options.A || '—';
          const optB = q.options.B || '—';
          const optC = q.options.C || '—';
          const optD = q.options.D || '—';

          qBlock.innerHTML = `
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px; line-height: 1.5; font-size: 12pt;">
              <strong>${displayNumber}.</strong> ${renderMathAndTypography(questionText)}
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 24px; padding: 8px 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #f1f5f9; box-sizing: border-box; width: 100%; min-width: 0;">
              <div style="min-width: 0; overflow-wrap: anywhere; word-break: break-word; box-sizing: border-box; display: flex; align-items: baseline; gap: 6px; font-size: 12pt; line-height: 1.45;">
                <span style="font-weight: 700; color: #1e293b; flex-shrink: 0;">(A)</span>
                <span style="min-width: 0; overflow-wrap: anywhere; word-break: break-word;">${renderMathAndTypography(optA)}</span>
              </div>
              <div style="min-width: 0; overflow-wrap: anywhere; word-break: break-word; box-sizing: border-box; display: flex; align-items: baseline; gap: 6px; font-size: 12pt; line-height: 1.45;">
                <span style="font-weight: 700; color: #1e293b; flex-shrink: 0;">(B)</span>
                <span style="min-width: 0; overflow-wrap: anywhere; word-break: break-word;">${renderMathAndTypography(optB)}</span>
              </div>
              <div style="min-width: 0; overflow-wrap: anywhere; word-break: break-word; box-sizing: border-box; display: flex; align-items: baseline; gap: 6px; font-size: 12pt; line-height: 1.45;">
                <span style="font-weight: 700; color: #1e293b; flex-shrink: 0;">(C)</span>
                <span style="min-width: 0; overflow-wrap: anywhere; word-break: break-word;">${renderMathAndTypography(optC)}</span>
              </div>
              <div style="min-width: 0; overflow-wrap: anywhere; word-break: break-word; box-sizing: border-box; display: flex; align-items: baseline; gap: 6px; font-size: 12pt; line-height: 1.45;">
                <span style="font-weight: 700; color: #1e293b; flex-shrink: 0;">(D)</span>
                <span style="min-width: 0; overflow-wrap: anywhere; word-break: break-word;">${renderMathAndTypography(optD)}</span>
              </div>
            </div>
          `;
        } else {
          // Short / descriptive question
          qBlock.innerHTML = `
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px; line-height: 1.5; font-size: 12pt;">
              <strong>${displayNumber}.</strong> ${renderMathAndTypography(questionText)}
            </div>
            ${
              mode === 'student'
                ? `<div style="margin-top: 8px; min-height: 52px; border: 1px dashed #cbd5e1; border-radius: 4px; background: #fafafa; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #94a3b8; font-style: italic;">
                    Student Answer / Working Space
                  </div>`
                : ''
            }
          `;
        }
      } catch (err) {
        // Show error placeholder instead of dropping question
        qBlock.innerHTML = `
          <div style="color: #dc2626; font-size: 12pt; font-weight: 600;">
            <strong>${displayNumber}.</strong> [Question could not be rendered: ${err instanceof Error ? err.message : 'Unknown error'}]
          </div>
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
    ansHeader.style.marginTop = '14px';
    ansHeader.style.marginBottom = '10px';
    ansHeader.innerHTML = `
      <div style="font-weight: 900; font-size: 12px; text-transform: uppercase; background: #111111; color: #F4C430; padding: 6px 14px; border-radius: 4px; letter-spacing: 0.03em;">
        OFFICIAL ANSWER KEY & STEP-BY-STEP SOLUTIONS
      </div>
    `;
    appendBlock(ansHeader);

    for (let aIdx = 0; aIdx < quizData.answers.length; aIdx++) {
      const ans = quizData.answers[aIdx];
      const ansBlock = document.createElement('div');
      ansBlock.style.boxSizing = 'border-box';
      ansBlock.style.breakInside = 'avoid';
      ansBlock.style.pageBreakInside = 'avoid';
      ansBlock.style.marginBottom = '10px';
      ansBlock.style.padding = '10px 14px';
      ansBlock.style.background = '#f0fdf4';
      ansBlock.style.border = '1px solid #bbf7d0';
      ansBlock.style.borderRadius = '6px';
      ansBlock.style.fontSize = '11pt';

      const stepsHtml =
        ans.steps && ans.steps.length > 0
          ? `<div style="margin-top: 6px; padding-left: 10px; border-left: 2px solid #86efac; font-size: 10.5pt; color: #166534;">
              ${ans.steps.map((st, sIdx) => `<div style="margin-bottom: 3px;"><strong>Step ${sIdx + 1}:</strong> ${renderMathAndTypography(st.replace(/^step\s*[0-9]+:?\s*/i, ''))}</div>`).join('')}
            </div>`
          : '';

      ansBlock.innerHTML = `
        <div style="display: flex; align-items: baseline; gap: 8px; font-weight: 800; color: #15803d; margin-bottom: 4px;">
          <span>Question ${aIdx + 1}:</span>
          <span style="background: #dcfce7; padding: 2px 8px; border-radius: 4px; border: 1px solid #86efac; font-family: monospace;">${renderMathAndTypography(ans.answer)}</span>
        </div>
        ${ans.explanation ? `<div style="color: #166534; font-size: 10.5pt; line-height: 1.45;">${renderMathAndTypography(ans.explanation)}</div>` : ''}
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

  // Ensure all images are decoded and loaded prior to html2canvas capture
  const allImages = renderRoot.querySelectorAll('img');
  await Promise.all(
    Array.from(allImages).map((img) => {
      if (img.complete) return Promise.resolve();
      return img.decode().catch(() => new Promise((resolve) => {
        img.onload = () => resolve(null);
        img.onerror = () => resolve(null);
      }));
    })
  );

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
        scale: 3,
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
      // Scale image to full page width (210mm) and height (297mm) without letterboxing
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
