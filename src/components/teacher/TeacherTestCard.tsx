import React, { useState } from 'react';
import {
  Calendar,
  Award,
  User,
  Eye,
  Download,
  Trash2,
  Loader2,
} from 'lucide-react';
import type { TestPaper } from '../../types';
import { downloadTestBlob, deleteTestPaper } from '../../lib/db';
import { MathText } from '../common/MathText';

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

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canDelete || !onDelete) return;
    if (!window.confirm(`Are you sure you want to delete "${test.title}"? This will remove all associated submissions.`)) {
      return;
    }
    setDeleting(true);
    try {
      await deleteTestPaper(test.id);
      onDelete(test.id);
    } catch (err: any) {
      console.error('Delete test error:', err);
      alert(err.message || 'Failed to delete test paper.');
    } finally {
      setDeleting(false);
    }
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView(test);
  };

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
        {/* Top Row: Tags */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-[#111111] text-white">
              {test.subject}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5]">
              Grade {test.grade} {test.board === 'sindh' || test.board_id === 'sindh' ? 'Sindh' : 'FBISE'} {test.stream && test.stream !== 'all' ? `• ${test.stream}` : ''}
            </span>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-sm font-extrabold text-[#111111] line-clamp-1 mb-1">
          <MathText text={test.title} />
        </h4>

        {/* Info row */}
        <div className="flex items-center gap-3 text-xs text-[#737373] mb-3 flex-wrap">
          <span className="flex items-center gap-1">
            <User size={13} className="text-[#A3A3A3]" />
            {test.teacher_name || 'Faculty'}
          </span>
          <span className="flex items-center gap-1 font-semibold text-[#111111]">
            <Award size={13} className="text-[#A3A3A3]" />
            {test.total_marks} Marks
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={13} className="text-[#A3A3A3]" />
            Due: {new Date(test.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Instructions snippet */}
        {test.instructions && (
          <div className="text-[11px] text-[#737373] line-clamp-2 mb-3 bg-[#FAFAFA] p-2 rounded-xl border border-[#F0F0F0]">
            <MathText text={test.instructions} />
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="pt-2.5 border-t border-[#F5F5F5] flex items-center justify-between gap-2 mt-auto flex-wrap">
        <span className="text-[10px] text-[#A3A3A3]">
          Uploaded {new Date(test.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id={`view-test-btn-${test.id}`}
            onClick={handleView}
            title="Preview Question Paper"
            className="p-1.5 rounded-lg bg-[#FAFAFA] hover:bg-[#E5E5E5] text-[#111111] transition-colors border border-[#E5E5E5] cursor-pointer"
          >
            <Eye size={13} />
          </button>
          <button
            id={`download-test-btn-${test.id}`}
            onClick={handleDownload}
            disabled={downloading}
            title="Download Question Paper"
            className="p-1.5 rounded-lg bg-[#FAFAFA] hover:bg-[#E5E5E5] text-[#111111] transition-colors border border-[#E5E5E5] disabled:opacity-40 cursor-pointer"
          >
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          </button>
          {canDelete && (
            <button
              id={`delete-test-btn-${test.id}`}
              onClick={handleDeleteClick}
              disabled={deleting}
              title="Delete Test Paper"
              className="p-1.5 rounded-lg bg-[#FAFAFA] hover:bg-[#FEE2E2] text-[#DC2626] transition-colors border border-[#E5E5E5] disabled:opacity-50 cursor-pointer"
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherTestCard;
