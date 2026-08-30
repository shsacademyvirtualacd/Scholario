import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  ExternalLink,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  FileText,
  Eye,
  CheckCircle2,
  Printer,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { renderLaTeXToText } from '../../../lib/latexRenderer';
import { containsUrdu } from '../../../lib/urduReshaper';
import type { GeneratedTestSpecification } from '../../../types/questionBank';

// Configure pdfjs worker source safely
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).href;
  } catch (e) {
    console.warn('[PdfPreviewViewer] Local worker URL resolution error:', e);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
}

interface PdfPreviewViewerProps {
  pdfBlob: Blob | null;
  pdfDataUrl?: string;
  pdfArrayBuffer?: ArrayBuffer | null;
  testSpec: GeneratedTestSpecification;
  isGenerating: boolean;
  error: string | null;
  onRetry: () => void;
  onPreviewReady?: (isValid: boolean) => void;
}

export const PdfPreviewViewer: React.FC<PdfPreviewViewerProps> = ({
  pdfBlob,
  pdfDataUrl,
  pdfArrayBuffer,
  testSpec,
  isGenerating,
  error,
  onRetry,
  onPreviewReady,
}) => {
  const [zoom, setZoom] = useState<number>(1.0);
  const [activeTab, setActiveTab] = useState<'canvas' | 'paper'>('canvas');
  const [numPages, setNumPages] = useState<number>(0);
  const [renderingError, setRenderingError] = useState<string | null>(null);
  const [isRenderingPages, setIsRenderingPages] = useState<boolean>(false);
  const [renderAttempt, setRenderAttempt] = useState<number>(0);
  const [renderedObjectUrl, setRenderedObjectUrl] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Manage Blob Object URL for opening in new tab or download
  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setRenderedObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setRenderedObjectUrl(null);
    }
  }, [pdfBlob]);

  // Render PDF pages onto HTML5 Canvases using pdfjs-dist
  useEffect(() => {
    let isCancelled = false;
    let loadingTask: any = null;
    let loadedPdfDoc: any = null;

    async function renderPdfDocument() {
      if (!pdfArrayBuffer && !pdfBlob && !pdfDataUrl) {
        onPreviewReady?.(false);
        return;
      }

      setIsRenderingPages(true);
      setRenderingError(null);

      try {
        let rawBuffer: ArrayBuffer;

        // Prioritize Blob as it generates a fresh, non-detached ArrayBuffer on every call
        if (pdfBlob) {
          rawBuffer = await pdfBlob.arrayBuffer();
        } else if (pdfArrayBuffer && pdfArrayBuffer.byteLength > 0) {
          // Clone the ArrayBuffer to prevent transfer/detachment by Web Worker
          rawBuffer = pdfArrayBuffer.slice(0);
        } else if (pdfDataUrl) {
          // Decode DataURL if ArrayBuffer is detached or missing
          const base64Data = pdfDataUrl.includes(',') ? pdfDataUrl.split(',')[1] : pdfDataUrl;
          const binaryString = atob(base64Data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          rawBuffer = bytes.buffer;
        } else {
          throw new Error('PDF binary data is detached or unavailable.');
        }

        // Pass an isolated fresh clone to PDF.js
        const dataToLoad = new Uint8Array(rawBuffer.slice(0));

        loadingTask = pdfjsLib.getDocument({
          data: dataToLoad,
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
        });

        const pdf = await loadingTask.promise;
        loadedPdfDoc = pdf;
        if (isCancelled) return;

        setNumPages(pdf.numPages);
        const container = canvasContainerRef.current;
        if (!container) return;

        // Clear prior canvases
        container.innerHTML = '';

        // Render each page into a distinct canvas with high DPI scaling
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (isCancelled) return;

          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: zoom * 1.5 }); // High DPI baseline

          const pageWrapper = document.createElement('div');
          pageWrapper.className = 'relative mb-6 bg-white shadow-xl rounded-sm border border-neutral-300 mx-auto overflow-hidden transition-transform duration-150';
          pageWrapper.id = `pdf-page-${pageNum}`;

          const canvas = document.createElement('canvas');
          canvas.className = 'w-full h-auto block';
          const context = canvas.getContext('2d');

          if (!context) continue;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          // Set wrapper dimensions based on viewport
          pageWrapper.style.maxWidth = `${viewport.width / 1.5}px`;

          const renderContext: any = {
            canvasContext: context,
            canvas: canvas,
            viewport: viewport,
          };

          // Render Page
          await page.render(renderContext).promise;

          // Add Page badge overlay
          const badge = document.createElement('div');
          badge.className = 'absolute bottom-2 right-2 bg-neutral-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm pointer-events-none backdrop-blur-xs';
          badge.innerText = `Page ${pageNum} of ${pdf.numPages}`;
          pageWrapper.appendChild(canvas);
          pageWrapper.appendChild(badge);

          container.appendChild(pageWrapper);
        }

        setIsRenderingPages(false);
        onPreviewReady?.(true);
      } catch (err: any) {
        console.error('[PdfPreviewViewer] Canvas rendering failed with error:', err);
        if (!isCancelled) {
          const errMsg = err?.message || 'Could not render PDF canvas';
          setRenderingError(errMsg);
          setIsRenderingPages(false);
          // If canvas fails, paper view is still a valid visual preview
          onPreviewReady?.(true);
        }
      }
    }

    if (!isGenerating && (pdfArrayBuffer || pdfBlob || pdfDataUrl)) {
      renderPdfDocument();
    }

    return () => {
      isCancelled = true;
      if (loadingTask && typeof loadingTask.destroy === 'function') {
        loadingTask.destroy().catch(() => {});
      }
      if (loadedPdfDoc && typeof loadedPdfDoc.destroy === 'function') {
        loadedPdfDoc.destroy().catch(() => {});
      }
    };
  }, [pdfArrayBuffer, pdfBlob, pdfDataUrl, zoom, isGenerating, renderAttempt]);

  // Safeguard: If user is on 'canvas' view and for any reason canvas container has 0 children despite ready PDF, trigger re-render
  useEffect(() => {
    if (
      activeTab === 'canvas' &&
      canvasContainerRef.current &&
      canvasContainerRef.current.children.length === 0 &&
      !isGenerating &&
      !isRenderingPages &&
      !renderingError &&
      (pdfArrayBuffer || pdfBlob || pdfDataUrl)
    ) {
      const timer = setTimeout(() => {
        if (
          canvasContainerRef.current &&
          canvasContainerRef.current.children.length === 0 &&
          !isRenderingPages
        ) {
          setRenderAttempt((a) => a + 1);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isGenerating, isRenderingPages, renderingError, pdfArrayBuffer, pdfBlob, pdfDataUrl]);

  // Handle Download PDF (completely independent of canvas state)
  const handleDownload = () => {
    let downloadUrl = renderedObjectUrl || pdfDataUrl;
    let tempUrl: string | null = null;

    if (!downloadUrl && pdfBlob) {
      tempUrl = URL.createObjectURL(pdfBlob);
      downloadUrl = tempUrl;
    }

    if (!downloadUrl) {
      console.warn('[PdfPreviewViewer] No download URL or Blob available.');
      return;
    }

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `SHS_Test_${testSpec.subject || 'Assessment'}_Grade${testSpec.grade || 'Paper'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (tempUrl) {
      setTimeout(() => URL.revokeObjectURL(tempUrl!), 2000);
    }
  };

  // Handle Open in New Tab
  const handleOpenNewTab = () => {
    if (renderedObjectUrl) {
      window.open(renderedObjectUrl, '_blank');
    } else if (pdfDataUrl) {
      const win = window.open();
      if (win) {
        win.document.write(
          `<iframe src="${pdfDataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
      }
    } else if (pdfBlob) {
      const tempUrl = URL.createObjectURL(pdfBlob);
      window.open(tempUrl, '_blank');
    }
  };

  // Handle Print Paper (completely independent of canvas state)
  const handlePrint = () => {
    let printUrl = renderedObjectUrl || pdfDataUrl;
    let tempUrl: string | null = null;

    if (!printUrl && pdfBlob) {
      tempUrl = URL.createObjectURL(pdfBlob);
      printUrl = tempUrl;
    }

    if (printUrl) {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = printUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.print();
        } finally {
          setTimeout(() => {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
            if (tempUrl) URL.revokeObjectURL(tempUrl);
          }, 2000);
        }
      };
    } else {
      window.print();
    }
  };

  // Calculate Section Roman Numerals & Numbers
  const isUrduSubject =
    testSpec.subject?.toLowerCase().includes('urdu') ||
    testSpec.subject?.toLowerCase().includes('islam') ||
    containsUrdu(testSpec.title);
  const mcqs = testSpec.mcqs || [];
  const shortQuestions = testSpec.shortQuestions || [];
  const longQuestions = testSpec.longQuestions || [];
  const mcqMarksTotal = mcqs.length * (testSpec.mcqMarksEach || 1);
  const shortMarksTotal = (testSpec.shortAttemptCount || shortQuestions.length) * (testSpec.shortMarksEach || 2);
  const longMarksTotal = (testSpec.longAttemptCount || longQuestions.length) * (testSpec.longMarksEach || 5);

  let sectionLetterIdx = 0;
  const sectionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Action and Control Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-neutral-900 text-white rounded-xl text-xs shrink-0 shadow-sm">
        {/* Left: View Mode Tabs */}
        <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all ${
              activeTab === 'canvas'
                ? 'bg-[#F4C430] text-black shadow-xs'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Eye size={13} />
            <span>PDF Print Canvas</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paper')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all ${
              activeTab === 'paper'
                ? 'bg-[#F4C430] text-black shadow-xs'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            <FileText size={13} />
            <span>Document Layout</span>
          </button>
        </div>

        {/* Center: Zoom and Page Indicator (Canvas Mode) */}
        {activeTab === 'canvas' && numPages > 0 && (
          <div className="flex items-center gap-2 text-neutral-300">
            <span className="text-[11px] font-semibold text-neutral-400">
              {numPages} {numPages === 1 ? 'Page' : 'Pages'} Compiled
            </span>
            <div className="h-3 w-px bg-neutral-700" />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                disabled={zoom <= 0.6}
                title="Zoom Out"
                className="p-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[11px] font-mono font-bold w-12 text-center text-[#F4C430]">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}
                disabled={zoom >= 1.6}
                title="Zoom In"
                className="p-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1.0)}
                title="Reset Zoom (100%)"
                className="px-1.5 py-0.5 text-[10px] font-bold rounded hover:bg-neutral-800 text-neutral-400 hover:text-white ml-1 cursor-pointer"
              >
                Fit
              </button>
            </div>
          </div>
        )}

        {/* Right: Actions (Print, Open in New Tab & Download) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={!pdfBlob && !pdfDataUrl && activeTab !== 'paper'}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-40"
            title="Print assessment paper"
          >
            <Printer size={13} />
            <span className="hidden sm:inline">Print Paper</span>
          </button>

          {renderedObjectUrl && (
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-all cursor-pointer"
              title="Open raw PDF in new browser window"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Open New Tab</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            disabled={!pdfBlob && !pdfDataUrl}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F4C430] hover:bg-[#E5B520] text-black font-extrabold text-xs transition-all cursor-pointer disabled:opacity-40"
          >
            <Download size={13} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Main Preview Viewport */}
      <div
        ref={containerRef}
        className="w-full h-[54vh] rounded-xl border border-neutral-300 bg-neutral-800 overflow-y-auto relative flex flex-col p-4 shadow-inner"
      >
        {/* State 1: Generating PDF Loading Spinner with Feedback */}
        {isGenerating && (
          <div className="m-auto p-8 max-w-md text-center bg-white rounded-2xl border border-neutral-200 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-full border-3 border-neutral-900 border-t-transparent animate-spin mx-auto text-[#F4C430]" />
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-neutral-900">
                Compiling PDF Layout & Watermarks...
              </h4>
              <p className="text-xs text-neutral-500">
                Rendering SHS Academy logo, Scholario lockup, and official watermark overlays.
              </p>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 size={13} />
              <span>Standard FBIS/Inter Exam Format</span>
            </div>
          </div>
        )}

        {/* State 2: Explicit PDF Generation Error */}
        {!isGenerating && error && (
          <div className="m-auto p-6 max-w-md bg-white rounded-2xl border border-amber-300 shadow-xl space-y-4 text-center">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <AlertTriangle size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-neutral-900">
                PDF Preview Generation Issue
              </h4>
              <p className="text-xs text-neutral-600 font-mono bg-neutral-100 p-2 rounded text-left break-all">
                {error}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-[#F4C430] hover:bg-black font-extrabold text-xs transition-all cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Retry PDF Generation</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paper')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 font-bold text-xs text-neutral-800 transition-all cursor-pointer"
              >
                <FileText size={13} />
                <span>Switch to Document Layout</span>
              </button>
            </div>
          </div>
        )}

        {/* State 3: Empty Placeholder before generation */}
        {!isGenerating && !error && !pdfBlob && !pdfDataUrl && (
          <div className="m-auto p-8 max-w-sm text-center bg-white rounded-2xl border border-neutral-200 shadow-md space-y-3">
            <FileText size={32} className="mx-auto text-neutral-400" />
            <h4 className="text-xs font-bold text-neutral-800">
              No PDF Preview Generated Yet
            </h4>
            <p className="text-[11px] text-neutral-500">
              Click the button below to compile and preview the test paper.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 rounded-xl bg-neutral-900 text-[#F4C430] font-bold text-xs hover:bg-black transition-all cursor-pointer"
            >
              Generate Branded PDF
            </button>
          </div>
        )}

        {/* State 4A: PDF Canvas Render Mode (Actual Compiled PDF Pages) */}
        {!isGenerating && !error && (pdfBlob || pdfArrayBuffer || pdfDataUrl) && (
          <div className={`w-full flex flex-col items-center ${activeTab === 'canvas' ? '' : 'hidden'}`}>
            {isRenderingPages && (
              <div className="m-auto p-8 max-w-md text-center bg-white rounded-2xl border border-neutral-200 shadow-xl space-y-3 my-8">
                <div className="w-9 h-9 rounded-full border-3 border-neutral-900 border-t-[#F4C430] animate-spin mx-auto" />
                <h4 className="text-sm font-extrabold text-neutral-900">
                  Rendering High-DPI PDF Pages...
                </h4>
                <p className="text-xs text-neutral-500">
                  Rasterizing compiled vector pages for interactive zoom preview.
                </p>
              </div>
            )}

            {/* Error Boundary inside Canvas Render Mode */}
            {!isRenderingPages && renderingError && (
              <div className="m-auto p-6 max-w-md bg-white rounded-2xl border border-amber-300 shadow-xl space-y-4 text-center my-8">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                  <AlertTriangle size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-neutral-900">
                    PDF Canvas Rasterization Issue
                  </h4>
                  <p className="text-xs text-neutral-600 font-mono bg-neutral-100 p-2 rounded text-left break-all">
                    {renderingError}
                  </p>
                  <p className="text-[11px] text-neutral-500 pt-1">
                    The PDF binary is ready for download & print. You can retry rasterization, switch to Document Layout, or download directly.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRenderingError(null);
                      setRenderAttempt((a) => a + 1);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-[#F4C430] hover:bg-black font-extrabold text-xs transition-all cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    <span>Retry Canvas Render</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F4C430] hover:bg-[#E5B520] text-black font-extrabold text-xs transition-all cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Download PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('paper')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 font-bold text-xs text-neutral-800 transition-all cursor-pointer"
                  >
                    <FileText size={13} />
                    <span>Switch to Document Layout</span>
                  </button>
                </div>
              </div>
            )}

            <div
              ref={canvasContainerRef}
              className={`w-full flex flex-col items-center justify-center space-y-4 ${
                isRenderingPages || renderingError ? 'hidden' : ''
              }`}
            />
          </div>
        )}

        {/* State 4B: Document Paper View (High-Fidelity Printable DOM Page) */}
        {!isGenerating && (
          <div className={`w-full max-w-[820px] mx-auto bg-white rounded-sm shadow-2xl border border-neutral-300 p-8 sm:p-12 text-[#111111] font-sans relative my-2 min-h-[1000px] ${activeTab === 'paper' ? '' : 'hidden'}`}>
            {/* Academy Watermark Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.045] overflow-hidden select-none">
              <img
                src="/images/shs-academy-logo.png"
                alt="SHS Watermark"
                className="w-[450px] h-[450px] object-contain grayscale bg-transparent"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000c0808211bef4c03788e5a2c5.png';
                }}
              />
            </div>

            {/* Top Branded Header */}
            <div className="flex items-start justify-between border-b-2 border-neutral-900 pb-4 relative z-10">
              {/* Left: SHS Academy Logo */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 flex items-center justify-center shrink-0 bg-transparent">
                  <img
                    src="/images/shs-academy-logo.png"
                    alt="SHS Logo"
                    className="max-w-full max-h-full object-contain bg-transparent"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000c0808211bef4c03788e5a2c5.png';
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-neutral-900">
                    SHS VIRTUAL ACADEMY
                  </h1>
                  <p className="text-[11px] font-bold text-neutral-600 uppercase tracking-wide">
                    Department of Examinations & Academic Assessments
                  </p>
                </div>
              </div>

              {/* Right: Scholario LMS Lockup */}
              <div className="text-right">
                <div className="text-sm font-black text-neutral-900">Scholario</div>
                <div className="text-[10px] font-bold text-neutral-500">
                  Powered by Scholario LMS
                </div>
                <div className="text-[10px] font-extrabold text-amber-600">
                  scholario.me
                </div>
              </div>
            </div>

            {/* Test Title & Curriculum Bar */}
            <div className="text-center py-3 border-b border-neutral-200 relative z-10 space-y-0.5">
              <h2 className="text-sm sm:text-base font-black text-neutral-900 uppercase">
                {testSpec.title}
              </h2>
              <div className="text-xs font-semibold text-neutral-600">
                Grade {testSpec.grade} ({testSpec.stream || 'Science'}) • {testSpec.subject} • {testSpec.board.toUpperCase()} Curriculum
                {testSpec.chapter && testSpec.chapter !== 'All' ? ` • ${testSpec.chapter}` : ''}
              </div>
            </div>

            {/* Student Metadata Table Box */}
            <div className="my-4 p-3 bg-neutral-50 rounded-lg border border-neutral-300 text-xs relative z-10 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-bold text-neutral-700">
                <div>Student Name: <span className="font-normal border-b border-neutral-400 inline-block w-32"></span></div>
                <div>Roll No: <span className="font-normal border-b border-neutral-400 inline-block w-24"></span></div>
                <div className="sm:text-right">Date: <span className="font-normal">{testSpec.dueDate || new Date().toISOString().split('T')[0]}</span></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-bold text-neutral-700 pt-1 border-t border-neutral-200">
                <div>Subject: <span className="text-neutral-900">{testSpec.subject}</span></div>
                <div>Time Allowed: <span className="text-neutral-900">{testSpec.timeAllowedMinutes} Mins</span></div>
                <div className="sm:text-right">Total Marks: <span className="text-neutral-900">{testSpec.totalMarks}</span></div>
              </div>
              {testSpec.instructions && (
                <div className="text-[11px] text-neutral-500 italic pt-1 border-t border-neutral-200">
                  Instructions: {testSpec.instructions}
                </div>
              )}
            </div>

            {/* Section A: MCQs */}
            {mcqs.length > 0 && (
              <div className="my-5 relative z-10">
                <div className="bg-neutral-900 text-white px-3 py-1.5 rounded-sm flex items-center justify-between font-bold text-xs">
                  <span>SECTION – {sectionLetters[sectionLetterIdx++]} : MULTIPLE CHOICE QUESTIONS (MCQs)</span>
                  <span>[{mcqMarksTotal} Marks]</span>
                </div>
                <p className="text-[11px] text-neutral-500 italic my-2">
                  Note: Attempt all questions. Each question carries {testSpec.mcqMarksEach || 1} mark.
                </p>
                <div className="space-y-3 mt-3">
                  {mcqs.map((mcq, idx) => {
                    const isUrduQ = containsUrdu(mcq.question) || isUrduSubject;
                    return (
                      <div
                        key={mcq.id || idx}
                        dir={isUrduQ ? 'rtl' : 'ltr'}
                        className={`text-xs space-y-1.5 p-2.5 bg-neutral-50/50 rounded border border-neutral-200 ${
                          isUrduQ ? 'font-urdu text-right' : ''
                        }`}
                      >
                        <div className={`font-extrabold text-neutral-900 ${isUrduQ ? 'text-sm leading-relaxed' : ''}`}>
                          {isUrduQ ? `سوال ۱. (${idx + 1}) ` : `Q1. (${idx + 1}) `}
                          {renderLaTeXToText(mcq.question)}
                        </div>
                        <div
                          className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[11px] text-neutral-700 ${
                            isUrduQ ? 'pr-4 text-xs' : 'pl-4'
                          }`}
                        >
                          <div className="flex items-start gap-1.5">
                            <span className="font-bold shrink-0">{isUrduQ ? '(الف)' : '(A)'}</span>
                            <span>{renderLaTeXToText(mcq.options?.A || '')}</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="font-bold shrink-0">{isUrduQ ? '(ب)' : '(B)'}</span>
                            <span>{renderLaTeXToText(mcq.options?.B || '')}</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="font-bold shrink-0">{isUrduQ ? '(ج)' : '(C)'}</span>
                            <span>{renderLaTeXToText(mcq.options?.C || '')}</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="font-bold shrink-0">{isUrduQ ? '(د)' : '(D)'}</span>
                            <span>{renderLaTeXToText(mcq.options?.D || '')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section B: Short Questions */}
            {shortQuestions.length > 0 && (
              <div className="my-5 relative z-10">
                <div className="bg-neutral-900 text-white px-3 py-1.5 rounded-sm flex items-center justify-between font-bold text-xs">
                  <span>SECTION – {sectionLetters[sectionLetterIdx++]} : SHORT QUESTIONS</span>
                  <span>[{shortMarksTotal} Marks]</span>
                </div>
                <p className="text-[11px] text-neutral-500 italic my-2">
                  Note: Attempt any {testSpec.shortAttemptCount || shortQuestions.length} questions. Each question carries {testSpec.shortMarksEach || 2} marks.
                </p>
                <div className="space-y-2.5 mt-3">
                  {shortQuestions.map((sq, idx) => {
                    const roman = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'][idx] || `${idx + 1}`;
                    const isUrduQ = containsUrdu(sq.question) || isUrduSubject;
                    return (
                      <div
                        key={sq.id || idx}
                        dir={isUrduQ ? 'rtl' : 'ltr'}
                        className={`text-xs flex items-start justify-between gap-2 p-2.5 bg-neutral-50/50 rounded border border-neutral-200 ${
                          isUrduQ ? 'font-urdu text-right' : ''
                        }`}
                      >
                        <div className={`font-extrabold text-neutral-900 ${isUrduQ ? 'text-sm leading-relaxed' : ''}`}>
                          {isUrduQ ? `سوال ۲. (${roman}) ` : `Q2. (${roman}) `}
                          {renderLaTeXToText(sq.question)}
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500 shrink-0 mt-0.5">
                          [{sq.marks || testSpec.shortMarksEach || 2} Marks]
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section C: Long Questions */}
            {longQuestions.length > 0 && (
              <div className="my-5 relative z-10">
                <div className="bg-neutral-900 text-white px-3 py-1.5 rounded-sm flex items-center justify-between font-bold text-xs">
                  <span>SECTION – {sectionLetters[sectionLetterIdx++]} : DETAILED / LONG QUESTIONS</span>
                  <span>[{longMarksTotal} Marks]</span>
                </div>
                <p className="text-[11px] text-neutral-500 italic my-2">
                  Note: Attempt any {testSpec.longAttemptCount || longQuestions.length} questions. Each question carries {testSpec.longMarksEach || 5} marks.
                </p>
                <div className="space-y-3 mt-3">
                  {longQuestions.map((lq, idx) => {
                    const isUrduQ = containsUrdu(lq.question) || isUrduSubject;
                    return (
                      <div
                        key={lq.id || idx}
                        dir={isUrduQ ? 'rtl' : 'ltr'}
                        className={`text-xs space-y-1.5 p-3 bg-neutral-50/50 rounded border border-neutral-200 ${
                          isUrduQ ? 'font-urdu text-right' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 font-extrabold text-neutral-900">
                          <div className={isUrduQ ? 'text-sm leading-relaxed' : ''}>
                            {isUrduQ ? `سوال ${3 + idx}. ` : `Q${3 + idx}. `}
                            {renderLaTeXToText(lq.question)}
                          </div>
                          <span className="text-[10px] font-bold text-neutral-500 shrink-0 mt-0.5">
                            [{lq.marks || testSpec.longMarksEach || 5} Marks]
                          </span>
                        </div>
                        {lq.parts && lq.parts.length > 0 && (
                          <div className={`${isUrduQ ? 'pr-4' : 'pl-4'} space-y-1 text-[11px] text-neutral-700`}>
                            {lq.parts.map((p, pIdx) => (
                              <div key={pIdx} className="flex justify-between">
                                <span>{p.label} {renderLaTeXToText(p.text)}</span>
                                <span className="text-neutral-500 font-medium">({p.marks} Marks)</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Teacher's Reference & Marking Scheme Box */}
            <div className="my-6 pt-4 border-t-2 border-dashed border-amber-300 relative z-10">
              <div className="bg-amber-600 text-white px-3 py-1 rounded-sm text-xs font-black flex items-center justify-between">
                <span>OFFICIAL ANSWER KEY & TEACHER MARKING SCHEME</span>
                <span className="text-[10px] uppercase bg-amber-800 px-1.5 py-0.5 rounded">Confidential</span>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {mcqs.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded border border-amber-200">
                    <h5 className="font-black text-amber-900 mb-2">MCQ Answers</h5>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      {mcqs.map((m, i) => (
                        <div key={i} className="text-neutral-800">
                          <strong className="text-neutral-900">Q1.({i + 1}):</strong> [{m.correctAnswer}]
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {shortQuestions.some((s) => s.modelAnswer) && (
                  <div className="p-3 bg-amber-50 rounded border border-amber-200">
                    <h5 className="font-black text-amber-900 mb-2">Short Question Model Answers</h5>
                    <div className="space-y-1.5 text-[11px] text-neutral-700">
                      {shortQuestions.slice(0, 3).map((s, i) => s.modelAnswer && (
                        <div key={i}>
                          <strong>({i + 1}):</strong> {renderLaTeXToText(s.modelAnswer)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Running Footer Line */}
            <div className="mt-8 pt-3 border-t border-neutral-300 flex items-center justify-between text-[10px] text-neutral-500 font-semibold relative z-10">
              <div>SHS Virtual Academy • Confidential Examination Paper</div>
              <div>Powered by Scholario LMS (scholario.me)</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfPreviewViewer;
