import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { GeneratedTestSpecification } from '../types/questionBank';
import { renderLaTeXToText } from './latexRenderer';
import { containsUrdu } from './urduReshaper';

/**
 * Generates an official, branded examination paper PDF with complete Urdu & RTL support.
 * Uses an HTML-to-Canvas / DOM rendering pipeline in browser environments so that Urdu script
 * ligatures, cursive joins, bidirectional flow, and mathematical notation render natively and flawlessly.
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

  // If in browser environment with DOM access, use native HTML-to-PDF engine
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
 * High-fidelity HTML-to-PDF renderer leveraging browser OpenType shaping,
 * Noto Nastaliq Urdu & Noto Naskh Arabic fonts, and exact A4 page geometry.
 */
async function generateTestPaperHtmlPDF(test: GeneratedTestSpecification, filename: string) {
  // Ensure fonts are loaded before capturing
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Non-blocking
    }
  }

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

  // Build hidden DOM element styled as an authentic examination paper
  const container = document.createElement('div');
  container.id = 'shs-pdf-render-canvas-dom';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // 210mm at 96 DPI
  container.style.minHeight = '1123px'; // 297mm at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#111111';
  container.style.fontFamily = "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, sans-serif";
  container.style.padding = '36px 44px';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-9999';

  // Urdu font CSS family
  const urduFontFamily = "'Noto Nastaliq Urdu', 'Noto Naskh Arabic', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', 'Arabic Typesetting', serif";

  let htmlContent = `
    <div style="position: relative; width: 100%; box-sizing: border-box; background: #ffffff;">
      <!-- Academy Watermark Overlay -->
      <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; opacity: 0.045; overflow: hidden; z-index: 1;">
        <img src="/images/shs-academy-logo.png" alt="SHS Watermark" style="width: 460px; height: 460px; object-fit: contain; filter: grayscale(100%);" />
      </div>

      <!-- Top Branded Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111111; padding-bottom: 12px; position: relative; z-index: 10;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 52px; height: 52px; background: #111111; color: #F4C430; border-radius: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <img src="/images/shs-academy-logo.png" alt="SHS Logo" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
          <div>
            <h1 style="margin: 0; font-size: 17px; font-weight: 900; letter-spacing: -0.02em; color: #111111; text-transform: uppercase;">SHS VIRTUAL ACADEMY</h1>
            <p style="margin: 2px 0 0 0; font-size: 10.5px; font-weight: 700; color: #525252; text-transform: uppercase; letter-spacing: 0.04em;">Department of Examinations & Academic Assessments</p>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 15px; font-weight: 900; color: #111111;">Scholario</div>
          <div style="font-size: 9.5px; font-weight: 700; color: #737373;">Powered by Scholario LMS</div>
          <div style="font-size: 9.5px; font-weight: 800; color: #d97706;">scholario.me</div>
        </div>
      </div>

      <!-- Title & Curriculum Details -->
      <div style="text-align: center; padding: 10px 0; border-bottom: 1px solid #e5e5e5; position: relative; z-index: 10;">
        <h2 style="margin: 0; font-size: 14.5px; font-weight: 900; text-transform: uppercase; color: #111111; letter-spacing: 0.02em;">
          ${test.title}
        </h2>
        <div style="font-size: 11.5px; font-weight: 600; color: #525252; margin-top: 2px;">
          Grade ${test.grade} (${test.stream || 'Science'}) • ${test.subject} • ${test.board.toUpperCase()} Curriculum ${test.chapter && test.chapter !== 'All' ? '• ' + test.chapter : ''}
        </div>
      </div>

      <!-- Student Metadata Table Box -->
      <div style="margin: 12px 0; padding: 10px 12px; background: #fafafa; border: 1px solid #d4d4d4; border-radius: 6px; font-size: 11px; position: relative; z-index: 10;">
        <div style="display: flex; justify-content: space-between; font-weight: 700; color: #374151; padding-bottom: 6px;">
          <div>Student Name: <span style="font-weight: 400; border-bottom: 1px solid #9ca3af; display: inline-block; width: 140px;">&nbsp;</span></div>
          <div>Roll No: <span style="font-weight: 400; border-bottom: 1px solid #9ca3af; display: inline-block; width: 100px;">&nbsp;</span></div>
          <div>Date: <span style="font-weight: 400;">${test.dueDate || new Date().toISOString().split('T')[0]}</span></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: 700; color: #374151; padding-top: 6px; border-top: 1px solid #e5e5e5;">
          <div>Subject: <span style="color: #111111;">${test.subject}</span></div>
          <div>Time Allowed: <span style="color: #111111;">${test.timeAllowedMinutes} Mins</span></div>
          <div>Total Marks: <span style="color: #111111;">${test.totalMarks}</span></div>
        </div>
        ${
          test.instructions
            ? `<div style="font-size: 10.5px; color: #6b7280; font-style: italic; padding-top: 5px; margin-top: 5px; border-top: 1px solid #e5e5e5;">Instructions: ${test.instructions}</div>`
            : ''
        }
      </div>
  `;

  // Section A: Multiple Choice Questions (MCQs)
  if (mcqs.length > 0) {
    const secLetter = sectionLetters[sectionLetterIdx++] || 'A';
    htmlContent += `
      <div style="margin: 16px 0; position: relative; z-index: 10;">
        <div style="background: #111111; color: #ffffff; padding: 6px 12px; border-radius: 3px; display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 11.5px;">
          <span>SECTION – ${secLetter} : MULTIPLE CHOICE QUESTIONS (MCQs)</span>
          <span>[${mcqMarksTotal} Marks]</span>
        </div>
        <p style="font-size: 10.5px; color: #6b7280; font-style: italic; margin: 6px 0 10px 0;">
          Note: Attempt all questions. Each question carries ${test.mcqMarksEach || 1} mark.
        </p>
        <div style="display: flex; flex-direction: column; gap: 10px;">
    `;

    mcqs.forEach((mcq, idx) => {
      const qText = renderLaTeXToText(mcq.question);
      const isUrduQ = containsUrdu(qText) || isUrduSubject;
      const optA = renderLaTeXToText(mcq.options?.A || '');
      const optB = renderLaTeXToText(mcq.options?.B || '');
      const optC = renderLaTeXToText(mcq.options?.C || '');
      const optD = renderLaTeXToText(mcq.options?.D || '');

      if (isUrduQ) {
        // Urdu RTL MCQ block with native cursive ligatures
        htmlContent += `
          <div dir="rtl" style="font-family: ${urduFontFamily}; text-align: right; padding: 7px 10px; background: rgba(250, 250, 250, 0.7); border: 1px solid #e5e5e5; border-radius: 4px;">
            <div style="font-weight: 700; font-size: 13px; color: #111111; line-height: 1.8;">
              سوال ۱. (${idx + 1})&nbsp;&nbsp;${qText}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; margin-top: 6px; font-size: 12px; color: #374151; padding-right: 12px; line-height: 1.6;">
              <div style="display: flex; align-items: flex-start; gap: 4px;"><strong style="color: #111111; shrink: 0;">(الف)</strong> <span>${optA}</span></div>
              <div style="display: flex; align-items: flex-start; gap: 4px;"><strong style="color: #111111; shrink: 0;">(ب)</strong> <span>${optB}</span></div>
              <div style="display: flex; align-items: flex-start; gap: 4px;"><strong style="color: #111111; shrink: 0;">(ج)</strong> <span>${optC}</span></div>
              <div style="display: flex; align-items: flex-start; gap: 4px;"><strong style="color: #111111; shrink: 0;">(د)</strong> <span>${optD}</span></div>
            </div>
          </div>
        `;
      } else {
        // English LTR MCQ block
        htmlContent += `
          <div dir="ltr" style="font-family: 'Plus Jakarta Sans', sans-serif; text-align: left; padding: 7px 10px; background: rgba(250, 250, 250, 0.7); border: 1px solid #e5e5e5; border-radius: 4px;">
            <div style="font-weight: 800; font-size: 11.5px; color: #111111; line-height: 1.5;">
              Q1. (${idx + 1})&nbsp;&nbsp;${qText}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; margin-top: 6px; font-size: 10.5px; color: #374151; padding-left: 12px;">
              <div style="display: flex; align-items: flex-start; gap: 4px;"><strong style="color: #111111; shrink: 0;">(A)</strong> <span>${optA}</span></div>
              <div style="display: flex; align-items: flex-start; gap: 4px;"><strong style="color: #111111; shrink: 0;">(B)</strong> <span>${optB}</span></div>
              <div style="display: flex; align-items: flex-start; gap: 4px;"><strong style="color: #111111; shrink: 0;">(C)</strong> <span>${optC}</span></div>
              <div style="display: flex; align-items: flex-start; gap: 4px;"><strong style="color: #111111; shrink: 0;">(D)</strong> <span>${optD}</span></div>
            </div>
          </div>
        `;
      }
    });

    htmlContent += `</div></div>`;
  }

  // Section B: Short Questions
  if (shortQuestions.length > 0) {
    const secLetter = sectionLetters[sectionLetterIdx++] || 'B';
    htmlContent += `
      <div style="margin: 16px 0; position: relative; z-index: 10;">
        <div style="background: #111111; color: #ffffff; padding: 6px 12px; border-radius: 3px; display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 11.5px;">
          <span>SECTION – ${secLetter} : SHORT ANSWER QUESTIONS</span>
          <span>[${shortMarksTotal} Marks]</span>
        </div>
        <p style="font-size: 10.5px; color: #6b7280; font-style: italic; margin: 6px 0 10px 0;">
          Note: Attempt any ${test.shortAttemptCount || shortQuestions.length} questions. Each question carries ${test.shortMarksEach || 2} marks.
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
    `;

    shortQuestions.forEach((sq, idx) => {
      const roman = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'][idx] || `${idx + 1}`;
      const qText = renderLaTeXToText(sq.question);
      const isUrduQ = containsUrdu(qText) || isUrduSubject;
      const marks = sq.marks || test.shortMarksEach || 2;

      if (isUrduQ) {
        htmlContent += `
          <div dir="rtl" style="font-family: ${urduFontFamily}; display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; padding: 7px 10px; background: rgba(250, 250, 250, 0.7); border: 1px solid #e5e5e5; border-radius: 4px;">
            <div style="font-weight: 700; font-size: 13px; color: #111111; line-height: 1.8;">
              سوال ۲. (${roman})&nbsp;&nbsp;${qText}
            </div>
            <span style="font-size: 10px; font-weight: 700; color: #6b7280; white-space: nowrap; margin-top: 4px;">[${marks} Marks]</span>
          </div>
        `;
      } else {
        htmlContent += `
          <div dir="ltr" style="font-family: 'Plus Jakarta Sans', sans-serif; display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; padding: 7px 10px; background: rgba(250, 250, 250, 0.7); border: 1px solid #e5e5e5; border-radius: 4px;">
            <div style="font-weight: 800; font-size: 11.5px; color: #111111; line-height: 1.5;">
              Q2. (${roman})&nbsp;&nbsp;${qText}
            </div>
            <span style="font-size: 10px; font-weight: 700; color: #6b7280; white-space: nowrap;">[${marks} Marks]</span>
          </div>
        `;
      }
    });

    htmlContent += `</div></div>`;
  }

  // Section C: Long / Detailed Questions
  if (longQuestions.length > 0) {
    const secLetter = sectionLetters[sectionLetterIdx++] || 'C';
    htmlContent += `
      <div style="margin: 16px 0; position: relative; z-index: 10;">
        <div style="background: #111111; color: #ffffff; padding: 6px 12px; border-radius: 3px; display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 11.5px;">
          <span>SECTION – ${secLetter} : DETAILED / LONG QUESTIONS</span>
          <span>[${longMarksTotal} Marks]</span>
        </div>
        <p style="font-size: 10.5px; color: #6b7280; font-style: italic; margin: 6px 0 10px 0;">
          Note: Attempt any ${test.longAttemptCount || longQuestions.length} questions. Each question carries ${test.longMarksEach || 5} marks.
        </p>
        <div style="display: flex; flex-direction: column; gap: 10px;">
    `;

    longQuestions.forEach((lq, idx) => {
      const qText = renderLaTeXToText(lq.question);
      const isUrduQ = containsUrdu(qText) || isUrduSubject;
      const marks = lq.marks || test.longMarksEach || 5;

      if (isUrduQ) {
        htmlContent += `
          <div dir="rtl" style="font-family: ${urduFontFamily}; padding: 8px 12px; background: rgba(250, 250, 250, 0.7); border: 1px solid #e5e5e5; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; font-weight: 700; font-size: 13px; color: #111111; line-height: 1.8;">
              <div>سوال ${3 + idx}.&nbsp;&nbsp;${qText}</div>
              <span style="font-size: 10px; font-weight: 700; color: #6b7280; white-space: nowrap; margin-top: 4px;">[${marks} Marks]</span>
            </div>
            ${
              lq.parts && lq.parts.length > 0
                ? `<div style="padding-right: 16px; margin-top: 6px; display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #374151;">
                    ${lq.parts
                      .map(
                        (p) =>
                          `<div style="display: flex; justify-content: space-between;"><span>${p.label}&nbsp;${renderLaTeXToText(
                            p.text
                          )}</span><span style="color: #6b7280; font-size: 10.5px;">(${p.marks} Marks)</span></div>`
                      )
                      .join('')}
                  </div>`
                : ''
            }
          </div>
        `;
      } else {
        htmlContent += `
          <div dir="ltr" style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 8px 12px; background: rgba(250, 250, 250, 0.7); border: 1px solid #e5e5e5; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; font-weight: 800; font-size: 11.5px; color: #111111; line-height: 1.5;">
              <div>Q${3 + idx}.&nbsp;&nbsp;${qText}</div>
              <span style="font-size: 10px; font-weight: 700; color: #6b7280; white-space: nowrap;">[${marks} Marks]</span>
            </div>
            ${
              lq.parts && lq.parts.length > 0
                ? `<div style="padding-left: 16px; margin-top: 6px; display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #374151;">
                    ${lq.parts
                      .map(
                        (p) =>
                          `<div style="display: flex; justify-content: space-between;"><span>${p.label}&nbsp;${renderLaTeXToText(
                            p.text
                          )}</span><span style="color: #6b7280; font-size: 10.5px;">(${p.marks} Marks)</span></div>`
                      )
                      .join('')}
                  </div>`
                : ''
            }
          </div>
        `;
      }
    });

    htmlContent += `</div></div>`;
  }

  // Answer Key & Marking Scheme (Teacher Confidential)
  htmlContent += `
    <div style="margin: 20px 0; padding-top: 14px; border-top: 2px dashed #f59e0b; position: relative; z-index: 10;">
      <div style="background: #d97706; color: #ffffff; padding: 4px 10px; border-radius: 3px; font-size: 11px; font-weight: 900; display: flex; justify-content: space-between; align-items: center;">
        <span>OFFICIAL ANSWER KEY & TEACHER MARKING SCHEME</span>
        <span style="font-size: 9px; text-transform: uppercase; background: #92400e; padding: 2px 6px; border-radius: 2px;">Confidential</span>
      </div>
      <div style="margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px;">
        ${
          mcqs.length > 0
            ? `<div style="padding: 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 4px;">
                <h5 style="margin: 0 0 6px 0; font-weight: 900; color: #92400e; font-size: 11px;">MCQ Answer Key</h5>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10.5px; color: #1f2937;">
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
            ? `<div style="padding: 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 4px;">
                <h5 style="margin: 0 0 6px 0; font-weight: 900; color: #92400e; font-size: 11px;">Short Question Model Answers</h5>
                <div style="display: flex; flex-direction: column; gap: 4px; font-size: 10px; color: #374151;">
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
    </div>
  `;

  // Running Footer
  htmlContent += `
      <div style="margin-top: 24px; padding-top: 10px; border-top: 1px solid #d4d4d4; display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; color: #6b7280; font-weight: 600; position: relative; z-index: 10;">
        <div>SHS Virtual Academy • Confidential Examination Paper</div>
        <div>Powered by Scholario LMS (scholario.me)</div>
      </div>
    </div>
  `;

  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    // High-resolution canvas capture with full text shaping
    const canvas = await html2canvas(container, {
      scale: 2, // 2x DPI for crisp print-quality vector feel
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Calculate height of an A4 page in canvas pixels
    const a4PageHeightPx = Math.round(canvasWidth * (297 / 210));
    const totalPages = Math.max(1, Math.ceil(canvasHeight / a4PageHeightPx));

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      // Create a slice canvas for this specific A4 page
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvasWidth;
      pageCanvas.height = a4PageHeightPx;
      const ctx = pageCanvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, a4PageHeightPx);

        const srcY = page * a4PageHeightPx;
        const srcHeight = Math.min(a4PageHeightPx, canvasHeight - srcY);

        ctx.drawImage(canvas, 0, srcY, canvasWidth, srcHeight, 0, 0, canvasWidth, srcHeight);

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(pageImgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }
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
    if (container.parentNode) {
      container.parentNode.removeChild(container);
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
