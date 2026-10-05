import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { GeneratedTestSpecification } from '../types/questionBank';
import { renderLaTeXToText } from './latexRenderer';
import { containsUrdu } from './urduReshaper';
import { isIELTSBoard } from './curriculumIELTS';

export const SHS_OFFICIAL_LOGO_URL =
  'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000c0808211bef4c03788e5a2c5.png';
export const SHS_LOCAL_LOGO_PATH = '/images/shs-academy-logo.png';

export interface GenerateTestPdfOptions {
  /**
   * Whether to include the Official Answer Key & Teacher Marking Scheme section.
   * - `false`: Generates the sanitized Student Copy (Questions only, zero answer key in DOM/data).
   * - `true`: Generates the Teacher/Admin Copy with the complete Marking Scheme.
   * Default: `true` (Teacher Copy).
   */
  includeAnswerKey?: boolean;
  /**
   * Explicit target role for the PDF export.
   * - `'student'`: Automatically strips all answer keys and marking scheme sections.
   * - `'teacher'`: Retains full marking scheme.
   */
  targetRole?: 'teacher' | 'student';
}

export const SHS_EMBEDDED_LOGO_SVG_DATA =
  'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgdmlld0JveD0iMCAwIDIwNDggMjA0OCIgd2lkdGg9IjEwMjQiIGhlaWdodD0iMTAyNCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+CjxyZWN0IHdpZHRoPSIyMDQ4IiBoZWlnaHQ9IjIwNDgiIHJ4PSIzNjQiIGZpbGw9InJnYigxNiwxNiwxNykiLz4KPHBhdGggdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwwKSIgZmlsbD0icmdiKDIzOSwxNjksMjIpIiBkPSJNIDkyMC4yODcgMTI2My4xNSBDIDg5Ny4zNTQgMTI0MC41NSA4NTYuNzQyIDEyMDkuNDMgODMwLjg5OCAxMTg4LjMzIEwgNjc1LjQ2OSAxMDYxLjE5IEMgNjM1LjQwMSAxMDI4LjQ2IDU4Ny45OTcgOTk0LjQ4MSA1NTkuNDM2IDk1MS44NzIgQyA1MzMuMTEgOTEyLjU5NiA1MTguNTIzIDg2My44MjkgNTE4LjE4NCA4MTYuNjkyIEMgNTE3LjYyNiA3NDYuNjAxIDU0NS4wNjggNjc5LjE4NiA1OTQuNDIgNjI5LjQxMSBDIDYwNi4zNDggNjE3LjM1NSA2MTkuNzg3IDYwNi42NCA2MzMuMjg5IDU5Ni40IEMgNTk1Ljk5OCA2NTIuMTQyIDU5OC45NjMgNzE3LjYwNSA2MzcuOTU4IDc3MS4yODggQyA2NzYuMDc2IDgyMy43NjQgNzMxLjIwOCA4NjMuMjc3IDc4MC44OTUgOTA0LjM1IEwgMTAwMy45NSAxMDg3LjUyIEMgMTAzNC4zNiAxMTEyLjUxIDEwNzkuMjYgMTE0NS43IDExMDIuMSAxMTc2LjM4IEMgMTE1NC41MyAxMjQ2Ljc4IDExNjIuNjYgMTMzNC4xNSAxMTEzLjQgMTQwOC44MyBDIDEwOTIuMjkgMTQ0MC44MyAxMDQzLjE2IDE0ODUuMTQgMTAwOC4yNCAxNTAxLjc1IEMgMTAwOC4yNiAxNTAwLjMxIDEwMDguMjcgMTQ5OC44MiAxMDA5LjMxIDE0OTcuNjYgQyAxMDQ0LjQzIDE0NTguNjIgMTA1NS44NSAxNDEwLjk5IDEwMjcuNjEgMTM2My4xNSBDIDEwMjEuNCAxMzUyLjY5IDEwMTQuMDMgMTM0Mi45NiAxMDA1LjYzIDEzMzQuMTYgQyA5OTYuMzIxIDEzMjQuMjYgOTI5LjYwNiAxMjY1LjUxIDkyMC4yODcgMTI2My4xNSB6Ii8+CjxwYXRoIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMCkiIGZpbGw9InJnYigxOTgsMTQ0LDQyKSIgZD0iTSAxMDQyLjA0IDU0NS4zMTEgTCAxMDQyLjQ1IDU0Ny41NjEgQyAxMDE4LjMxIDU3OC4wNzUgOTk5LjYzIDU5OS43NzEgMTAwNC45MyA2NDEuNzIzIEMgMTAxMS43MiA2OTUuNTA4IDEwNTcuMDEgNzMxLjA5NyAxMDk3LjMyIDc2MS42MjYgQyAxMTA2LjI2IDc2OC4zOTMgMTExNC44OSA3NzkuOTg0IDExMjUuNjIgNzgzLjEzMyBDIDExMzcuMDggNzk2LjA1NiAxMTgxLjgxIDgzMS4xODEgMTE5Ny4xNCA4NDMuNzA3IEwgMTM0MC4xOCA5NjAuNzkgTCAxNDAxLjQ4IDEwMTAuODQgQyAxNDM0LjQ3IDEwMzcuODMgMTQ2Mi4yOSAxMDU5LjIzIDE0ODcuMDkgMTA5NC45NCBDIDE1MjQuMDMgMTE0OS4yOCAxNTM3Ljg4IDEyMTYuMDYgMTUyNS41OSAxMjgwLjYgQyAxNTEzLjA1IDEzNDcuMDkgMTQ3MS4zMyAxNDEzLjYyIDE0MTUuMDggMTQ1MS43NiBDIDE0MjMuOTIgMTQzNi41MyAxNDMwLjYyIDE0MjMuMzIgMTQzNS40MSAxNDA2LjE4IEMgMTQ0NS4zNCAxMzY5LjY1IDE0NDAuNzggMTMzMC43IDE0MjIuNjcgMTI5Ny40NSBDIDEzOTQuMyAxMjQ1LjU2IDEzNDYuMTQgMTIwOC41OCAxMzAxLjA4IDExNzEuODggTCAxMjI1LjgzIDExMTAuMjMgTCAxMDQxLjY4IDk1OC4zODUgQyA5OTguNjg5IDkyMi40MjkgOTU2LjQxOCA4OTQuOTIyIDkyOC42NTIgODQ0LjY3NSBDIDkwMi40ODQgNzk4LjIyMSA4OTUuODcgNzQzLjI2NSA5MTAuMjcgNjkxLjkyOSBDIDkzMC4wNyA2MjMuOTQ0IDk4Mi4yMzIgNTc4LjM4NiAxMDQyLjA0IDU0NS4zMTEgeiIvPgo8cGF0aCB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDApIiBmaWxsPSJyZ2IoMTk4LDE0NCw0MikiIGQ9Ik0gOTIwLjI4NyAxMjYzLjE1IEMgOTI5LjYwNiAxMjY1LjUxIDk5Ni4zMjEgMTMyNC4yNiAxMDA1LjYzIDEzMzQuMTYgQyAxMDE0LjAzIDEzNDIuOTYgMTAyMS40IDEzNTIuNjkgMTAyNy42MSAxMzYzLjE1IEMgMTA1NS44NSAxNDEwLjk5IDEwNDQuNDMgMTQ1OC42MiAxMDA5LjMxIDE0OTcuNjYgQyAxMDA4LjI3IDE0OTguODIgMTAwOC4yNiAxNTAwLjMxIDEwMDguMjQgMTUwMS43NSBDIDEwMDUuOTIgMTUwNC40NiA5MzEuMTI5IDE1NDIuNDYgOTIzLjMxNSAxNTQ2LjU0IEwgNTU0LjI2NSAxNzM4LjU1IEMgNTUwLjY0OSAxNzAzLjEgNTQ3LjI5NiAxNjc1LjI4IDU1My4xMDQgMTYzOS41MiBDIDU2NC40MjIgMTU2OS44MyA2MDUuMjc0IDE1MTEuODEgNjY1LjA3NyAxNDc0Ljk4IEMgNjg3LjE1NiAxNDYxLjM4IDcxMy43NzcgMTQ0OC45NyA3MzcuMjE1IDE0MzYuOTUgTCA4NDguMTE1IDEzNzkuOSBDIDg2OC43NTggMTM2OS4zMSA4OTMuMjA4IDEzNTguNDUgOTEyLjA0OCAxMzQ1LjcgQyA5NDIuNzUxIDEzMjQuOTEgOTQwLjg5MiAxMjg5Ljc1IDkyMC4yODcgMTI2My4xNSB6Ii8+CjxwYXRoIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMCkiIGZpbGw9InJnYigxNjQsMTE5LDMyKSIgZD0iTSAxMDQyLjA0IDU0NS4zMTEgQyAxMDUyLjExIDUzOC44MTMgMTA3My43NSA1MjguMjQ0IDEwODUuMjcgNTIyLjIzIEwgMTE3MS43IDQ3Ny40MzMgTCAxMzg5LjU1IDM2My45OTEgQyAxNDIzLjEzIDM0Ni40NjQgMTQ1OS41IDMyOC4zODcgMTQ5Mi40OSAzMTAuMzA5IEMgMTQ5NC45OSAzMjcuNDY0IDE0OTcuNTMgMzQzLjE3OSAxNDk4LjE1IDM2MC41NDEgQyAxNTAwLjM4IDQxNC4zMDcgMTQ4NC4xNSA0NjcuMjIgMTQ1Mi4xNCA1MTAuNDc5IEMgMTQxMC40NCA1NjYuNjY2IDEzNTcuMiA1ODcuMTg5IDEyOTcuMzggNjE3Ljg3NyBMIDExODcuNzQgNjc0LjM0OCBDIDExNzQuMTggNjgxLjM1NiAxMTYwLjM4IDY4OC4zOTcgMTE0Ni45IDY5NS41NjYgQyAxMTA5LjQ0IDcxNS40OTUgMTEwMy4zIDc0Ny4xNTggMTEyNS42MiA3ODMuMTMzIEMgMTExNC44OSA3NzkuOTg0IDExMDYuMjYgNzY4LjM5MyAxMDk3LjMyIDc2MS42MjYgQyAxMDU3LjAxIDczMS4wOTcgMTAxMS43MiA2OTUuNTA4IDEwMDQuOTMgNjQxLjcyMyBDIDk5OS42MyA1OTkuNzcxIDEwMTguMzEgNTc4LjA3NSAxMDQyLjQ1IDU0Ny41NjEgTCAxMDQyLjA0IDU0NS4zMTEgeiIvPgo8cGF0aCB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDApIiBmaWxsPSJyZ2IoMTk4LDE0NCw0MikiIGQ9Ik0gNzkyLjU5MyA1NTcuNDI1IEMgODAzLjgzNiA1NTYuMTM1IDgzNC44NTMgNTU2Ljk1NCA4NDcuMzgxIDU1Ni45NTcgTCA5NjAuNTI2IDU1Ny4xMTQgQyA5NTEuOTI3IDU2NC4xNTcgOTQzLjcwOSA1NzEuNjUyIDkzNS45MDUgNTc5LjU2NyBDIDg4NS40IDYzMC45NjQgODY1LjIxNSA2ODUuMzE5IDg2NS44OSA3NTYuNjY2IEMgODM3LjY3NiA3NTcuMzMzIDc4NS4xMjcgNzU2LjY2MSA3NjEuNDg3IDc2OC40NzQgQyA3NDAuNTc5IDc4MS41NTYgNzM3LjQ0MiA3OTYuMzIgNzM1LjkyNSA4MTkuMDkyIEwgNzIwLjg3MSA4MDYuNjA2IEMgNjg2LjU1NSA3NzcuOTE4IDY0Ny4wNyA3MzQuNjAxIDY0My42MzEgNjg4LjM5NSBDIDY0MS4zOTggNjU4LjM5NSA2NTEuNjY1IDYzMS40NDYgNjcxLjIyMyA2MDguOTY2IEMgNzAyLjQxNyA1NzMuMTEzIDc0Ni44NDkgNTYwLjY5MSA3OTIuNTkzIDU1Ny40MjUgeiIvPgo8cGF0aCB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDApIiBmaWxsPSJyZ2IoMTY0LDExOSwzMikiIGQ9Ik0gMTMxMi4xMiAxMjI4Ljg5IEMgMTMyMy41NSAxMjM2LjggMTMzNi45MiAxMjUwLjUyIDEzNDcuMzIgMTI2MC4xMyBDIDE0MDMuNzIgMTMxMi4yOCAxNDI5LjQgMTM4Ni4xMSAxMzY4LjkxIDE0NDcuNDcgQyAxMzE5LjkgMTQ5Ny4xOSAxMjQ4LjE2IDE0OTAuODcgMTE4My4yNSAxNDkwLjk0IEwgMTA4Ny40MiAxNDkwLjk3IEMgMTA5NS45OSAxNDg0LjA0IDExMDQuMTUgMTQ3Ni42MiAxMTExLjg4IDE0NjguNzYgQyAxMTYyLjc4IDE0MTYuOTQgMTE4My41MyAxMzYyLjcxIDExODIuODYgMTI5MC45NSBDIDEyMzcuMTkgMTI5MC4zIDEzMDguNTkgMTMwMC41NCAxMzEyLjEyIDEyMjguODkgeiIvPgo8L3N2Zz4K';

