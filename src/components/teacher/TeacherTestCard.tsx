import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Award,
  User,
  Eye,
  Download,
  Trash2,
  Loader2,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import type { TestPaper } from '../../types';
import { downloadTestBlob, deleteTestPaper } from '../../lib/db';

interface TeacherTestCardProps {
  test: TestPaper;
  isSelected?: boolean;
  onSelect: (test: TestPaper) => void;
  onView: (test: TestPaper) => void;
  onDelete: (testId: string) => void;
  onOpenAnswerKeyUpload?: (test: TestPaper) => void;
  onViewAnswerKey?: (test: TestPaper) => void;
}

export const TeacherTestCard: React.FC<TeacherTestCardProps> = ({
  test,
  isSelected,
  onSelect,
  onView,
  onDelete,
  onOpenAnswerKeyUpload,
  onViewAnswerKey,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Check 5-minute window for tests without an answer key
  useEffect(() => {
    if (test.has_answer_key || test.answer_key_path || test.answer_key_url) {
      setSecondsRemaining(0);
      return;
    }

    const publishedAtTime = new Date(test.published_at || test.created_at).getTime();
    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    const calcTime = () => {
      const now = Date.now();
      const elapsed = now - publishedAtTime;
      const left = Math.max(0, Math.floor((FIVE_MINUTES_MS - elapsed) / 1000));
      setSecondsRemaining(left);
    };

    calcTime();
    const timer = setInterval(calcTime, 1000);
    return () => clearInterval(timer);
  }, [test]);

  const hasAnswerKey = Boolean(test.has_answer_key || test.answer_key_path || test.answer_key_url);
  const isWindowActive = !hasAnswerKey && secondsRemaining > 0;
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timerDisplay = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

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
        {/* Top Row: Tags & Answer Key Status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-[#111111] text-white">
              {test.subject}
            </span>
            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5]">
              Grade {test.grade} {test.stream && test.stream !== 'all' ? `• ${test.stream}` : ''}
            </span>
          </div>

          {/* Answer Key / Auto-Grading Badge */}
          {hasAnswerKey ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
              <Sparkles size={11} />
              <span>Marking Scheme Attached</span>
            </span>
          ) : isWindowActive ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              <KeyRound size={11} />
              <span>Upload Window: {timerDisplay}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F5F5] text-[#737373] border border-[#E5E5E5]">
              Manual Grading
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm font-extrabold text-[#111111] line-clamp-1 mb-1">{test.title}</h4>

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
          <p className="text-[11px] text-[#737373] line-clamp-2 mb-3 bg-[#FAFAFA] p-2 rounded-xl border border-[#F0F0F0]">
            {test.instructions}
          </p>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="pt-2.5 border-t border-[#F5F5F5] flex items-center justify-between gap-2 mt-auto flex-wrap">
        <span className="text-[10px] text-[#A3A3A3]">
          Uploaded {new Date(test.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* If 5-min window is open and no key attached, show 'Add Answer Key' button */}
          {isWindowActive && onOpenAnswerKeyUpload && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenAnswerKeyUpload(test);
              }}
              className="px-2 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-extrabold transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer"
              title="Add Answer Key (Window expiring soon)"
            >
              <KeyRound size={11} />
              <span>Add Key ({timerDisplay})</span>
            </button>
          )}

          {/* If Answer Key already attached: Preview Key button */}
          {hasAnswerKey && onViewAnswerKey && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewAnswerKey(test);
              }}
              className="p-1.5 rounded-lg bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#059669] transition-colors border border-[#A7F3D0] cursor-pointer"
              title="Preview Official Answer Key (Faculty Only)"
            >
              <KeyRound size={13} />
            </button>
          )}

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
          <button
            id={`delete-test-btn-${test.id}`}
            onClick={handleDeleteClick}
            disabled={deleting}
            title="Delete Test Paper"
            className="p-1.5 rounded-lg bg-[#FAFAFA] hover:bg-[#FEE2E2] text-[#DC2626] transition-colors border border-[#E5E5E5] disabled:opacity-50 cursor-pointer"
          >
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherTestCard;
