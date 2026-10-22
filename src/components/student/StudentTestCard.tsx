import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Award,
  User,
  Eye,
  Download,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Loader2,
  FileCheck2,
  AlertTriangle,
} from 'lucide-react';
import type { TestPaper, TestSubmission } from '../../types';
import { downloadTestBlob } from '../../lib/db';
import { MathText } from '../common/MathText';
import {
  formatProperName,
  formatTitleCase,
  formatStandardDate,
} from '../../utils/studentFormatting';
import { StudentStatusBadge } from './shared/StudentStatusBadge';

interface StudentTestCardProps {
  test: TestPaper;
  submission?: TestSubmission;
  isSelected?: boolean;
  onSelect: (test: TestPaper) => void;
  onView: (test: TestPaper) => void;
}

export const StudentTestCard: React.FC<StudentTestCardProps> = ({
  test,
  submission,
  isSelected,
  onSelect,
  onView,
}) => {
  const [downloading, setDownloading] = useState(false);

  // Due date arithmetic
  const now = new Date();
  const dueDate = new Date(test.due_date);
  dueDate.setHours(23, 59, 59, 999);
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isOverdue = diffDays < 0;
  const isDueToday = diffDays === 0;
  const isDueSoon = diffDays > 0 && diffDays <= 2;

  const isSubmitted = Boolean(submission);
  const isGraded = submission?.status === 'graded';

  // Check late submission
  const isSubmittedLate =
    isSubmitted &&
    submission?.submitted_at &&
    new Date(submission.submitted_at).getTime() > dueDate.getTime();

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

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView(test);
  };

  const titleClean = formatTitleCase(test.title);
  const teacherName = formatProperName(test.teacher_name || 'Faculty Teacher');

  // Due label
  let dueLabel = '';
  if (isSubmitted) {
    dueLabel = `Submitted ${formatStandardDate(submission?.submitted_at)}`;
  } else if (isOverdue) {
    const absDays = Math.abs(diffDays);
    dueLabel = `Overdue by ${absDays} ${absDays === 1 ? 'day' : 'days'}`;
  } else if (isDueToday) {
    dueLabel = 'Due today';
  } else {
    dueLabel = `Due in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  }

  return (
    <div
      onClick={() => onSelect(test)}
      className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between gap-3 shadow-2xs ${
        isSelected
          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20'
          : 'bg-white dark:bg-neutral-900 border-neutral-200/90 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
      }`}
    >
      <div className="space-y-2">
        {/* Top Header: Subject Badge + Status Badge */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
              {test.subject}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
              Grade {test.grade}
            </span>
          </div>

          {/* Single Status Badge strictly matching requirement */}
          {isGraded ? (
            <StudentStatusBadge
              status="graded"
              label={`Graded (${submission?.marks_obtained ?? '—'}/${test.total_marks})`}
              size="sm"
            />
          ) : isSubmittedLate ? (
            <StudentStatusBadge status="submitted_late" label="Submitted late" size="sm" />
          ) : isSubmitted ? (
            <StudentStatusBadge status="submitted" label="Submitted" size="sm" />
          ) : isOverdue ? (
            <StudentStatusBadge status="overdue" label="Overdue" size="sm" />
          ) : isDueSoon || isDueToday ? (
            <StudentStatusBadge status="due_soon" label={isDueToday ? 'Due today' : 'Due soon'} size="sm" />
          ) : (
            <StudentStatusBadge status="todo" label="To do" size="sm" />
          )}
        </div>

        {/* Title in clean Title Case */}
        <h4 className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-2 leading-snug">
          {titleClean}
        </h4>

        {/* Teacher & Total Marks */}
        <div className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400 flex-wrap">
          <span className="flex items-center gap-1">
            <User size={13} className="text-neutral-400" />
            <span className="truncate max-w-[130px] font-medium">{teacherName}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-bold text-neutral-800 dark:text-neutral-200">
            <Award size={13} className="text-amber-500" />
            {test.total_marks} Marks
          </span>
        </div>
      </div>

      {/* Footer: Due Timing & Quick View Button */}
      <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2 mt-auto text-xs">
        <span
          className={`font-semibold ${
            !isSubmitted && isOverdue
              ? 'text-rose-600 dark:text-rose-400 font-bold'
              : !isSubmitted && (isDueSoon || isDueToday)
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          {dueLabel}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleView}
            className="min-h-[44px] min-w-[44px] px-2.5 py-1 text-xs font-semibold rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 transition-colors cursor-pointer"
            title="Preview paper"
          >
            <Eye size={13} />
            <span>Paper</span>
          </button>

          <ChevronRight
            size={16}
            className={`transition-transform ${
              isSelected ? 'text-amber-500 translate-x-0.5' : 'text-neutral-400'
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default StudentTestCard;
