import { jsPDF } from 'jspdf';
import type { StoredMCQ } from '../types/questionBank';

interface TestGenerationParams {
  board: string;
  grade: string;
  subject: string;
  title: string;
  teacherName: string;
  totalMarks: string;
  mcqs: StoredMCQ[];
  // Short/Long arrays will go here in the future
}

// Convert image URL to Base64 to be used with jsPDF
async function getBase64ImageFromUrl(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper to strip latex formatting mostly, for basic text rendering.
// A real app would use html2pdf/html2canvas for full LaTeX math rendering,
// but we will use jsPDF text methods with basic cleanup for the requirement.
function stripLatex(text: string) {
  if (!text) return '';
  return text.replace(/\\text{([^}]+)}/g, '$1')
             .replace(/\\textbf{([^}]+)}/g, '$1')
             .replace(/\\mu/g, 'μ')
             .replace(/\\Omega/g, 'Ω')
             .replace(/\\degree/g, '°')
             .replace(/\\times/g, '×')
             .replace(/\\div/g, '÷')
             .replace(/\\sqrt{([^}]+)}/g, '√($1)')
             .replace(/\\frac{([^}]+)}{([^}]+)}/g, '($1)/($2)')
             .replace(/\\,/g, ' ')
             .replace(/\\\s/g, ' ')
             .replace(/\$/g, '')
             .replace(/\\/g, '')
             .replace(/text{/g, '')
             .replace(/}/g, '');
}

export async function generateTestPDF(params: TestGenerationParams): Promise<File> {
  const { board, grade, subject, title, teacherName, totalMarks, mcqs } = params;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  let logoBase64: string | null = null;
  try {
    logoBase64 = await getBase64ImageFromUrl('/shs_academy_logo.jpg');
  } catch (err) {
    console.warn("Could not load logo for PDF", err);
  }

  // --- Background Watermark (Every Page) ---
  const addWatermark = () => {
    if (logoBase64) {
      // 8-12% opacity watermark
      doc.setGState(new (doc as any).GState({ opacity: 0.10 }));
      const watermarkSize = 120;
      doc.addImage(
        logoBase64,
        'JPEG',
        (pageWidth - watermarkSize) / 2,
        (pageHeight - watermarkSize) / 2,
        watermarkSize,
        watermarkSize
      );
      // Reset opacity
      doc.setGState(new (doc as any).GState({ opacity: 1 }));
    }
  };

  // --- Footer (Every Page) ---
  const addFooter = (pageNum: number) => {
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150); // Light gray
    doc.setFont("helvetica", "normal");
    const footerText = "SHS Virtual Academy";
    doc.text(footerText, margin, pageHeight - 10);
    const pageText = `Page ${pageNum}`;
    doc.text(pageText, pageWidth - margin - doc.getTextWidth(pageText), pageHeight - 10);
  };

  let pageNum = 1;
  addWatermark();

  // --- Header (First Page Only) ---
  if (logoBase64) {
    doc.addImage(logoBase64, 'JPEG', margin, yPos, 30, 30);
  }

  let scholarioLogoBase64: string | null = null;
  try {
    scholarioLogoBase64 = await getBase64ImageFromUrl('/scholario-logo.png'); // assuming scholario logo exists
  } catch (err) {
    // skip if missing
  }

  if (scholarioLogoBase64) {
    doc.addImage(scholarioLogoBase64, 'PNG', pageWidth - margin - 30, yPos, 30, 8);
  }

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "bold");
  const pwrText = "Powered by Scholario LMS";
  const urlText = "scholario.me";
  doc.text(pwrText, pageWidth - margin - doc.getTextWidth(pwrText), yPos + (scholarioLogoBase64 ? 12 : 5));
  doc.setFont("helvetica", "normal");
  doc.text(urlText, pageWidth - margin - doc.getTextWidth(urlText), yPos + (scholarioLogoBase64 ? 16 : 10));

  yPos += 15; // Move down below logo/powered by

  // Test Details (Centered)
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const titleText = title.toUpperCase();
  doc.text(titleText, pageWidth / 2, yPos, { align: 'center' });

  yPos += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  const subTitle = `${board.toUpperCase()} | Grade ${grade} | ${subject}`;
  doc.text(subTitle, pageWidth / 2, yPos, { align: 'center' });

  yPos += 12;

  // Teacher & Marks
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Teacher: ${teacherName}`, margin, yPos);
  const marksText = `Total Marks: ${totalMarks}`;
  doc.text(marksText, pageWidth - margin - doc.getTextWidth(marksText), yPos);

  yPos += 10;

  // Divider
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // --- Questions Section ---
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");

  if (mcqs.length > 0) {
    doc.text("Multiple Choice Questions (MCQs)", margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    mcqs.forEach((q, index) => {
      // Check for page break
      if (yPos > pageHeight - margin - 20) {
        addFooter(pageNum);
        doc.addPage();
        pageNum++;
        addWatermark();
        yPos = margin + 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
      }

      // Add Question
      const qText = `Q${index + 1}. ${stripLatex(q.question)}`;
      const splitQuestion = doc.splitTextToSize(qText, pageWidth - margin * 2);
      doc.text(splitQuestion, margin, yPos);
      yPos += (splitQuestion.length * 5) + 3;

      // Add Options (2 columns layout)
      const options = [
        `A) ${stripLatex(q.options.A)}`,
        `B) ${stripLatex(q.options.B)}`,
        `C) ${stripLatex(q.options.C)}`,
        `D) ${stripLatex(q.options.D)}`
      ];

      const colWidth = (pageWidth - margin * 2) / 2;

      // A and B
      doc.text(doc.splitTextToSize(options[0], colWidth - 5), margin + 5, yPos);
      doc.text(doc.splitTextToSize(options[1], colWidth - 5), margin + 5 + colWidth, yPos);
      yPos += Math.max(doc.splitTextToSize(options[0], colWidth - 5).length, doc.splitTextToSize(options[1], colWidth - 5).length) * 5;

      // C and D
      doc.text(doc.splitTextToSize(options[2], colWidth - 5), margin + 5, yPos);
      doc.text(doc.splitTextToSize(options[3], colWidth - 5), margin + 5 + colWidth, yPos);
      yPos += Math.max(doc.splitTextToSize(options[2], colWidth - 5).length, doc.splitTextToSize(options[3], colWidth - 5).length) * 5 + 5;
    });
  }

  // Final Footer
  addFooter(pageNum);

  // Return as File
  const pdfBlob = doc.output('blob');
  const file = new File([pdfBlob], `${title.replace(/\s+/g, '_')}_Test.pdf`, { type: 'application/pdf' });
  return file;
}
