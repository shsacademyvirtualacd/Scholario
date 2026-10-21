import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ClearScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  cohortName: string;
  slotCount: number;
}

export const ClearScheduleDialog: React.FC<ClearScheduleDialogProps> = ({
  open,
  onClose,
  onConfirm,
  cohortName,
  slotCount,
}) => {
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      setTypedConfirmation('');
      setIsDeleting(false);
    }
  }, [open]);

  if (!open) return null;

  const targetPhrase = cohortName.trim();
  const isConfirmed = typedConfirmation.trim().toLowerCase() === targetPhrase.toLowerCase();

  const handleConfirm = async () => {
    if (!isConfirmed || isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                Clear Cohort Timetable
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                This will permanently delete all {slotCount} scheduled slots.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning Body */}
        <div className="text-xs text-neutral-600 dark:text-neutral-300 space-y-2 bg-red-50/50 dark:bg-red-950/20 p-3 rounded-xl border border-red-200/60 dark:border-red-900/40">
          <p>
            You are clearing the entire weekly schedule for{' '}
            <strong className="text-neutral-900 dark:text-neutral-100 font-bold">{cohortName}</strong>.
          </p>
          <p className="text-[11px] text-red-700 dark:text-red-400">
            Warning: Student timetables, daily attendance sessions, and class reminders for this cohort will be removed immediately.
          </p>
        </div>

        {/* Typed Confirmation Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Type <span className="font-bold text-neutral-900 dark:text-neutral-100 select-all underline decoration-dotted">{targetPhrase}</span> to confirm:
          </label>
          <input
            type="text"
            value={typedConfirmation}
            onChange={(e) => setTypedConfirmation(e.target.value)}
            placeholder={targetPhrase}
            className="w-full text-xs px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isConfirmed || isDeleting}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-all ${
              isConfirmed && !isDeleting
                ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
            }`}
          >
            <Trash2 size={13} />
            <span>{isDeleting ? 'Clearing...' : `Clear ${slotCount} Slots`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearScheduleDialog;
