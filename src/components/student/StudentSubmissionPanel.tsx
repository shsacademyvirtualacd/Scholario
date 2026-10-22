import React, { useState } from 'react';
import {
  Upload,
  FileCheck2,
  FileText,
  Calendar,
  Award,
  User,
  Eye,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Clock,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import type { TestPaper, TestSubmission } from '../../types';
import { uploadTestSubmissionToR2, downloadSubmissionBlob } from '../../lib/db';
import { useAuth } from '../../features/auth/AuthContext';
import { MathText } from '../common/MathText';
import {
  formatProperName,
  formatTitleCase,
  formatStandardDate,
  formatStandardDateTime,
} from '../../utils/studentFormatting';
import { StudentStatusBadge } from './shared/StudentStatusBadge';

interface StudentSubmissionPanelProps {
  selectedTest: TestPaper | null;
  submission: TestSubmission | undefined;
  onOpenTestViewer: (test: TestPaper) => void;
  onOpenSubmissionViewer: (sub: TestSubmission) => void;
  onSubmissionSuccess: (newSub: TestSubmission) => void;
  onBackToList?: () => void;
}

export const StudentSubmissionPanel: React.FC<StudentSubmissionPanelProps> = ({
  selectedTest,
  submission,
  onOpenTestViewer,
  onOpenSubmissionViewer,
  onSubmissionSuccess,
  onBackToList,
}) => {
  const { profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [showReupload, setShowReupload] = useState<boolean>(false);
  const [downloadingSub, setDownloadingSub] = useState<boolean>(false);

  if (!selectedTest) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 p-8 text-center flex flex-col items-center justify-center min-h-[420px] shadow-2xs space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mb-1">
          <FileCheck2 size={26} />
        </div>
        <h3 className="text-base font-bold text-neutral-900 dark:text-white">Select a Class Test</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">
          Choose a test from the list to view question instructions, open the question paper, and submit your completed answer sheet.
        </p>
      </div>
    );
  }

  const isGraded = submission?.status === 'graded';
  const isSubmitted = Boolean(submission) && !showReupload;

  // Due date checks
  const dueDate = new Date(selectedTest.due_date);
  dueDate.setHours(23, 59, 59, 999);
  const isPastDue = new Date().getTime() > dueDate.getTime();
  const isSubmittedLate =
    Boolean(submission?.submitted_at) &&
    new Date(submission!.submitted_at).getTime() > dueDate.getTime();

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedTest) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const fileType = file.type.includes('image')
        ? 'image'
        : file.name.endsWith('.doc') || file.name.endsWith('.docx')
        ? 'doc'
        : 'pdf';

      const result = await uploadTestSubmissionToR2(
        file,
        {
          test_id: selectedTest.id,
          student_name: profile?.full_name || 'Student',
          student_email: profile?.phone || undefined,
          grade: selectedTest.grade,
          stream: selectedTest.stream,
          subject: selectedTest.subject,
          file_type: fileType,
        },
        (pct) => setProgress(pct)
      );

      const createdSub: TestSubmission = result.submission || {
        id: `sub_${Date.now()}`,
        test_id: selectedTest.id,
        student_id: profile?.id || 'student',
        student_name: profile?.full_name || 'Student',
        student_email: profile?.phone || undefined,
        file_url: `/api/submissions/view/sub_${Date.now()}`,
        file_type: fileType,
        file_size_bytes: file.size,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
        marks_obtained: null,
        max_marks: selectedTest.total_marks,
        teacher_feedback: null,
      };

      setFile(null);
      setShowReupload(false);
      onSubmissionSuccess(createdSub);
    } catch (err: any) {
      console.error('Submission upload error:', err);
      setError(err.message || 'Failed to upload answer sheet. Please retry.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSub = async () => {
    if (!submission) return;
    setDownloadingSub(true);
    try {
      await downloadSubmissionBlob(submission);
    } catch {
      if (submission.file_url) {
        const link = document.createElement('a');
        link.href = submission.file_url;
        link.download = `${submission.student_name || 'answer_sheet'}.pdf`;
        link.target = '_blank';
        link.click();
      }
    } finally {
      setDownloadingSub(false);
    }
  };

  const titleClean = formatTitleCase(selectedTest.title);
  const teacherName = formatProperName(selectedTest.teacher_name || 'Faculty Teacher');

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Back button (Mobile view) */}
      {onBackToList && (
        <button
          type="button"
          onClick={onBackToList}
          className="lg:hidden min-h-[44px] min-w-[44px] -ml-2 px-3 py-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to all tests</span>
        </button>
      )}

      {/* ── 1. Title & Subject Tags ── */}
      <div className="space-y-2 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
            {selectedTest.subject}
          </span>
          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
            Grade {selectedTest.grade}
          </span>
          {isSubmitted && (
            <StudentStatusBadge
              status={isGraded ? 'graded' : isSubmittedLate ? 'submitted_late' : 'submitted'}
              size="sm"
            />
          )}
        </div>

        <h2 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white leading-tight">
          {titleClean}
        </h2>
      </div>

      {/* ── 2. Info Grid: Teacher, Total Marks, Due Date ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-neutral-50 dark:bg-neutral-850 rounded-2xl border border-neutral-150 dark:border-neutral-800 text-xs">
        <div>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block font-medium">Instructor</span>
          <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 mt-0.5">
            <User size={13} className="text-amber-500" />
            <span>{teacherName}</span>
          </span>
        </div>
        <div>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block font-medium">Assessment Weight</span>
          <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 mt-0.5">
            <Award size={13} className="text-amber-500" />
            <span>{selectedTest.total_marks} Total Marks</span>
          </span>
        </div>
        <div>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block font-medium">Due Date</span>
          <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 mt-0.5">
            <Calendar size={13} className="text-amber-500" />
            <span>{formatStandardDate(selectedTest.due_date)}</span>
          </span>
        </div>
      </div>

      {/* ── 3. Open Question Paper Button ── */}
      <div>
        <button
          type="button"
          onClick={() => onOpenTestViewer(selectedTest)}
          className="min-h-[44px] min-w-[44px] w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Eye size={16} />
          <span>Open Question Paper</span>
        </button>
      </div>

      {/* Teacher Instructions */}
      {selectedTest.instructions && (
        <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 rounded-2xl text-xs space-y-1">
          <span className="font-bold text-amber-900 dark:text-amber-300 block">
            Teacher Instructions:
          </span>
          <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
            <MathText text={selectedTest.instructions} />
          </p>
        </div>
      )}

      {/* Unsubmitted Overdue Note */}
      {!isSubmitted && isPastDue && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2.5">
          <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          <span>
            This assessment is past its deadline. Contact your teacher if you need more time to submit.
          </span>
        </div>
      )}

      {/* ── 4. Submission Section ── */}
      <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
          Answer Sheet Submission
        </h3>

        {/* If Graded: Show Marks and Remarks */}
        {isSubmitted && isGraded && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Graded Score
              </span>
              <span className="text-base font-black text-emerald-900 dark:text-emerald-200">
                {submission?.marks_obtained ?? '—'} / {selectedTest.total_marks}
              </span>
            </div>
            {submission?.teacher_feedback && (
              <p className="text-xs text-emerald-900 dark:text-emerald-300 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                <strong>Teacher's Remark:</strong> "{submission.teacher_feedback}"
              </p>
            )}
          </div>
        )}

        {/* If Submitted: Show Uploaded File Card */}
        {isSubmitted ? (
          <div className="space-y-3">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                    {submission?.student_name || 'My'}_Answer_Sheet.
                    {submission?.file_type === 'pdf' ? 'pdf' : 'jpg'}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Submitted {formatStandardDateTime(submission?.submitted_at)}
                    {isSubmittedLate && (
                      <span className="text-rose-600 dark:text-rose-400 font-bold ml-1.5">
                        (Submitted late)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenSubmissionViewer(submission!)}
                  className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                  title="View Submitted Sheet"
                >
                  <Eye size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSub}
                  disabled={downloadingSub}
                  className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40"
                  title="Download Sheet"
                >
                  {downloadingSub ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                </button>
              </div>
            </div>

            {/* Re-upload button (Respecting existing rule: allowed if !isGraded) */}
            {!isGraded && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowReupload(true)}
                  className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer transition-colors"
                >
                  <RotateCcw size={13} />
                  <span>Replace / Re-upload Answer Sheet</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Upload Form */
          <form onSubmit={handleUploadSubmission} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 rounded-xl flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleFileDrop}
              className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-amber-400 bg-amber-50/20 dark:bg-amber-950/10'
                  : file
                  ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileChange}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
              />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileCheck2 size={20} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-neutral-900 dark:text-white truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to submit
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center mx-auto">
                    <Upload size={22} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                      Drop answer file here or tap to browse
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Accepts PDF, JPG, PNG up to 25MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {file && (
              <div className="flex items-center justify-between gap-3 pt-1">
                {showReupload && (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setShowReupload(false);
                    }}
                    className="min-h-[44px] px-3 text-xs font-semibold text-neutral-500 hover:text-neutral-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={uploading}
                  className="min-h-[44px] min-w-[44px] w-full py-2.5 px-5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Uploading ({progress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Submit Answer Sheet</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default StudentSubmissionPanel;
