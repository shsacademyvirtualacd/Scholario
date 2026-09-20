import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Loader2
} from 'lucide-react';

export interface MarksheetInspectorData {
  applicant_name: string;
  class_grade?: string;
  board?: string;
  claimed_marks_percentage?: number;
  proof_document_url: string;
}

interface MarksheetInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MarksheetInspectorData | null;
}

export const MarksheetInspectorModal: React.FC<MarksheetInspectorModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [safeBlobUrl, setSafeBlobUrl] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{
    type: 'image' | 'pdf' | 'other';
    mime: string;
    sizeKb: number;
    isDataUrl: boolean;
  }>({
    type: 'image',
    mime: 'image/jpeg',
    sizeKb: 0,
    isDataUrl: false
  });

  const blobUrlRef = useRef<string | null>(null);

  // Reset state and process URL whenever data changes or modal opens
  useEffect(() => {
    if (!isOpen || !data?.proof_document_url) {
      setIsLoading(false);
      setHasError(false);
      setErrorMessage('');
      setZoom(1);
      setRotation(0);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
        setSafeBlobUrl(null);
      }
      return;
    }

    let isMounted = true;
    const rawUrl = data.proof_document_url.trim();

    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    setZoom(1);
    setRotation(0);

    // Clean up previous blob URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
      setSafeBlobUrl(null);
    }

    try {
      const isDataUrl = rawUrl.startsWith('data:');
      let mime = 'image/jpeg';
      let type: 'image' | 'pdf' | 'other' = 'image';
      let sizeKb = 0;

      if (isDataUrl) {
        // Extract MIME type from data URL (e.g. data:image/png;base64,...)
        const mimeMatch = rawUrl.match(/^data:([^;]+);base64,/i);
        if (mimeMatch && mimeMatch[1]) {
          mime = mimeMatch[1].toLowerCase();
        }

        // Calculate approximate size in KB from base64 string length
        const base64Index = rawUrl.indexOf(';base64,');
        if (base64Index > -1) {
          const base64Str = rawUrl.substring(base64Index + 8);
          sizeKb = Math.round((base64Str.length * 3) / (4 * 1024));
        }

        if (mime.includes('pdf')) {
          type = 'pdf';
        } else if (mime.startsWith('image/')) {
          type = 'image';
        } else {
          type = 'other';
        }

        // Convert base64 data URL to a local Blob URL safely without freezing Chrome's renderer
        // Using fetch on data URI is natively supported and offloads decoding to browser background thread
        fetch(rawUrl)
          .then((res) => res.blob())
          .then((blob) => {
            if (!isMounted) return;
            const objectUrl = URL.createObjectURL(blob);
            blobUrlRef.current = objectUrl;
            setSafeBlobUrl(objectUrl);
            setFileMeta({ type, mime, sizeKb: Math.round(blob.size / 1024), isDataUrl: true });
            setIsLoading(false);
          })
          .catch((err) => {
            if (!isMounted) return;
            console.warn('[MarksheetInspectorModal] Failed to convert data URL to blob:', err);
            // Fallback: direct data URL can still be rendered in <img> if reasonable size
            if (sizeKb > 25000) {
              setHasError(true);
              setErrorMessage('The uploaded document is exceptionally large (>25MB) and cannot be safely rendered inline.');
            } else {
              setSafeBlobUrl(rawUrl);
            }
            setFileMeta({ type, mime, sizeKb, isDataUrl: true });
            setIsLoading(false);
          });
      } else {
        // Standard HTTP / HTTPS or relative URL
        const lower = rawUrl.toLowerCase();
        if (lower.includes('.pdf') || lower.includes('/pdf') || lower.includes('application/pdf')) {
          type = 'pdf';
          mime = 'application/pdf';
        } else {
          type = 'image';
          mime = 'image/jpeg';
        }

        setFileMeta({ type, mime, sizeKb: 0, isDataUrl: false });
        setSafeBlobUrl(rawUrl);
        setIsLoading(false);
      }
    } catch (err: any) {
      if (!isMounted) return;
      console.error('[MarksheetInspectorModal] URL processing error:', err);
      setHasError(true);
      setErrorMessage(err.message || 'Failed to process document URL.');
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [isOpen, data?.proof_document_url]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const downloadFilename = `Marksheet_${(data.applicant_name || 'student').replace(/\s+/g, '_')}_Grade${data.class_grade || '9'}.${
    fileMeta.type === 'pdf' ? 'pdf' : 'jpg'
  }`;

  const handleSafeOpenInNewTab = () => {
    const targetUrl = safeBlobUrl || data.proof_document_url;
    if (!targetUrl) return;

    if (fileMeta.isDataUrl && safeBlobUrl) {
      // Opening a blob URL in a new tab is completely safe and won't crash Chrome
      window.open(safeBlobUrl, '_blank', 'noopener,noreferrer');
    } else if (fileMeta.isDataUrl && !safeBlobUrl) {
      // If it's a raw data URL without a blob, open via an HTML container window rather than raw top-level data: navigation
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Marksheet - ${data.applicant_name}</title>
              <style>
                body { margin: 0; background: #111; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
                img { max-width: 98vw; max-height: 98vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${data.proof_document_url}" alt="Marksheet Proof" />
            </body>
          </html>
        `);
        win.document.close();
      }
    } else {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = () => {
    const targetUrl = safeBlobUrl || data.proof_document_url;
    if (!targetUrl) return;

    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = downloadFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#18181B] text-white border border-[#27272A] rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272A] bg-[#121215]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  Marksheet Inspector
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold uppercase">
                  {data.board || 'BOARD'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-bold">
                  Grade {data.class_grade || '9'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                <span className="font-bold text-zinc-200">{data.applicant_name}</span>
                {data.claimed_marks_percentage !== undefined && (
                  <> • Claimed Marks: <span className="font-mono font-bold text-amber-400">{data.claimed_marks_percentage}%</span></>
                )}
                {fileMeta.sizeKb > 0 && (
                  <> • Size: <span className="font-mono text-zinc-300">{fileMeta.sizeKb > 1024 ? `${(fileMeta.sizeKb / 1024).toFixed(1)} MB` : `${fileMeta.sizeKb} KB`}</span></>
                )}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Zoom Controls (for images) */}
            {fileMeta.type === 'image' && !hasError && !isLoading && (
              <div className="hidden sm:flex items-center bg-zinc-900 border border-zinc-700 rounded-xl p-0.5 mr-1">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                  className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="text-[11px] font-mono px-2 text-zinc-400 select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3.5, Number((z + 0.25).toFixed(2))))}
                  className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors ml-0.5"
                  title="Rotate 90 degrees"
                >
                  <RotateCw size={15} />
                </button>
              </div>
            )}

            {/* Open in safe new tab */}
            <button
              type="button"
              onClick={handleSafeOpenInNewTab}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
              title="Open document in a dedicated tab"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">New Tab</span>
            </button>

            {/* Download file */}
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-black transition-colors"
              title="Download original file"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors ml-1"
              title="Close viewer (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewer Viewport */}
        <div className="relative flex-1 min-h-[350px] max-h-[72vh] overflow-auto bg-[#09090B] flex items-center justify-center p-4 select-none">
          {/* Background pattern for transparent/document contrast */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#52525b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center gap-3 text-zinc-400 py-16">
              <Loader2 size={32} className="animate-spin text-amber-400" />
              <p className="text-xs font-medium">Preparing marksheet preview safely...</p>
            </div>
          )}

          {/* Error / Incompatible State */}
          {!isLoading && hasError && (
            <div className="max-w-md w-full bg-zinc-900/90 border border-red-900/40 rounded-2xl p-6 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-full bg-red-950/60 text-red-400 border border-red-800/40 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold text-white">Failed to Preview Document Inline</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {errorMessage || 'The marksheet proof file could not be rendered directly inside the browser viewport.'}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold rounded-xl transition-colors shadow-sm"
                >
                  <Download size={14} />
                  <span>Download Marksheet File</span>
                </button>
                <button
                  type="button"
                  onClick={handleSafeOpenInNewTab}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>Open in External Tab</span>
                </button>
              </div>
            </div>
          )}

          {/* PDF Viewport */}
          {!isLoading && !hasError && fileMeta.type === 'pdf' && safeBlobUrl && (
            <div className="w-full h-full min-h-[550px] flex flex-col items-center justify-center bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">
              <iframe
                src={`${safeBlobUrl}#toolbar=1&navpanes=0`}
                title="Marksheet PDF Preview"
                className="w-full h-[65vh] border-0 rounded-xl"
                onError={() => {
                  setHasError(true);
                  setErrorMessage('Embedded PDF preview blocked by browser policy. Please use the Download or New Tab button.');
                }}
              />
            </div>
          )}

          {/* Image Viewport */}
          {!isLoading && !hasError && fileMeta.type === 'image' && safeBlobUrl && (
            <div
              className="transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            >
              <img
                src={safeBlobUrl}
                alt={`Marksheet Proof for ${data.applicant_name}`}
                className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-2xl border border-zinc-800 bg-white"
                onLoad={() => {
                  setIsLoading(false);
                  setHasError(false);
                }}
                onError={() => {
                  setHasError(true);
                  setErrorMessage('The image could not be rendered or was uploaded in an unsupported format.');
                }}
                loading="eager"
              />
            </div>
          )}
        </div>

        {/* Footer Verification Guidance */}
        <div className="px-5 py-3 border-t border-[#27272A] bg-[#121215] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
            <span>
              Verify official board roll number, student name (<strong className="text-zinc-200">{data.applicant_name}</strong>), and total marks match the claimed <strong className="text-amber-400">{data.claimed_marks_percentage}%</strong>.
            </span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {fileMeta.type === 'image' && (
              <span className="text-[11px] text-zinc-500 hidden md:inline">
                Tip: Use zoom & rotate buttons to inspect fine marksheet print.
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
