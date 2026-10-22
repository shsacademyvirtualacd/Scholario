import React from 'react';

interface StudentEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export const StudentEmptyState: React.FC<StudentEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
        {icon}
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {description}
        </p>
      </div>

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 w-full sm:w-auto">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className={`min-h-[44px] min-w-[44px] w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                action.variant === 'secondary'
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white'
                  : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black'
              }`}
            >
              {action.label}
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="min-h-[44px] min-w-[44px] w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentEmptyState;
