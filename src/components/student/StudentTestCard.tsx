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
  FileCheck2
} from 'lucide-react';
import type { TestPaper, TestSubmission } from '../../types';
import { downloadTestBlob } from '../../lib/db';
import { MathText } from '../common/MathText';

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

  // Due date status calculation
  const now = new Date();
  const due = new Date(test.due_date);
  // Set due date to end of day for comparison
  due.setHours(23, 59, 59, 999);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const isOverdue = diffDays < 0;
  const isDueToday = diffDays === 0;
  const isDueSoon = diffDays > 0 && diffDays <= 2;

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

  return (
    <div
      id={`test-card-${test.id}`}
      onClick={() => onSelect(test)}
      className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative flex flex-col justify-between ${
        isSelected
          ? 'bg-white border-[#111111] ring-2 ring-[#111111]/10 shadow-md'
          : 'bg-white border-[#E5E5E5] hover:border-[#CCCCCC] hover:shadow-xs'
      }`}
    >
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Subject Tag */}
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-[#111111] text-white">
              {test.subject}
            </span>
            {/* Grade & Stream */}
            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5]">
              Grade {test.grade} {test.stream && test.stream !== 'all' ? `• ${test.stream}` : ''}
            </span>
          </div>

          {/* Submission Status Badge */}
          {submission ? (
            submission.status === 'graded' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                <CheckCircle2 size={12} />
                {submission.marks_obtained !== null && submission.marks_obtained !== undefined
                  ? `${submission.marks_obtained}/${test.total_marks}`
                  : 'Graded'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                <FileCheck2 size={12} />
                Submitted
              </span>
            )
          ) : isOverdue ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
              <AlertCircle size={12} />
              Overdue
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
              <Clock size={12} />
              Pending
            </span>
          )}
        </div>

        {/* Test Title */}
        <h4 className="text-sm font-extrabold text-[#111111] line-clamp-1 mb-1">
          <MathText text={test.title} />
        </h4>

        {/* Teacher & Total Marks */}
        <div className="flex items-center gap-3 text-xs text-[#737373] mb-3 flex-wrap">
          <span className="flex items-center gap-1">
            <User size={13} className="text-[#A3A3A3]" />
            {test.teacher_name || 'Faculty'}
          </span>
          <span className="flex items-center gap-1 font-semibold text-[#111111]">
            <Award size={13} className="text-[#A3A3A3]" />
            {test.total_marks} Marks
          </span>
        </div>

        {/* Instructions preview */}
        {test.instructions && (
          <div className="text-[11px] text-[#737373] line-clamp-2 mb-3 bg-[#FAFAFA] p-2 rounded-xl border border-[#F0F0F0]">
            <MathText text={test.instructions} />
          </div>
        )}
      </div>

      {/* Card Footer: Due Date & Action Buttons */}
      <div className="pt-3 border-t border-[#F5F5F5] flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-1 text-[11px] text-[#737373]">
          <Calendar size={13} className="text-[#A3A3A3] shrink-0" />
          <span>
            Due:{' '}
            <strong
              className={`font-semibold ${
                isOverdue
                  ? 'text-[#DC2626]'
                  : isDueToday
                  ? 'text-[#D97706]'
                  : isDueSoon
                  ? 'text-[#B45309]'
                  : 'text-[#111111]'
              }`}
            >
              {new Date(test.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              {isDueToday ? ' (Today)' : isDueSoon ? ` (${diffDays}d left)` : ''}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id={`view-test-btn-${test.id}`}
            onClick={handleView}
            title="Preview Question Paper"
            className="p-1.5 rounded-lg bg-[#FAFAFA] hover:bg-[#E5E5E5] text-[#111111] text-xs font-bold transition-colors border border-[#E5E5E5] inline-flex items-center gap-1"
          >
            <Eye size={13} />
            <span className="hidden sm:inline text-[11px]">View</span>
          </button>
          <button
            id={`download-test-btn-${test.id}`}
            onClick={handleDownload}
            disabled={downloading}
            title="Download Question Paper"
            className="p-1.5 rounded-lg bg-[#FAFAFA] hover:bg-[#E5E5E5] text-[#111111] transition-colors border border-[#E5E5E5] disabled:opacity-40"
          >
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          </button>
          <div className="text-[#A3A3A3] pl-1">
            <ChevronRight size={16} className={isSelected ? 'text-[#111111]' : ''} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTestCard;
