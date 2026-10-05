import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  children?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  children,
}) => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Robust scroll lock that guarantees zero jumps and preserves scroll offset
  useModalScrollLock(open);

  useEffect(() => {
    if (open) {
      setError(null);
      // Focus on confirm button without triggering browser scroll jumps
      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus({ preventScroll: true });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !isPending) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, isPending]);

  if (!open) return null;

  const handleConfirm = async () => {
    setIsPending(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      console.error('Confirmation action failed:', err);
      setError(err?.message || 'Operation failed. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  return createPortal(
    <div
      id="confirm-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          onClose();
        }
      }}
    >
      <div
        id="confirm-modal-container"
        className="relative bg-white dark:bg-neutral-900 w-full max-w-full sm:max-w-md rounded-2xl shadow-2xl p-4 sm:p-6 border border-slate-200 dark:border-neutral-800 animate-in zoom-in-95 duration-150 max-h-[90dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="confirm-modal-close-btn"
          onClick={onClose}
          disabled={isPending}
          className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-40 cursor-pointer z-10"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4 overscroll-contain">
          <div className="flex gap-3 sm:gap-4">
            {/* Destructive / Warning Icon */}
            {danger ? (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>
            )}

            <div className="flex-1 pr-6 sm:pr-4 min-w-0">
              <h3 id="confirm-modal-title" className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 break-words">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 font-normal leading-relaxed break-words">
                {description}
              </p>

              {error && (
                <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-xs text-red-800 dark:text-red-200 break-words">
                  {error}
                </div>
              )}

              {children && <div className="mt-4">{children}</div>}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-neutral-800 shrink-0">
          <button
            type="button"
            id="confirm-modal-cancel-btn"
            onClick={onClose}
            disabled={isPending}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40 cursor-pointer text-center"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            id="confirm-modal-action-btn"
            ref={confirmBtnRef}
            disabled={isPending}
            onClick={handleConfirm}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-xs disabled:opacity-40 cursor-pointer text-center ${
              danger
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-slate-950'
            }`}
          >
            {isPending && <Loader2 size={13} className="animate-spin shrink-0" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
