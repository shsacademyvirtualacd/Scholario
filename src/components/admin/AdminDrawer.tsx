import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface AdminDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const AdminDrawer: React.FC<AdminDrawerProps> = ({
  open,
  onClose,
  title,
  children,
}) => {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
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
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45 transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        {/* Panel */}
        <div className="w-full sm:w-[448px] max-w-full h-full max-h-[100dvh] bg-white flex flex-col shadow-2xl animate-in slide-in-from-right duration-350 ease-out border-l border-[#E5E5E5] overflow-hidden">
          {/* Header */}
          <div className="h-16 px-4 sm:px-6 border-b border-[#E5E5E5] flex items-center justify-between shrink-0 bg-white">
            <h2 className="text-base font-bold text-[#111111] truncate mr-2">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#F5F5F5] text-[#737373] hover:text-[#111111] transition-colors interactive shrink-0"
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-white overscroll-contain">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDrawer;
