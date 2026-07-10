import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load PDF.js from CDN dynamically if not present
  useEffect(() => {
    let mounted = true;

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
      try {
        const lib = await loadPdfJs();
        if (!mounted) return;
        
        // Use rangeChunkSize to support progressive range/chunk loading
        const loadingTask = lib.getDocument({
          url: fileUrl,
          httpHeaders: authHeaders,
          rangeChunkSize: 65536,
          disableAutoFetch: false,
          disableStream: false
        });
        
        const doc = await loadingTask.promise;
        if (!mounted) return;
        
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err: any) {
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
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-[#E5E5E5] min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-[#525252]">Loading document progressively...</p>
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
