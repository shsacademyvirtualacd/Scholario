import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface PdfViewerProps {
  fileUrl: string;
  authHeaders?: Record<string, string>;
}

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ fileUrl, authHeaders }) => {
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [loadedBytes, setLoadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load PDF.js from CDN dynamically if not present
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadPdfJs = async () => {
      if (window.pdfjsLib) return window.pdfjsLib;
      return new Promise<any>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve(window.pdfjsLib);
          } else {
            reject(new Error('PDF.js failed to load'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load PDF.js script from CDN'));
        document.head.appendChild(script);
      });
    };

    const fetchDocument = async () => {
      if (!fileUrl) return;
      setLoading(true);
      setError(null);
      setLoadProgress(0);
      setLoadedBytes(0);
      setTotalBytes(0);

      try {
        const lib = await loadPdfJs();
        if (!mounted) return;

        let arrayBuffer: ArrayBuffer | null = null;

        try {
          const response = await fetch(fileUrl, {
            headers: authHeaders,
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const contentLengthHeader = response.headers.get('Content-Length') || response.headers.get('content-length');
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
                    const pct = Math.min(99, Math.round((loaded / total) * 100));
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
          console.warn('Direct stream fetch failed, falling back to PDF.js default loader:', fetchErr);
        }

        if (!mounted) return;

        let loadingTask: any;
        if (arrayBuffer) {
          if (mounted) setLoadProgress(100);
          loadingTask = lib.getDocument({ data: arrayBuffer });
        } else {
          loadingTask = lib.getDocument({
            url: fileUrl,
            httpHeaders: authHeaders,
            rangeChunkSize: 65536,
            disableAutoFetch: false,
            disableStream: false
          });

          loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
            if (!mounted) return;
            if (progressData && progressData.total > 0) {
              const pct = Math.min(100, Math.round((progressData.loaded / progressData.total) * 100));
              setLoadProgress(pct);
              setTotalBytes(progressData.total);
              setLoadedBytes(progressData.loaded);
            } else if (progressData && progressData.loaded > 0) {
              setLoadedBytes(progressData.loaded);
            }
          };
        }

        const doc = await loadingTask.promise;
        if (!mounted) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        if (mounted) {
          console.error('Error loading PDF document:', err);
          setError(err?.message || 'Failed to load PDF document.');
          setLoading(false);
        }
      }
    };

    fetchDocument();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [fileUrl]);

  // Render current page onto canvas
  useEffect(() => {
    let renderTask: any = null;
    let mounted = true;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current || currentPage < 1 || currentPage > totalPages) return;
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (!mounted) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException' && mounted) {
          console.error('Page rendering error:', err);
        }
      }
    };

    renderPage();

    return () => {
      mounted = false;
      if (renderTask && typeof renderTask.cancel === 'function') {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale, totalPages]);

  if (loading) {
    const formattedLoaded = (loadedBytes / (1024 * 1024)).toFixed(2);
    const formattedTotal = totalBytes > 0 ? (totalBytes / (1024 * 1024)).toFixed(2) : null;

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-[#E5E5E5] min-h-[400px]">
        {/* Animated loader ring with centered percentage */}
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-20 h-20 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base font-black text-[#111111] font-mono">
              {loadProgress > 0 ? `${loadProgress}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Status text */}
        <h4 className="text-sm font-extrabold text-[#111111] mb-1">
          Loading Document
        </h4>
        
        {/* Progress bar container */}
        <div className="w-full max-w-xs bg-gray-100 rounded-full h-2.5 overflow-hidden my-3 border border-[#E5E5E5]">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-200 ease-out"
            style={{ width: `${Math.max(5, loadProgress)}%` }}
          />
        </div>

        {/* Detailed bytes info */}
        <p className="text-xs font-semibold text-[#737373]">
          {formattedTotal ? (
            `${formattedLoaded} MB of ${formattedTotal} MB (${loadProgress}%)`
          ) : loadedBytes > 0 ? (
            `${formattedLoaded} MB loaded`
          ) : (
            'Preparing document...'
          )}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-red-50 rounded-xl border border-red-200 min-h-[400px]">
        <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
        <p className="text-sm font-bold text-red-700 mb-1">Could not display PDF</p>
        <p className="text-xs text-red-600 max-w-md text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#F5F5F5] rounded-xl border border-[#E5E5E5] overflow-hidden">
      {/* Controls Bar */}
      <div className="h-12 border-b border-[#E5E5E5] bg-white px-4 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-[#E5E5E5] hover:bg-[#F5F5F5] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-[#111111] min-w-[70px] text-center">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-[#E5E5E5] hover:bg-[#F5F5F5] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(s => Math.max(0.6, s - 0.2))}
            disabled={scale <= 0.6}
            className="p-1.5 rounded-lg border border-[#E5E5E5] hover:bg-[#F5F5F5] disabled:opacity-40 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-bold text-[#525252] min-w-[48px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(s => Math.min(2.4, s + 0.2))}
            disabled={scale >= 2.4}
            className="p-1.5 rounded-lg border border-[#E5E5E5] hover:bg-[#F5F5F5] disabled:opacity-40 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-[#E5E5E5]/40">
        <div className="bg-white shadow-lg border border-[#E5E5E5] rounded-md overflow-hidden transition-all duration-150">
          <canvas ref={canvasRef} className="max-w-full h-auto block" />
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
