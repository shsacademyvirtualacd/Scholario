import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface StudentErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const StudentErrorState: React.FC<StudentErrorStateProps> = ({
  title = 'Could not load data',
  message = 'We encountered an issue loading this information. Please check your connection and try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 p-6 sm:p-8 text-center flex flex-col items-center justify-center space-y-3.5 max-w-md mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
        <AlertCircle size={22} />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
          {title}
        </h3>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {message}
        </p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-[44px] min-w-[44px] px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <RotateCcw size={14} />
          <span>Try again</span>
        </button>
      )}
    </div>
  );
};

export default StudentErrorState;
