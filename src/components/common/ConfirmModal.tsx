import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

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

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setError(null);
      // Focus on confirm or cancel button when opened
      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'unset';
      };
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
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

  return (
    <div
      id="confirm-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
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
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-[#E5E5E5] animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="confirm-modal-close-btn"
          onClick={onClose}
          disabled={isPending}
          className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-[#F5F5F5] text-[#737373] hover:text-[#111111] transition-colors disabled:opacity-40 cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        <div className="flex gap-4">
          {/* Destructive / Warning Icon */}
          {danger ? (
            <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]/60 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5] flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
          )}

          <div className="flex-1 pr-4">
            <h3 id="confirm-modal-title" className="text-base font-extrabold text-[#111111]">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-[#737373] mt-1.5 font-normal leading-relaxed">
              {description}
            </p>

            {error && (
              <div className="mt-3 p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#991B1B]">
                {error}
              </div>
            )}

            {children && <div className="mt-4">{children}</div>}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#F5F5F5]">
          <button
            type="button"
            id="confirm-modal-cancel-btn"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2.5 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#525252] hover:bg-[#F5F5F5] transition-colors disabled:opacity-40 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            id="confirm-modal-action-btn"
            ref={confirmBtnRef}
            disabled={isPending}
            onClick={handleConfirm}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all shadow-xs disabled:opacity-40 cursor-pointer ${
              danger
                ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                : 'bg-[#111111] hover:bg-[#262626]'
            }`}
          >
            {isPending && <Loader2 size={13} className="animate-spin shrink-0" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
