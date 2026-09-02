import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  downloadUrl: string;
  filename: string;
  fileSize?: number | null;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  downloadUrl,
  filename,
  fileSize,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number>(1);

  // Reset zoom on open/close
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.002;
    setScale((prev) => {
      const next = Math.min(Math.max(prev + delta, 1), 4);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  // Mouse drag when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartScaleRef.current = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchStartDistRef.current;
      const nextScale = Math.min(Math.max(touchStartScaleRef.current * ratio, 1), 4);
      setScale(nextScale);
      if (nextScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
    setIsDragging(false);
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="image-viewer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col select-none touch-none"
          onClick={onClose}
        >
          {/* Top Bar */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-black/40 text-white border-b border-white/10 shrink-0 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-0 pr-4">
              <p className="text-sm font-semibold truncate text-white">{filename}</p>
              {fileSize ? (
                <p className="text-[11px] text-white/60">{formatSize(fileSize)}</p>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Zoom Controls */}
              <div className="hidden sm:flex items-center bg-white/10 rounded-xl p-0.5 mr-2">
                <button
                  type="button"
                  id="btn-zoom-out"
                  onClick={handleZoomOut}
                  disabled={scale <= 1}
                  className="p-1.5 hover:bg-white/20 rounded-lg text-white disabled:opacity-30 transition-all"
                  title="Zoom out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs px-2 font-mono text-white/80">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  id="btn-zoom-in"
                  onClick={handleZoomIn}
                  disabled={scale >= 4}
                  className="p-1.5 hover:bg-white/20 rounded-lg text-white disabled:opacity-30 transition-all"
                  title="Zoom in"
                >
                  <ZoomIn size={16} />
                </button>
                {scale > 1 && (
                  <button
                    type="button"
                    id="btn-zoom-reset"
                    onClick={handleResetZoom}
                    className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-all ml-0.5"
                    title="Reset zoom"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>

              {/* Download Button */}
              <a
                href={downloadUrl}
                download={filename}
                id="btn-image-download"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1.5 text-xs transition-all"
                title="Download image"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={16} />
                <span className="hidden sm:inline">Save</span>
              </a>

              {/* Close Button */}
              <button
                type="button"
                id="btn-image-close"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all ml-1"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Viewport & Image Canvas */}
          <div
            className="flex-1 flex items-center justify-center p-4 overflow-hidden relative cursor-default"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <motion.img
              src={imageUrl}
              alt={filename}
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (scale === 1) {
                  setScale(2);
                } else {
                  setScale(1);
                  setPosition({ x: 0, y: 0 });
                }
              }}
              className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg shadow-2xl select-none"
            />
          </div>

          {/* Bottom Hint */}
          <div className="pb-3 text-center text-[11px] text-white/40 shrink-0 pointer-events-none">
            {scale > 1
              ? 'Drag to pan • Double-tap or click to reset'
              : 'Pinch or click to zoom • Tap outside or Esc to close'}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