let cachedLogoDataUrl: string | null = null;

/**
 * Preload the official SHS Academy Logo to a base64 DataURL
 * to guarantee CORS-free, synchronous rendering in html2canvas without black boxes or missing images.
 */
export async function getShsLogoDataUrl(): Promise<string> {
  if (cachedLogoDataUrl) {
    return cachedLogoDataUrl;
  }

  const candidateUrls = [
    SHS_LOCAL_LOGO_PATH,
    '/logo.png',
    '/logo.svg',
    SHS_OFFICIAL_LOGO_URL,
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        if (dataUrl && dataUrl.startsWith('data:image')) {
          cachedLogoDataUrl = dataUrl;
          return dataUrl;
        }
      }
    } catch {}
  }

  // Guaranteed pristine SVG Academy Logo fallback
  cachedLogoDataUrl = SHS_EMBEDDED_LOGO_SVG_DATA;
  return SHS_EMBEDDED_LOGO_SVG_DATA;
}

/**
 * Generates an official, branded examination paper PDF with complete Urdu & RTL support,
 * block-level page-break pagination (keeping MCQs, questions, and the answer key atomic and unbroken),
 * and high-resolution vector capture.
 */
export async function generateTestPaperPDF(
  test: GeneratedTestSpecification,
  options?: GenerateTestPdfOptions
): Promise<{
  blob: Blob;
  dataUrl: string;
  arrayBuffer: ArrayBuffer;
  filename: string;
}> {
  const isStudentCopy = options?.includeAnswerKey === false || options?.targetRole === 'student';
  const copySuffix = isStudentCopy ? 'Student_Copy' : 'Teacher_Copy';

  const sanitizeForFilename = (str: string, fallback: string) => {
    const cleaned = (str || '').trim().replace(/[\/\\?%*:|"<>]/g, '_').slice(0, 30);
    return cleaned && cleaned.replace(/_/g, '').length > 0 ? cleaned : fallback;
  };
  const cleanSubject = sanitizeForFilename(test.subject, 'Subject');
  const cleanTitle = sanitizeForFilename(test.title, 'Paper');
  const filename = `SHS_Test_${cleanSubject}_G${test.grade || '9'}_${cleanTitle}_${copySuffix}.pdf`;

  // If in browser environment with DOM access, use native HTML-to-PDF engine with pagination
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      return await generateTestPaperHtmlPDF(test, filename, options);
    } catch (err) {
      console.warn('[PDFGenerator] HTML-to-PDF engine fallback triggered:', err);
      return generateTestPaperFallbackNodePDF(test, filename, options);
    }
  }

  // Fallback for Node / headless environments
  return generateTestPaperFallbackNodePDF(test, filename, options);
}

