import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface StudentBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const StudentBottomSheet: React.FC<StudentBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md',
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-3xl',
  }[maxWidth];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet / Modal Container */}
      <div
        ref={sheetRef}
        className={`relative w-full ${widthClass} max-h-[90vh] sm:max-h-[85vh] bg-white dark:bg-[#141416] rounded-t-3xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200`}
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="sheet-title" className="text-lg font-bold text-neutral-900 dark:text-white truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar text-neutral-800 dark:text-neutral-200 space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentBottomSheet;
