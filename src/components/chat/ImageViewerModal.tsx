import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Forward,
  Camera,
  MoreVertical,
  Smile,
  Send,
  Check,
  Copy,
  Info,
  MessageSquare,
  X,
} from 'lucide-react';

export interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  downloadUrl: string;
  filename: string;
  fileSize?: number | null;
  senderName?: string;
  timestamp?: string;
  caption?: string;
  onReply?: (text: string) => void | Promise<void>;
  onForward?: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  downloadUrl,
  filename,
  fileSize,
  senderName,
  timestamp,
  caption,
  onReply,
  onForward,
}) => {
  // Zoom & Pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number>(1);

  // WhatsApp-style Overlay Visibility State (default visible on open, toggles on single tap)
  const [showControls, setShowControls] = useState(true);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInputFocusedRef = useRef(false);

  // Header Dropdown & Info state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Bottom Reply Bar State
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  // Tap vs Pan tracking
  const pointerStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const hasMovedRef = useRef<boolean>(false);

  const cancelAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);

  const startAutoHideTimer = useCallback(
    (delay = 2800) => {
      cancelAutoHideTimer();
      autoHideTimerRef.current = setTimeout(() => {
        // Only auto-hide if menu is not open and user is not typing in the reply input
        if (!isMenuOpen && !isInputFocusedRef.current) {
          setShowControls(false);
        }
      }, delay);
    },
    [cancelAutoHideTimer, isMenuOpen]
  );

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setShowControls(true);
      setIsMenuOpen(false);
      setShowDetails(false);
      setReplyText('');
      setReplySuccess(false);
      startAutoHideTimer(2800);
    } else {
      cancelAutoHideTimer();
    }
    return () => cancelAutoHideTimer();
  }, [isOpen, imageUrl, startAutoHideTimer, cancelAutoHideTimer]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (isMenuOpen) {
          setIsMenuOpen(false);
        } else if (showDetails) {
          setShowDetails(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMenuOpen, showDetails, onClose]);

  // Format timestamp like WhatsApp ("Today at 2:30 PM")
  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) return `Today at ${timeStr}`;

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return `Yesterday at ${timeStr}`;

      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
    } catch {
      return '';
    }
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const displaySenderName = senderName || 'Photo';
  const formattedTime = formatTimestamp(timestamp);

  // Zoom handlers
  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale((prev) => Math.min(prev + 0.5, 4));
    startAutoHideTimer(3500);
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
    startAutoHideTimer(3500);
  };

  const handleResetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
    startAutoHideTimer(3500);
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

  // Single tap listener that toggles overlay visibility
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    hasMovedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    if (dx > 8 || dy > 8) {
      hasMovedRef.current = true;
    }
  };

  const handleViewportTap = () => {
    // If the user was dragging/panning, do not toggle overlay
    if (hasMovedRef.current) return;
    const elapsed = Date.now() - pointerStartRef.current.time;
    if (elapsed > 350) return; // long press ignored

    setShowControls((prev) => {
      const next = !prev;
      if (next) {
        startAutoHideTimer(3200);
      } else {
        cancelAutoHideTimer();
        setIsMenuOpen(false);
        setShowDetails(false);
      }
      return next;
    });
  };

  // Drag when zoomed in
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
      hasMovedRef.current = true;
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
      hasMovedRef.current = true;
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
      hasMovedRef.current = true;
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
    setIsDragging(false);
  };

  // Forward action
  const handleForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onForward) {
      onForward();
    } else if (navigator.share) {
      navigator.share({
        title: filename,
        url: imageUrl,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  // Copy link action
  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(imageUrl);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2200);
    }
    setIsMenuOpen(false);
  };

  // Send Reply action
  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || isSendingReply) return;

    const textToSend = replyText.trim();
    setIsSendingReply(true);

    try {
      if (onReply) {
        await onReply(textToSend);
      }
      setReplyText('');
      setReplySuccess(true);
      setTimeout(() => setReplySuccess(false), 2400);
      startAutoHideTimer(3000);
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsSendingReply(false);
    }
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
          className="fixed inset-0 z-50 bg-black flex flex-col select-none touch-none overflow-hidden"
        >
          {/* ═════════════ TOP HEADER OVERLAY ═════════════ */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-5 py-3 bg-gradient-to-b from-black/85 via-black/50 to-transparent text-white border-b border-white/5 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                {/* Left: Back Button + Sender Info */}
                <div className="flex items-center gap-2.5 min-w-0 pr-3">
                  <button
                    type="button"
                    id="btn-viewer-back"
                    onClick={onClose}
                    className="p-2 -ml-1 rounded-full hover:bg-white/15 active:bg-white/25 text-white transition-colors cursor-pointer outline-none shrink-0"
                    title="Back (Esc)"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {displaySenderName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold truncate text-white leading-tight">
                        {displaySenderName}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-white/70 leading-tight truncate">
                        {formattedTime || formatSize(fileSize) || 'Photo'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Actions (Zoom, Camera, Forward, Download, Three-dot Menu) */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  {/* Desktop Zoom Controls */}
                  <div className="hidden md:flex items-center bg-white/10 rounded-full p-0.5 border border-white/10 mr-1">
                    <button
                      type="button"
                      id="btn-zoom-out"
                      onClick={handleZoomOut}
                      disabled={scale <= 1}
                      className="p-1.5 hover:bg-white/20 rounded-full text-white disabled:opacity-30 transition-all cursor-pointer outline-none"
                      title="Zoom out"
                    >
                      <ZoomOut size={15} />
                    </button>
                    <span className="text-[11px] px-1.5 font-mono text-white/80">
                      {Math.round(scale * 100)}%
                    </span>
                    <button
                      type="button"
                      id="btn-zoom-in"
                      onClick={handleZoomIn}
                      disabled={scale >= 4}
                      className="p-1.5 hover:bg-white/20 rounded-full text-white disabled:opacity-30 transition-all cursor-pointer outline-none"
                      title="Zoom in"
                    >
                      <ZoomIn size={15} />
                    </button>
                    {scale > 1 && (
                      <button
                        type="button"
                        id="btn-zoom-reset"
                        onClick={handleResetZoom}
                        className="p-1.5 hover:bg-white/20 rounded-full text-white transition-all cursor-pointer outline-none"
                        title="Reset zoom"
                      >
                        <RotateCcw size={13} />
                      </button>
                    )}
                  </div>

                  {/* Camera Icon */}
                  <button
                    type="button"
                    id="btn-viewer-camera"
                    onClick={() => {
                      setShowDetails((prev) => !prev);
                      startAutoHideTimer(4000);
                    }}
                    className={`p-2 rounded-full hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer outline-none ${
                      showDetails ? 'bg-white/20 text-[#25D366]' : 'text-white'
                    }`}
                    title="Photo details"
                  >
                    <Camera size={19} />
                  </button>

                  {/* Forward Icon */}
                  <button
                    type="button"
                    id="btn-viewer-forward"
                    onClick={handleForward}
                    className="p-2 rounded-full hover:bg-white/15 active:bg-white/25 text-white transition-colors cursor-pointer outline-none"
                    title="Forward photo"
                  >
                    <Forward size={19} />
                  </button>

                  {/* Download Icon */}
                  <a
                    href={downloadUrl}
                    download={filename}
                    id="btn-viewer-download"
                    className="p-2 rounded-full hover:bg-white/15 active:bg-white/25 text-white transition-colors cursor-pointer outline-none"
                    title="Save to device"
                  >
                    <Download size={19} />
                  </a>

                  {/* Three-dot Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      id="btn-viewer-menu"
                      onClick={() => {
                        setIsMenuOpen((prev) => !prev);
                        if (!isMenuOpen) {
                          cancelAutoHideTimer();
                        } else {
                          startAutoHideTimer(3200);
                        }
                      }}
                      className={`p-2 rounded-full hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer outline-none ${
                        isMenuOpen ? 'bg-white/20 text-[#25D366]' : 'text-white'
                      }`}
                      title="More options"
                    >
                      <MoreVertical size={19} />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {isMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-48 bg-[#233138] border border-white/10 rounded-xl shadow-2xl py-1.5 text-white z-50 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setRotation((r) => (r + 90) % 360);
                              setIsMenuOpen(false);
                              startAutoHideTimer(3000);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <RotateCw size={15} className="text-white/70" />
                            <span>Rotate 90°</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleCopyLink}
                            className="w-full px-3.5 py-2 text-left text-xs hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Copy size={15} className="text-white/70" />
                            <span>Copy image link</span>
                          </button>

                          <a
                            href={downloadUrl}
                            download={filename}
                            onClick={() => setIsMenuOpen(false)}
                            className="w-full px-3.5 py-2 text-left text-xs hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Download size={15} className="text-white/70" />
                            <span>Save to device</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              setShowDetails((v) => !v);
                              setIsMenuOpen(false);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Info size={15} className="text-white/70" />
                            <span>Photo details</span>
                          </button>

                          <div className="my-1 border-t border-white/10" />

                          <button
                            type="button"
                            onClick={onClose}
                            className="w-full px-3.5 py-2 text-left text-xs hover:bg-white/10 flex items-center gap-2.5 text-white/80 hover:text-white transition-colors cursor-pointer"
                          >
                            <MessageSquare size={15} className="text-white/70" />
                            <span>Show in chat</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Details Floating Card */}
          <AnimatePresence>
            {showDetails && showControls && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed top-16 right-3 sm:right-6 z-40 bg-[#233138]/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-white text-xs shadow-2xl max-w-xs w-full space-y-2.5"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                  <span className="font-bold text-sm text-white">Photo Details</span>
                  <button
                    type="button"
                    onClick={() => setShowDetails(false)}
                    className="text-white/60 hover:text-white p-1 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="space-y-1.5 text-white/80">
                  <div className="flex justify-between">
                    <span className="text-white/50">File Name:</span>
                    <span className="font-medium truncate max-w-[170px]">{filename}</span>
                  </div>
                  {fileSize ? (
                    <div className="flex justify-between">
                      <span className="text-white/50">File Size:</span>
                      <span>{formatSize(fileSize)}</span>
                    </div>
                  ) : null}
                  {timestamp ? (
                    <div className="flex justify-between">
                      <span className="text-white/50">Date & Time:</span>
                      <span>{formattedTime}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="text-white/50">Sender:</span>
                    <span>{displaySenderName}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Copied Toast Notification */}
          <AnimatePresence>
            {copiedToast && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-[#1F2C34] text-white px-4 py-2 rounded-full text-xs font-semibold shadow-2xl border border-white/10 flex items-center gap-2"
              >
                <Check size={14} className="text-[#25D366]" />
                <span>Link copied to clipboard</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═════════════ MAIN IMAGE CANVAS / VIEWPORT ═════════════ */}
          <div
            id="image-viewer-canvas"
            className="flex-1 w-full h-full flex items-center justify-center relative cursor-default overflow-hidden"
            onClick={handleViewportTap}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
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
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (scale === 1) {
                  setScale(2);
                } else {
                  setScale(1);
                  setPosition({ x: 0, y: 0 });
                }
              }}
              className="max-h-full max-w-full object-contain select-none transition-transform duration-200"
            />
          </div>

          {/* ═════════════ BOTTOM OVERLAY (CAPTION & REPLY BAR) ═════════════ */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-5 bg-gradient-to-t from-black/85 via-black/50 to-transparent flex flex-col items-center pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                {/* Optional Caption Display */}
                {caption && (
                  <div className="max-w-xl w-full mx-auto mb-2.5 px-4 py-2 bg-black/65 backdrop-blur-md rounded-2xl text-white text-xs sm:text-sm leading-relaxed text-center border border-white/10 shadow-lg">
                    {caption}
                  </div>
                )}

                {/* Reply Sent Notification */}
                <AnimatePresence>
                  {replySuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="mb-2 px-3 py-1 bg-[#25D366] text-black text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg"
                    >
                      <Check size={13} className="stroke-[3]" />
                      <span>Reply sent</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Floating WhatsApp-style Reply Bar */}
                <form
                  onSubmit={handleSendReply}
                  className="max-w-xl w-full mx-auto flex items-center gap-2 px-3.5 py-1.5 sm:py-2 bg-[#1F2C34]/95 backdrop-blur-md rounded-full border border-white/15 shadow-2xl text-white transition-all focus-within:border-[#25D366]/60 focus-within:ring-1 focus-within:ring-[#25D366]/40"
                >
                  <button
                    type="button"
                    onClick={() => setReplyText((t) => t + '👍')}
                    className="text-white/60 hover:text-white transition-colors cursor-pointer p-0.5 outline-none"
                    title="Add emoji"
                  >
                    <Smile size={20} />
                  </button>

                  <input
                    type="text"
                    id="viewer-reply-input"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onFocus={() => {
                      isInputFocusedRef.current = true;
                      cancelAutoHideTimer();
                    }}
                    onBlur={() => {
                      isInputFocusedRef.current = false;
                      startAutoHideTimer(3500);
                    }}
                    placeholder={senderName ? `Reply to ${senderName}...` : 'Reply...'}
                    className="flex-1 bg-transparent border-none text-xs sm:text-sm text-white placeholder-white/45 focus:outline-none"
                  />

                  <button
                    type="submit"
                    id="btn-viewer-send-reply"
                    disabled={!replyText.trim() || isSendingReply}
                    className="w-8 h-8 rounded-full bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:scale-100 disabled:pointer-events-none cursor-pointer shrink-0 shadow-sm"
                    title="Send reply"
                  >
                    <Send size={14} className="translate-x-0.5 text-white" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
