import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Award,
  User,
  Eye,
  Download,
  Trash2,
  Loader2,
  MoreVertical,
} from 'lucide-react';
import type { TestPaper } from '../../types';
import { downloadTestBlob } from '../../lib/db';
import { MathText } from '../common/MathText';
import { getBoardDef, formatGradeDisplay } from '../../lib/taxonomy';

interface TeacherTestCardProps {
  test: TestPaper;
  isSelected?: boolean;
  canDelete?: boolean;
  onSelect: (test: TestPaper) => void;
  onView: (test: TestPaper) => void;
  onDelete?: (testId: string) => void;
}

export const TeacherTestCard: React.FC<TeacherTestCardProps> = ({
  test,
  isSelected,
  canDelete = false,
  onSelect,
  onView,
  onDelete,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      await downloadTestBlob(test);
    } catch {
      if (test.file_url) {
        const link = document.createElement('a');
        link.href = test.file_url;
        link.download = `${test.title || 'test'}.pdf`;
        link.target = '_blank';
        link.click();
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteTrigger = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (!canDelete || !onDelete) return;
    onDelete(test.id);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView(test);
  };

  const bId = (test.board_id || test.board || '').toLowerCase();
  const bDef = getBoardDef(bId);
  const bName =
    bDef?.shortName ||
    bDef?.name ||
    (test.board_id || test.board ? String(test.board_id || test.board).toUpperCase() : '');
  const gradeStr = formatGradeDisplay(test.grade, bId);
  const boardTag = `${gradeStr}${bName ? ` • ${bName}` : ''}${
    test.stream && test.stream !== 'all' ? ` • ${test.stream}` : ''
  }`;

  return (
    <div
      id={`teacher-test-card-${test.id}`}
      onClick={() => onSelect(test)}
      className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer text-left relative flex flex-col justify-between ${
        isSelected
          ? 'bg-white dark:bg-neutral-900 border-neutral-900 dark:border-amber-400 ring-2 ring-neutral-900/10 dark:ring-amber-400/20 shadow-sm'
          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-2xs'
      }`}
    >
      <div>
        {/* Top Row: Tags */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-neutral-900 dark:bg-amber-400 text-white dark:text-neutral-950 whitespace-nowrap">
              {test.subject}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 whitespace-nowrap">
              {boardTag}
            </span>
          </div>

          <span className="text-[10px] text-neutral-400 font-medium whitespace-nowrap">
            PDF Paper
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1 mb-1.5">
          <MathText text={test.title} />
        </h4>

        {/* Info row */}
        <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mb-2.5 flex-wrap">
          <span className="flex items-center gap-1 whitespace-nowrap">
            <User size={13} className="text-neutral-400 shrink-0" />
            <span className="truncate max-w-[120px]">{test.teacher_name || 'Faculty'}</span>
          </span>
          <span className="flex items-center gap-1 font-semibold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
            <Award size={13} className="text-neutral-400 shrink-0" />
            {test.total_marks} Marks
          </span>
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Calendar size={13} className="text-neutral-400 shrink-0" />
            Due: {new Date(test.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Instructions snippet */}
        {test.instructions && (
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-3 bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60">
            <MathText text={test.instructions} />
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2 mt-auto">
        <span className="text-[11px] text-neutral-400 whitespace-nowrap">
          {new Date(test.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            id={`view-test-btn-${test.id}`}
            onClick={handleView}
            title="Preview Question Paper"
            className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors border border-neutral-200 dark:border-neutral-700 cursor-pointer"
          >
            <Eye size={14} />
          </button>

          <button
            id={`download-test-btn-${test.id}`}
            onClick={handleDownload}
            disabled={downloading}
            title="Download Question Paper"
            className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors border border-neutral-200 dark:border-neutral-700 disabled:opacity-40 cursor-pointer"
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          </button>

          {canDelete && (
            <div className="relative inline-block" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="More actions"
              >
                <MoreVertical size={14} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 bottom-full mb-1 w-44 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-30 py-1 text-left">
                  <button
                    type="button"
                    onClick={handleDeleteTrigger}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Delete Paper...</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherTestCard;
