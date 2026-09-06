import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  RotateCw,
  Trash2,
  FileText,
  Smile,
  Loader2,
  Check,
} from 'lucide-react';
import { WhatsAppEmojiPicker } from './WhatsAppEmojiPicker';

export interface PendingAttachment {
  file: File;
  previewUrl?: string;
  isImage: boolean;
  isPdf: boolean;
  isWord: boolean;
  caption: string;
  rotation?: number;
}

interface ChatAttachmentPreviewModalProps {
  isOpen: boolean;
  attachment: PendingAttachment | null;
  recipientName?: string;
  isUploading: boolean;
  uploadProgress: number;
  onClose: () => void;
  onSend: (file: File, caption: string) => Promise<void> | void;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Creates a new File from an image rotated by rotation degrees using HTML5 Canvas.
 */
async function produceRotatedFile(file: File, rotation: number): Promise<File> {
  const normRotation = ((rotation % 360) + 360) % 360;
  if (normRotation === 0) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        const isSideways = normRotation === 90 || normRotation === 270;
        canvas.width = isSideways ? img.height : img.width;
        canvas.height = isSideways ? img.width : img.height;

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((normRotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const FileConstructor = (window as any).File || File;
            const rotated = new FileConstructor([blob], file.name, {
              type: file.type || 'image/jpeg',
              lastModified: Date.now(),
            }) as File;
            resolve(rotated);
          },
          file.type || 'image/jpeg',
          0.92
        );
      } catch (err) {
        console.warn('[ChatAttachmentPreview] Rotation canvas failed, using original file:', err);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export const ChatAttachmentPreviewModal: React.FC<ChatAttachmentPreviewModalProps> = ({
  isOpen,
  attachment,
  recipientName,
  isUploading,
  uploadProgress,
  onClose,
  onSend,
}) => {
  const [caption, setCaption] = useState('');
  const [rotation, setRotation] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const captionInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when new attachment is opened
  useEffect(() => {
    if (attachment) {
      setCaption(attachment.caption || '');
      setRotation(attachment.rotation || 0);
      setShowEmojiPicker(false);
      // Auto-focus caption input
      setTimeout(() => {
        captionInputRef.current?.focus();
      }, 100);
    }
  }, [attachment]);

  // Handle ESC key to close/discard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isUploading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isUploading, onClose]);

  if (!isOpen || !attachment) return null;

  const { file, previewUrl, isImage, isPdf, isWord } = attachment;

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSendClick = async () => {
    if (isUploading) return;
    let fileToSend = file;
    if (isImage && rotation !== 0) {
      fileToSend = await produceRotatedFile(file, rotation);
    }
    onSend(fileToSend, caption);
  };

  const handleEmojiSelect = (emoji: string) => {
    setCaption((prev) => prev + emoji);
    captionInputRef.current?.focus();
  };

  const handleEmojiBackspace = () => {
    setCaption((prev) => {
      const chars = Array.from(prev);
      chars.pop();
      return chars.join('');
    });
    captionInputRef.current?.focus();
  };

  return (
    <div
      id="chat-attachment-preview-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Attachment preview"
      className="fixed inset-0 z-50 bg-[#0B141A]/95 backdrop-blur-md flex flex-col justify-between text-white select-none animate-in fade-in duration-200"
    >
      {/* Top Header Bar */}
      <header className="h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between bg-black/30 border-b border-white/10 shrink-0 z-10">
        {/* Left: Discard / Cancel button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            id="btn-discard-attachment-preview"
            onClick={onClose}
            disabled={isUploading}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors disabled:opacity-40 cursor-pointer"
            title="Discard & go back (Esc)"
            aria-label="Close preview"
          >
            <X size={22} />
          </button>

          <div>
            <p className="text-xs sm:text-sm font-semibold text-white/90">
              {recipientName ? `Send to ${recipientName}` : 'Preview Attachment'}
            </p>
            <p className="text-[10px] sm:text-[11px] text-white/60 truncate max-w-[200px] sm:max-w-xs font-mono">
              {file.name} ({formatBytes(file.size)})
            </p>
          </div>
        </div>

        {/* Right: Actions (Rotate for images, Discard button) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isImage && (
            <button
              type="button"
              id="btn-rotate-attachment"
              onClick={handleRotate}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
              title="Rotate 90° clockwise"
            >
              <RotateCw size={15} />
              <span className="hidden sm:inline">Rotate</span>
              {rotation !== 0 && (
                <span className="text-[10px] text-amber-300 font-mono">({rotation}°)</span>
              )}
            </button>
          )}

          <button
            type="button"
            id="btn-trash-attachment"
            onClick={onClose}
            disabled={isUploading}
            className="w-9 h-9 rounded-full flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-colors disabled:opacity-40 cursor-pointer"
            title="Discard file"
            aria-label="Discard file"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {/* Main Preview Center Body */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden relative min-h-0">
        {isImage && previewUrl ? (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            <div className="max-w-full max-h-full flex items-center justify-center overflow-hidden rounded-xl bg-black/40 p-1 border border-white/10 shadow-2xl">
              <img
                src={previewUrl}
                alt={file.name}
                style={{
                  transform: `rotate(${rotation}deg)`,
                }}
                className="max-h-[56vh] sm:max-h-[66vh] max-w-full object-contain rounded-lg transition-transform duration-200"
              />
            </div>
          </div>
        ) : (
          /* Document Preview Card (PDF, Word, Doc, etc.) */
          <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-[#111B21]/90 rounded-2xl border border-white/15 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            {/* File Icon Badge */}
            <div
              className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-lg relative ${
                isPdf
                  ? 'bg-gradient-to-br from-rose-500/20 to-rose-600/30 border border-rose-500/40 text-rose-400'
                  : isWord
                  ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/30 border border-blue-500/40 text-blue-400'
                  : 'bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/40 text-amber-400'
              }`}
            >
              <FileText size={38} />
              <span className="text-[10px] font-black uppercase tracking-wider mt-1 px-1.5 py-0.2 rounded bg-black/40">
                {isPdf ? 'PDF' : isWord ? 'DOC' : file.name.split('.').pop() || 'FILE'}
              </span>
            </div>

            {/* File Name */}
            <h3 className="mt-4 text-sm sm:text-base font-bold text-white max-w-sm line-clamp-2 break-all">
              {file.name}
            </h3>

            {/* File Meta */}
            <p className="mt-1 text-xs text-white/60 font-medium">
              {formatBytes(file.size)} •{' '}
              {isPdf
                ? 'Portable Document Format (PDF)'
                : isWord
                ? 'Microsoft Word Document'
                : 'Scholario Document'}
            </p>

            {/* Ready Status Chip */}
            <div className="mt-5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Check size={14} />
              <span>Ready to send • Safe attachment</span>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Footer: Emoji keyboard (if open) + Caption & Send Bar */}
      <footer className="shrink-0 bg-[#111B21]/95 border-t border-white/10 z-10">
        {/* Emoji Keyboard Overlay */}
        {showEmojiPicker && (
          <div className="max-w-2xl mx-auto px-2 pt-2 border-b border-white/10">
            <div className="rounded-xl overflow-hidden shadow-xl">
              <WhatsAppEmojiPicker
                onSelectEmoji={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
                onBackspace={handleEmojiBackspace}
              />
            </div>
          </div>
        )}

        {/* Upload Progress Bar (when sending) */}
        {isUploading && (
          <div className="px-4 pt-3 pb-1 max-w-3xl mx-auto">
            <div className="flex items-center justify-between text-xs text-white/80 font-medium mb-1.5">
              <span className="flex items-center gap-1.5">
                <Loader2 size={14} className="animate-spin text-[#25D366]" />
                <span>Uploading {file.name}...</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#25D366] transition-all duration-150 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
          {/* Emoji Toggle */}
          <button
            type="button"
            id="btn-preview-emoji"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            disabled={isUploading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer ${
              showEmojiPicker
                ? 'bg-[#00A884] text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            title={showEmojiPicker ? 'Close emoji picker' : 'Add emoji'}
            aria-label="Toggle emoji"
          >
            <Smile size={22} />
          </button>

          {/* Caption Input Field */}
          <div className="flex-1 relative flex items-center">
            <input
              ref={captionInputRef}
              type="text"
              id="input-preview-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendClick();
                }
              }}
              disabled={isUploading}
              placeholder="Add a caption..."
              className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder:text-white/40 text-xs sm:text-sm px-4 py-3 rounded-full outline-hidden border border-white/10 focus:border-white/30 transition-all disabled:opacity-50 pr-9"
            />
            {caption.length > 0 && !isUploading && (
              <button
                type="button"
                onClick={() => setCaption('')}
                className="absolute right-3 text-white/50 hover:text-white p-1 rounded-full cursor-pointer"
                title="Clear caption"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Discard / Cancel Button */}
          <button
            type="button"
            id="btn-cancel-preview-send"
            onClick={onClose}
            disabled={isUploading}
            className="hidden sm:inline-flex px-3.5 py-2.5 rounded-full text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 cursor-pointer"
          >
            Cancel
          </button>

          {/* Explicit WhatsApp Green Send Button */}
          <button
            type="button"
            id="btn-confirm-send-attachment"
            onClick={handleSendClick}
            disabled={isUploading}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shrink-0 shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Send attachment (Enter)"
            aria-label="Send attachment"
          >
            {isUploading ? (
              <Loader2 size={20} className="animate-spin text-white" />
            ) : (
              <Send size={20} className="text-white ml-0.5" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};
