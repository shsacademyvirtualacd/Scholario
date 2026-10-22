import React from 'react';

export const StudentStatSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 animate-pulse space-y-2.5"
      >
        <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
        <div className="h-7 w-24 bg-neutral-300 dark:bg-neutral-700 rounded-lg" />
        <div className="h-2.5 w-28 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
      </div>
    ))}
  </div>
);

export const StudentClassCardSkeleton: React.FC = () => (
  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 animate-pulse space-y-4">
    <div className="flex items-center justify-between">
      <div className="h-5 w-28 bg-neutral-300 dark:bg-neutral-700 rounded-md" />
      <div className="h-6 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
    </div>
    <div className="space-y-2">
      <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
      <div className="h-3.5 w-36 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
    </div>
    <div className="h-11 w-full bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
  </div>
);

export const StudentListSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="space-y-2.5">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 animate-pulse flex items-center justify-between gap-4"
      >
        <div className="space-y-2 flex-1">
          <div className="h-4 w-40 bg-neutral-300 dark:bg-neutral-700 rounded-md" />
          <div className="h-3 w-28 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
        </div>
        <div className="h-6 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
      </div>
    ))}
  </div>
);

export const StudentGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 animate-pulse space-y-3"
      >
        <div className="flex justify-between items-center">
          <div className="h-5 w-20 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
          <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
        </div>
        <div className="h-5 w-3/4 bg-neutral-300 dark:bg-neutral-700 rounded-md" />
        <div className="h-3.5 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
        <div className="pt-2 flex justify-between items-center">
          <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
          <div className="h-8 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);
