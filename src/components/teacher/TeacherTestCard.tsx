import React, { useState } from 'react';
import {
  Calendar,
  Award,
  Users,
  Eye,
  Download,
  Trash2,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import type { TestPaper } from '../../types';
import { downloadTestBlob, deleteTestPaper } from '../../lib/db';

interface TeacherTestCardProps {
  test: TestPaper;
  isSelected?: boolean;
  onSelect: (test: TestPaper) => void;
  onView: (test: TestPaper) => void;
  onDelete: (testId: string) => void;
}

export const TeacherTestCard: React.FC<TeacherTestCardProps> = ({
  test,
  isSelected,
  onSelect,
  onView,
  onDelete,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${test.title}"? This will also remove all associated student submissions.`)) {
      return;
    }
    setDeleting(true);
    try {
      await deleteTestPaper(test.id);
      onDelete(test.id);
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.message || 'Failed to delete test paper.');
    } finally {
      setDeleting(false);
    }
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView(test);
  };

  const subsCount = test.submissions_count || 0;
  const gradedCount = test.graded_count || 0;

  return (
    <div
      id={`teacher-test-card-${test.id}`}
      onClick={() => onSelect(test)}
      className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative flex flex-col justify-between ${
        isSelected
          ? 'bg-white border-[#111111] ring-2 ring-[#111111]/10 shadow-md'
          : 'bg-white border-[#E5E5E5] hover:border-[#CCCCCC] hover:shadow-xs'
      }`}
    >
      <div>
        {/* Badges Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-[#111111] text-white">
              {test.subject}
            </span>
            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5]">
              Grade {test.grade} {test.stream && test.stream !== 'all' ? `• ${test.stream}` : ''}
            </span>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5]">
            <Users size={12} className="text-[#737373]" />
            {subsCount} {subsCount === 1 ? 'Submission' : 'Submissions'}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-extrabold text-[#111111] line-clamp-1 mb-1">{test.title}</h4>

        {/* Marks & Date */}
        <div className="flex items-center gap-3 text-xs text-[#737373] mb-3 flex-wrap">
          <span className="flex items-center gap-1 font-semibold text-[#111111]">
            <Award size={13} className="text-[#A3A3A3]" />
            {test.total_marks} Total Marks
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={13} className="text-[#A3A3A3]" />
            Due: {new Date(test.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
          {gradedCount > 0 && (
            <span className="flex items-center gap-1 text-[#15803D] font-bold">
              <CheckCircle2 size={12} /> {gradedCount} Graded
            </span>
          )}
        </div>

        {test.instructions && (
          <p className="text-[11px] text-[#737373] line-clamp-1 mb-2 bg-[#FAFAFA] p-1.5 rounded-lg">
            {test.instructions}
          </p>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="pt-2.5 border-t border-[#F5F5F5] flex items-center justify-between gap-2 mt-auto">
        <span className="text-[10px] text-[#A3A3A3]">
          Uploaded {new Date(test.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id={`view-test-btn-${test.id}`}
            onClick={handleView}
            title="Preview Question Paper"
            className="p-1.5 rounded-lg bg-[#FAFAFA] hover:bg-[#E5E5E5] text-[#111111] transition-colors border border-[#E5E5E5]"
          >
            <Eye size={13} />
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
          <button
            id={`delete-test-btn-${test.id}`}
            onClick={handleDelete}
            disabled={deleting}
            title="Delete Test Paper"
            className="p-1.5 rounded-lg bg-[#FAFAFA] hover:bg-[#FEE2E2] text-[#DC2626] transition-colors border border-[#E5E5E5] disabled:opacity-40"
          >
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
          <div className="text-[#A3A3A3] pl-0.5">
            <ChevronRight size={15} className={isSelected ? 'text-[#111111]' : ''} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherTestCard;
