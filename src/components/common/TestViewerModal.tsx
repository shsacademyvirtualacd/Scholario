import React, { useEffect, useState } from 'react';
import { X, Download, FileText, Calendar, Award, User, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import type { TestPaper, TestSubmission } from '../../types';
import { downloadTestBlob, downloadSubmissionBlob } from '../../lib/db';

interface TestViewerModalProps {
  test?: TestPaper | null;
  submission?: TestSubmission | null;
  onClose: () => void;
}

export const TestViewerModal: React.FC<TestViewerModalProps> = ({
  test,
  submission,
  onClose,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const item = test || submission;
  if (!item) return null;

  const isTest = !!test;
  const title = isTest ? test?.title : `${submission?.student_name || 'Student'}'s Submission`;
  const fileUrl = item.file_url;
  const isImage = item.file_type === 'image' || fileUrl?.match(/\.(jpeg|jpg|png|webp|gif)/i);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadProgress(0);
    try {
      if (isTest && test) {
        await downloadTestBlob(test, (pct) => setDownloadProgress(pct));
      } else if (submission) {
        await downloadSubmissionBlob(submission, (pct) => setDownloadProgress(pct));
      }
    } catch (err) {
      console.error('Download error:', err);
      // Fallback direct link download
      if (fileUrl) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = isTest ? `${test?.title || 'test'}.pdf` : `${submission?.student_name || 'submission'}.pdf`;
        link.target = '_blank';
        link.click();
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      id="test-viewer-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="test-viewer-modal-content"
        className="bg-white w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#E5E5E5]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E5] bg-[#FAFAFA] shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-[#111111] truncate">{title}</h3>
                {isTest && test?.subject && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F0F0F0] text-[#111111] border border-[#E0E0E0]">
                    {test.subject}
                  </span>
                )}
                {isTest && test?.grade && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]">
                    Grade {test.grade}
                  </span>
                )}
                {!isTest && submission?.status && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      submission.status === 'graded'
                        ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]'
                        : 'bg-[#FFF8E1] text-[#F57F17] border border-[#FFE082]'
                    }`}
                  >
                    {submission.status}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-[#737373] mt-0.5">
                {isTest && test?.teacher_name && (
                  <span className="flex items-center gap-1">
                    <User size={12} /> {test.teacher_name}
                  </span>
                )}
                {isTest && test?.due_date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> Due: {new Date(test.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {isTest && test?.total_marks && (
                  <span className="flex items-center gap-1 font-semibold text-[#111111]">
                    <Award size={12} /> Total Marks: {test.total_marks}
                  </span>
                )}
                {!isTest && submission?.submitted_at && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> Submitted: {new Date(submission.submitted_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="test-modal-download-btn"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111111] hover:bg-[#262626] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{downloadProgress > 0 ? `${downloadProgress}%` : 'Downloading...'}</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span className="hidden sm:inline">Download File</span>
                </>
              )}
            </button>
            <button
              id="test-modal-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-[#737373] hover:text-[#111111] hover:bg-[#E5E5E5] transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Teacher Instructions Banner (if test) */}
        {isTest && test?.instructions && (
          <div className="px-5 py-2.5 bg-[#FFFBEB] border-b border-[#FDE68A] text-xs text-[#92400E] flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-[#D97706]" />
            <div>
              <strong className="font-bold">Instructions: </strong>
              {test.instructions}
            </div>
          </div>
        )}

        {/* Graded Feedback Banner (if submission) */}
        {!isTest && submission?.status === 'graded' && (
          <div className="px-5 py-3 bg-[#F0FDF4] border-b border-[#BBF7D0] flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
              <span className="font-bold text-[#15803D]">Score Awarded:</span>
              <span className="font-extrabold text-[#111111] text-sm">
                {submission.marks_obtained !== null && submission.marks_obtained !== undefined ? submission.marks_obtained : '—'}
                {submission.max_marks ? ` / ${submission.max_marks}` : ''}
              </span>
            </div>
            {submission.teacher_feedback && (
              <div className="text-[#374151]">
                <strong className="font-bold text-[#1F2937]">Feedback:</strong> {submission.teacher_feedback}
              </div>
            )}
          </div>
        )}

        {/* Preview Frame */}
        <div className="flex-1 bg-[#262626] relative overflow-hidden flex items-center justify-center p-2">
          {fileUrl ? (
            isImage ? (
              <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                <img
                  src={fileUrl}
                  alt={title}
                  className="max-w-full max-h-full object-contain rounded shadow-lg"
                />
              </div>
            ) : (
              <iframe
                src={`${fileUrl}#toolbar=0&navpanes=0`}
                title={title}
                className="w-full h-full border-0 rounded bg-white shadow-md"
              />
            )
          ) : (
            <div className="text-center text-white p-6">
              <BookOpen size={48} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm font-semibold">Preview not available directly.</p>
              <p className="text-xs text-gray-400 mt-1">Please use the download button above to view the file.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestViewerModal;