/**
 * Generate sanitized Student Copy PDF (Question paper only, strictly zero answer key).
 */
export async function generateStudentCopyPDF(test: GeneratedTestSpecification) {
  return generateTestPaperPDF(test, { includeAnswerKey: false, targetRole: 'student' });
}

/**
 * Generate full Teacher / Admin Copy PDF (Includes Official Answer Key & Marking Scheme).
 */
export async function generateTeacherCopyPDF(test: GeneratedTestSpecification) {
  return generateTestPaperPDF(test, { includeAnswerKey: true, targetRole: 'teacher' });
}

/**
 * High-fidelity HTML-to-PDF multi-page layout engine.
 * Renders discrete A4 pages (794x1123px) with atomic block measurement,
 * preventing any question or answer-key panel from being split across page boundaries.
 */
async function generateTestPaperHtmlPDF(
  test: GeneratedTestSpecification,
  filename: string,
  options?: GenerateTestPdfOptions
) {
  const isStudentCopy = options?.includeAnswerKey === false || options?.targetRole === 'student';

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
  renderRoot.style.left = '0';
  renderRoot.style.top = '0';
  renderRoot.style.width = '794px';
  renderRoot.style.backgroundColor = '#ffffff';
  renderRoot.style.opacity = '0.001';
  renderRoot.style.pointerEvents = 'none';
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
    watermarkEl.className = 'shs-pdf-watermark-layer';
    watermarkEl.style.position = 'absolute';
    watermarkEl.style.inset = '0';
    watermarkEl.style.display = 'flex';
    watermarkEl.style.alignItems = 'center';
    watermarkEl.style.justifyContent = 'center';
    watermarkEl.style.pointerEvents = 'none';
    watermarkEl.style.opacity = '0.045';
    watermarkEl.style.overflow = 'hidden';
    watermarkEl.style.zIndex = '1';
    watermarkEl.innerHTML = `
      <img src="${logoDataUrl}" alt="SHS Watermark" style="width: 440px; height: 440px; object-fit: contain; filter: grayscale(100%); background: transparent;" />
    `;
    pageEl.appendChild(watermarkEl);

    // 2. Page Header (Identical Top Branding on every single page)
    const headerEl = document.createElement('div');
    headerEl.className = 'shs-pdf-header-layer';
    headerEl.style.position = 'relative';
    headerEl.style.zIndex = '10';

    const brandedTopBar = `
      <!-- Top Branded Header (Universal across all pages) -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111111; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: transparent;">
            <img src="${logoDataUrl}" alt="SHS Logo" style="max-width: 100%; max-height: 100%; object-fit: contain; background: transparent;" />
          </div>
          <div>
            <h1 style="margin: 0; font-size: 15px; font-weight: 900; letter-spacing: -0.02em; color: #111111; text-transform: uppercase; line-height: 1.15;">SHS VIRTUAL ACADEMY</h1>
            <p style="margin: 2px 0 0 0; font-size: 9px; font-weight: 700; color: #525252; text-transform: uppercase; letter-spacing: 0.04em; line-height: 1.2;">Student Assessment</p>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 13.5px; font-weight: 900; color: #111111; line-height: 1.15;">Scholario</div>
          <div style="font-size: 9px; font-weight: 700; color: #737373;">Powered by Scholario LMS</div>
          <div style="font-size: 9px; font-weight: 800; color: #d97706;">scholario.me</div>
        </div>
      </div>
    `;

    if (pageNum === 1) {
      // Full branded header + metadata table on Page 1
      headerEl.innerHTML = `
        ${brandedTopBar}

        <!-- Title & Curriculum Details -->
        <div style="text-align: center; padding: 6px 0; border-bottom: 1px solid #e5e5e5;">
          <h2 style="margin: 0; font-size: 13.5px; font-weight: 900; text-transform: uppercase; color: #111111; letter-spacing: 0.02em;">
            ${test.title}
          </h2>
          <div style="font-size: 10.5px; font-weight: 600; color: #525252; margin-top: 2px;">
            ${
              isIELTSBoard(test.board, test.grade)
                ? `IELTS Preparation (${test.stream || 'Academic'}) • ${test.subject} • ${test.chapter && test.chapter !== 'All' ? test.chapter : 'All Sections'}`
                : `Grade ${test.grade} (${test.stream || 'Science'}) • ${test.subject} • ${test.board.toUpperCase()} Curriculum ${test.chapter && test.chapter !== 'All' ? '• ' + test.chapter : ''}`
            }
          </div>
        </div>

        <!-- Student Metadata Table Box -->
        <div style="margin: 8px 0; padding: 6px 10px; background: #fafafa; border: 1px solid #d4d4d4; border-radius: 6px; font-size: 10px;">
          <div style="display: flex; justify-content: space-between; font-weight: 700; color: #374151; padding-bottom: 4px;">
            <div>Student Name: <span style="font-weight: 400; border-bottom: 1px solid #9ca3af; display: inline-block; width: 140px;">&nbsp;</span></div>
            <div>Roll No: <span style="font-weight: 400; border-bottom: 1px solid #9ca3af; display: inline-block; width: 100px;">&nbsp;</span></div>
            <div>Date: <span style="font-weight: 400;">${test.dueDate || new Date().toISOString().split('T')[0]}</span></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 700; color: #374151; padding-top: 4px; border-top: 1px solid #e5e5e5;">
            <div>Subject: <span style="color: #111111;">${test.subject}</span></div>
            <div>Time Allowed: <span style="color: #111111;">${test.timeAllowedMinutes} Mins</span></div>
            <div>Total Marks: <span style="color: #111111;">${test.totalMarks}</span></div>
          </div>
          ${
            test.instructions
              ? `<div style="font-size: 9.5px; color: #6b7280; font-style: italic; padding-top: 4px; margin-top: 4px; border-top: 1px solid #e5e5e5;">Instructions: ${test.instructions}</div>`
              : ''
          }
        </div>
      `;
    } else {
      // Identical top header + running continuation bar on subsequent pages
      const isIelts = isIELTSBoard(test.board, test.grade);
      headerEl.innerHTML = `
        ${brandedTopBar}

        <!-- Running Sub-bar on Continuation Pages -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 9.5px; font-weight: 700; color: #475569; margin-top: 4px; margin-bottom: 6px;">
          <span>${test.subject} • ${isIelts ? `IELTS Preparation (${test.stream || 'Academic'})` : `Grade ${test.grade} (${test.stream || 'Science'})`}</span>
          <span style="color: #0f172a; font-weight: 800;">${test.title}</span>
          <span style="color: #94a3b8; font-size: 9px; font-weight: 700; text-transform: uppercase;">Continued</span>
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
      <div>SHS Virtual Academy • Student Assessment</div>
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
  // Only included in Teacher / Admin Copy - strictly omitted in Student Copy
  // ==========================================
  if (!isStudentCopy && (mcqs.length > 0 || shortQuestions.some((s) => s.modelAnswer))) {
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
  }

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
    // Ensure all images across all pages are fully loaded & decoded before canvas capture
    const allImages = Array.from(renderRoot.querySelectorAll('img'));
    await Promise.all(
      allImages.map(async (img) => {
        if (!img.complete) {
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        }
        try {
          if (typeof img.decode === 'function') {
            await img.decode();
          }
        } catch {
          // non-blocking
        }
      })
    );

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
async function generateTestPaperFallbackNodePDF(
  test: GeneratedTestSpecification,
  filename: string,
  options?: GenerateTestPdfOptions
) {
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

  if (options?.includeAnswerKey) {
    doc.setFontSize(8);
    doc.text('Official Answer Key attached (Teacher/Admin Copy)', 105, 42, { align: 'center' });
  }

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
