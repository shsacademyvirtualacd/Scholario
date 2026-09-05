import React, { useMemo } from 'react';

interface ExamWatermarkOverlayProps {
  studentName?: string;
  studentId?: string;
  testTitle?: string;
}

/**
 * Renders a CSS-based semi-transparent dynamic watermark overlay across the exam screen.
 * Tiled diagonally across the viewport with pointer-events-none so it doesn't obstruct interactions,
 * but renders every screenshot or camera photo permanently traceable back to the student.
 */
export const ExamWatermarkOverlay: React.FC<ExamWatermarkOverlayProps> = ({
  studentName = 'Student',
  studentId = 'STD-AUTH',
  testTitle = 'Assessment',
}) => {
  // Format consistent timestamp for this exam session
  const timestampStr = useMemo(() => {
    const d = new Date();
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }, []);

  // Generate 24 repeating watermark tokens to cover entire viewport comfortably
  const tiles = useMemo(() => {
    return Array.from({ length: 24 });
  }, []);

  const watermarkToken = `${studentName.toUpperCase()} • ID: #${studentId} • ${timestampStr}`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden select-none"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <div className="w-full h-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-16 gap-x-12 p-6 opacity-[0.065] sm:opacity-[0.08] dark:opacity-[0.10]">
        {tiles.map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center text-center transform -rotate-25 transition-transform"
          >
            <span className="font-mono font-black text-xs sm:text-sm text-[#111111] tracking-wider whitespace-nowrap">
              {watermarkToken}
            </span>
            <span className="font-sans font-extrabold text-[9px] sm:text-[10px] uppercase text-neutral-800 tracking-widest mt-0.5 whitespace-nowrap">
              PROCTORED EXAM • {testTitle.slice(0, 20)} • UNAUTHORIZED CAPTURE PROHIBITED
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
