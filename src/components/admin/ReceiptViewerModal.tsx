import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, FileText, ExternalLink, Maximize2 } from 'lucide-react';
import PdfViewer from '../ui/PdfViewer';

export interface ReceiptViewerData {
  url: string;
  studentName: string;
  filename?: string;
  fileType?: string;
  uploadedAt?: string;
}

interface ReceiptViewerModalProps {
  data: ReceiptViewerData | null;
  onClose: () => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({ data, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!data) return null;

  const isPdf =
    data.fileType?.includes('pdf') ||
    data.url.toLowerCase().includes('.pdf') ||
    data.filename?.toLowerCase().endsWith('.pdf');

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const downloadUrl = data.url.includes('/view/')
    ? data.url.replace('/view/', '/dl/')
    : data.url;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-viewer-title"
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white animate-in fade-in duration-200"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-black/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 truncate">
          <div className="w-8 h-8 rounded-lg bg-[#F4C430]/20 text-[#F4C430] flex items-center justify-center shrink-0">
            {isPdf ? <FileText size={18} /> : <Maximize2 size={18} />}
          </div>
          <div className="truncate">
            <h2 id="receipt-viewer-title" className="text-sm font-black truncate text-white">
              Fee Proof: {data.studentName}
            </h2>
            <p className="text-[11px] text-white/60 truncate">
              {data.filename || 'payment_receipt'} • {data.uploadedAt ? new Date(data.uploadedAt).toLocaleString() : 'Uploaded'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isPdf && (
            <div className="flex items-center bg-white/10 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                aria-label="Zoom out"
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-[11px] font-mono px-1.5 min-w-[3rem] text-center text-white/90">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                aria-label="Zoom in"
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title="Zoom In (+)"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                aria-label="Reset zoom"
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          )}

          <a
            href={downloadUrl}
            download={data.filename || 'fee_receipt'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors cursor-pointer"
            title="Download original receipt"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Download</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white transition-colors ml-1"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 overflow-auto flex items-center justify-center p-4 relative ${
          scale > 1 && !isPdf ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
      >
        {isPdf ? (
          <div className="w-full h-full max-w-5xl bg-white dark:bg-[#151518] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            <PdfViewer
              fileUrl={data.url}
              downloadFileName={data.filename || `Receipt_${data.studentName}.pdf`}
              title="Receipt Document"
            />
          </div>
        ) : (
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 150ms ease-out',
            }}
            className="max-w-full max-h-full flex items-center justify-center"
          >
            <img
              src={data.url}
              alt={`Receipt proof from ${data.studentName}`}
              className="max-h-[82vh] max-w-[92vw] object-contain rounded-xl shadow-2xl select-none"
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* Bottom Footer Bar */}
      <div className="px-6 py-2.5 border-t border-white/10 bg-black/80 flex items-center justify-between text-xs text-white/60">
        <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-white font-mono text-[10px]">Esc</kbd> to exit full screen</span>
        <span>Verified private storage • Only authorized admins &amp; student have access</span>
      </div>
    </div>
  );
};
