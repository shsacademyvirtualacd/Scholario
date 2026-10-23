import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Loader2,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker source safely with bundled and CDN fallbacks
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).href;
  } catch (workerErr) {
    console.warn('[PdfViewer] Bundled worker URL resolution error, using unpkg fallback:', workerErr);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
}

export interface PdfViewerProps {
  fileUrl: string;
  authHeaders?: Record<string, string>;
  downloadFileName?: string;
  title?: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  fileUrl,
  authHeaders,
  downloadFileName = 'document.pdf',
  title = 'Document',
}) => {
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [loadedBytes, setLoadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [failingStep, setFailingStep] = useState<string | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.1);
  const [retryNonce, setRetryNonce] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  // 1. Fetch & Load Document via PDF.js
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadDocument = async () => {
      // Step: URL Validation
      if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.trim()) {
        const step = 'url';
        console.error('[PdfViewer:URL_VALIDATION_ERROR]', { step, url: fileUrl });
        if (mounted) {
          setFailingStep(step);
          setError('Invalid or empty PDF document address.');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      setFailingStep(null);
      setLoadProgress(5);
      setLoadedBytes(0);
      setTotalBytes(0);

      let arrayBuffer: ArrayBuffer | null = null;

      // Step: Fetch / Network Request
      try {
        let effectiveHeaders = authHeaders || {};

        // If URL contains embedded ?token=, allow standard fetch
        const response = await fetch(fileUrl, {
          headers: effectiveHeaders,
          signal: controller.signal,
        });

        if (!response.ok) {
          const step = response.status === 401 || response.status === 403 ? 'permissions' : 'fetch';
          const errMsg = `HTTP ${response.status}: ${response.statusText || 'Failed to download PDF'}`;
          console.error(`[PdfViewer:${step.toUpperCase()}_ERROR]`, {
            step,
            url: fileUrl,
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
          });
          throw new Error(errMsg);
        }

        // Check content type
        const contentType = response.headers.get('content-type') || '';
        if (contentType && !contentType.includes('pdf') && !contentType.includes('octet-stream')) {
          console.warn('[PdfViewer:MIME_WARNING] Response Content-Type is not application/pdf:', contentType);
        }

        const contentLengthHeader =
          response.headers.get('Content-Length') || response.headers.get('content-length');
        const total = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
        if (total > 0 && mounted) {
          setTotalBytes(total);
        }

        if (response.body) {
          const reader = response.body.getReader();
          let loaded = 0;
          const chunks: Uint8Array[] = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!mounted) {
              reader.cancel();
              return;
            }

            if (value) {
              chunks.push(value);
              loaded += value.length;
              if (mounted) {
                setLoadedBytes(loaded);
                if (total > 0) {
                  const pct = Math.min(95, Math.round((loaded / total) * 100));
                  setLoadProgress(pct);
                }
              }
            }
          }

          const concatenated = new Uint8Array(loaded);
          let offset = 0;
          for (const chunk of chunks) {
            concatenated.set(chunk, offset);
            offset += chunk.length;
          }
          arrayBuffer = concatenated.buffer;
        } else {
          const blob = await response.blob();
          arrayBuffer = await blob.arrayBuffer();
        }
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') return;

        console.error('[PdfViewer:FETCH_ERROR]', {
          step: 'fetch',
          url: fileUrl,
          message: fetchErr.message,
        });

        // If direct fetch threw, we can attempt PDF.js native loader as fallback
        console.warn('[PdfViewer] Direct fetch failed, attempting pdfjsLib.getDocument URL loader:', fetchErr);
      }

      if (!mounted) return;

      // Step: Parse PDF Document with PDF.js
      try {
        let loadingTask: any;

        if (arrayBuffer && arrayBuffer.byteLength > 0) {
          if (mounted) setLoadProgress(98);
          loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
          });
        } else {
          loadingTask = pdfjsLib.getDocument({
            url: fileUrl,
            httpHeaders: authHeaders,
            withCredentials: false,
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
          });

          loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
            if (!mounted) return;
            if (progressData && progressData.total > 0) {
              const pct = Math.min(95, Math.round((progressData.loaded / progressData.total) * 100));
              setLoadProgress(pct);
              setTotalBytes(progressData.total);
              setLoadedBytes(progressData.loaded);
            }
          };
        }

        const doc = await loadingTask.promise;
        if (!mounted) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setLoadProgress(100);
        setLoading(false);
      } catch (parseErr: any) {
        if (parseErr?.name === 'AbortError') return;
        const step = 'render';
        console.error('[PdfViewer:RENDER_PARSE_ERROR]', {
          step,
          url: fileUrl,
          name: parseErr?.name,
          message: parseErr?.message,
        });

        if (mounted) {
          setFailingStep(step);
          setError(parseErr?.message || 'Failed to read or render PDF document data.');
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [fileUrl, authHeaders, retryNonce]);

  // 2. Render Page onto HTML5 Canvas with High-DPI Support
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || currentPage < 1 || currentPage > totalPages) {
      return;
    }

    // Cancel any in-flight render task
    if (renderTaskRef.current && typeof renderTaskRef.current.cancel === 'function') {
      try {
        renderTaskRef.current.cancel();
      } catch {}
      renderTaskRef.current = null;
    }

    try {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      // Handle High-DPI displays (Retina, Android mobile WebViews)
      const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const viewport = page.getViewport({ scale });

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      await renderTask.promise;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('[PdfViewer:PAGE_RENDER_ERROR]', {
          step: 'render',
          page: currentPage,
          scale,
          message: err?.message,
        });
      }
    }
  }, [pdfDoc, currentPage, scale, totalPages]);

  useEffect(() => {
    renderCurrentPage();

    return () => {
      if (renderTaskRef.current && typeof renderTaskRef.current.cancel === 'function') {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [renderCurrentPage]);

  // Direct download handler
  const handleDownloadFallback = () => {
    if (!fileUrl) return;
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = downloadFileName.endsWith('.pdf') ? downloadFileName : `${downloadFileName}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('[PdfViewer:DOWNLOAD_TRIGGER_ERROR]', e);
      window.open(fileUrl, '_blank');
    }
  };

  // ── Render: Loading Spinner State ──
  if (loading) {
    const formattedLoaded = (loadedBytes / (1024 * 1024)).toFixed(1);
    const formattedTotal = totalBytes > 0 ? (totalBytes / (1024 * 1024)).toFixed(1) : null;

    return (
      <div className="w-full h-full min-h-[380px] flex flex-col items-center justify-center p-6 sm:p-8 bg-neutral-50 dark:bg-[#111114] rounded-2xl border border-black/[0.08] dark:border-white/[0.08]">
        {/* Animated circular loader ring */}
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full border-4 border-neutral-200 dark:border-neutral-800 border-t-[#F2C230] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-black text-neutral-900 dark:text-white font-mono">
              {loadProgress > 0 ? `${loadProgress}%` : '...'}
            </span>
          </div>
        </div>

        <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
          Loading Document
        </h4>

        {/* Progress bar */}
        <div className="w-full max-w-xs bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden my-2.5">
          <div
            className="bg-[#F2C230] h-full rounded-full transition-all duration-200 ease-out"
            style={{ width: `${Math.max(5, loadProgress)}%` }}
          />
        </div>

        <p className="text-xs text-neutral-500 font-medium">
          {formattedTotal
            ? `${formattedLoaded} MB / ${formattedTotal} MB (${loadProgress}%)`
            : loadedBytes > 0
            ? `${formattedLoaded} MB downloaded`
            : 'Connecting to document server...'}
        </p>
      </div>
    );
  }

  // ── Render: Error State with Retry & Download PDF buttons ──
  if (error) {
    return (
      <div className="w-full h-full min-h-[380px] flex flex-col items-center justify-center p-6 sm:p-8 bg-neutral-50 dark:bg-[#151518] rounded-2xl border border-rose-300 dark:border-rose-900/60 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <AlertCircle size={28} />
        </div>

        <div className="space-y-1 max-w-md">
          <h4 className="text-base font-bold text-neutral-900 dark:text-white">
            Could not open PDF document
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            {error}
          </p>
          {failingStep && (
            <p className="text-[11px] font-mono text-rose-600 dark:text-rose-400 uppercase tracking-wider pt-1">
              Failing step: {failingStep}
            </p>
          )}
        </div>

        {/* Action Buttons: Retry & Fallback Download */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setRetryNonce((n) => n + 1)}
            className="min-h-[40px] px-4 rounded-xl text-xs font-bold bg-[#F2C230] hover:bg-[#e0b024] text-neutral-950 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RotateCcw size={14} />
            <span>Retry Loading</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadFallback}
            className="min-h-[40px] px-4 rounded-xl text-xs font-bold bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Interactive PDF Viewer Canvas with Controls ──
  return (
    <div className="w-full h-full min-h-[420px] flex flex-col bg-neutral-100 dark:bg-[#0e0e11] rounded-2xl border border-black/[0.08] dark:border-white/[0.08] overflow-hidden shadow-xs">
      {/* Controls Bar */}
      <div className="h-12 border-b border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#161619] px-3 sm:px-4 flex items-center justify-between shrink-0 gap-2">
        {/* Page Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="w-8 h-8 rounded-lg border border-black/[0.08] dark:border-white/[0.08] hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-xs font-bold text-neutral-900 dark:text-white min-w-[75px] text-center select-none">
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="w-8 h-8 rounded-lg border border-black/[0.08] dark:border-white/[0.08] hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Zoom & Download Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.6, Number((s - 0.2).toFixed(1))))}
            disabled={scale <= 0.6}
            className="w-8 h-8 rounded-lg border border-black/[0.08] dark:border-white/[0.08] hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>

          <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300 min-w-[42px] text-center select-none font-mono">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={() => setScale((s) => Math.min(2.5, Number((s + 0.2).toFixed(1))))}
            disabled={scale >= 2.5}
            className="w-8 h-8 rounded-lg border border-black/[0.08] dark:border-white/[0.08] hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn size={15} />
          </button>

          <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 mx-1 hidden sm:block" />

          {/* Download direct button */}
          <button
            type="button"
            onClick={handleDownloadFallback}
            className="p-1.5 px-2.5 rounded-lg border border-black/[0.08] dark:border-white/[0.08] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold hidden sm:flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download PDF file"
          >
            <Download size={13} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Canvas Viewport Scroll Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-3 sm:p-5 flex justify-center items-start bg-neutral-200/50 dark:bg-black/40"
      >
        <div className="bg-white rounded-lg shadow-md border border-black/[0.08] dark:border-white/[0.1] overflow-hidden transition-all duration-150 max-w-full">
          <canvas ref={canvasRef} className="block max-w-full h-auto" />
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
