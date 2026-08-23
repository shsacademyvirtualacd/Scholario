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
} from 'lucide-react';
import type { TestPaper, TestSubmission } from '../../types';
import { uploadTestSubmissionToR2, downloadSubmissionBlob } from '../../lib/db';
import { useAuth } from '../../features/auth/AuthContext';
import { MathText } from '../common/MathText';

interface StudentSubmissionPanelProps {
  selectedTest: TestPaper | null;
  submission: TestSubmission | undefined;
  onOpenTestViewer: (test: TestPaper) => void;
  onOpenSubmissionViewer: (sub: TestSubmission) => void;
  onSubmissionSuccess: (newSub: TestSubmission) => void;
}

export const StudentSubmissionPanel: React.FC<StudentSubmissionPanelProps> = ({
  selectedTest,
  submission,
  onOpenTestViewer,
  onOpenSubmissionViewer,
  onSubmissionSuccess,
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
      <div
        id="student-submission-empty-panel"
        className="bg-white rounded-2xl border border-[#E5E5E5] p-8 text-center flex flex-col items-center justify-center min-h-[480px] shadow-xs"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] text-[#A3A3A3] flex items-center justify-center mb-4">
          <FileCheck2 size={28} />
        </div>
        <h3 className="text-base font-extrabold text-[#111111] mb-1">Select a Test Paper</h3>
        <p className="text-xs text-[#737373] max-w-sm">
          Click any test paper from the left column to view assessment instructions, download the question paper, and upload your answer sheet.
        </p>
      </div>
    );
  }

  const isGraded = submission?.status === 'graded';
  const isSubmitted = !!submission && !showReupload;

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

  return (
    <div
      id={`submission-panel-${selectedTest.id}`}
      className="bg-white rounded-2xl border border-[#E5E5E5] p-5 sm:p-6 shadow-xs space-y-6 flex flex-col"
    >
      {/* Test Overview Header */}
      <div className="border-b border-[#E5E5E5] pb-5">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-[#111111] text-white">
              {selectedTest.subject}
            </span>
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5]">
              Grade {selectedTest.grade} {selectedTest.stream && selectedTest.stream !== 'all' ? `• ${selectedTest.stream}` : ''}
            </span>
          </div>

          <button
            id="preview-question-paper-btn"
            onClick={() => onOpenTestViewer(selectedTest)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFAFA] hover:bg-[#E5E5E5] text-[#111111] text-xs font-bold border border-[#E5E5E5] transition-colors"
          >
            <Eye size={14} />
            <span>Open Question Paper</span>
          </button>
        </div>

        <h3 className="text-lg font-extrabold text-[#111111] mb-2">
          <MathText text={selectedTest.title} />
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#FAFAFA] p-3 rounded-xl border border-[#F0F0F0] text-xs">
          <div>
            <span className="text-[11px] text-[#737373] block">Teacher</span>
            <span className="font-bold text-[#111111] flex items-center gap-1 mt-0.5">
              <User size={12} className="text-[#A3A3A3]" /> {selectedTest.teacher_name || 'Faculty'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-[#737373] block">Total Marks</span>
            <span className="font-bold text-[#111111] flex items-center gap-1 mt-0.5">
              <Award size={12} className="text-[#A3A3A3]" /> {selectedTest.total_marks} Marks
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[11px] text-[#737373] block">Due Date</span>
            <span className="font-bold text-[#111111] flex items-center gap-1 mt-0.5">
              <Calendar size={12} className="text-[#A3A3A3]" /> {new Date(selectedTest.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {selectedTest.instructions && (
          <div className="mt-3 text-xs text-[#525252] bg-[#FFFBEB] border border-[#FDE68A] p-3 rounded-xl">
            <strong className="text-[#92400E] block font-bold mb-0.5">Teacher Instructions:</strong>
            <div className="text-[#78350F]">
              <MathText text={selectedTest.instructions} />
            </div>
          </div>
        )}
      </div>

      {/* Submission State Container */}
      <div className="space-y-4 flex-1">
        <h4 className="text-sm font-extrabold text-[#111111] flex items-center justify-between">
          <span>Your Answer Sheet Submission</span>
          {isSubmitted && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${
                isGraded
                  ? 'bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]'
                  : 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]'
              }`}
            >
              {isGraded ? 'Graded' : 'Submitted'}
            </span>
          )}
        </h4>

        {/* If Graded: Show Marks & Remarks */}
        {isSubmitted && isGraded && (
          <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#16A34A] text-white flex items-center justify-center">
                  <Award size={16} />
                </div>
                <div>
                  <span className="text-[11px] text-[#15803D] font-bold block">Assigned Marks</span>
                  <span className="text-lg font-black text-[#111111]">
                    {submission.marks_obtained !== null && submission.marks_obtained !== undefined ? submission.marks_obtained : '—'}{' '}
                    <span className="text-xs font-semibold text-[#737373]">/ {selectedTest.total_marks}</span>
                  </span>
                </div>
              </div>
              {submission.marks_obtained !== null && selectedTest.total_marks > 0 && (
                <div className="text-right">
                  <span className="text-xs font-black text-[#16A34A] px-2 py-1 bg-white rounded-lg border border-[#86EFAC]">
                    {Math.round(((submission.marks_obtained || 0) / selectedTest.total_marks) * 100)}%
                  </span>
                </div>
              )}
            </div>

            {submission.teacher_feedback && (
              <div className="pt-2 border-t border-[#DCFCE7] text-xs text-[#1F2937]">
                <strong className="text-[#15803D]">Teacher's Remark: </strong>
                <span><MathText text={submission.teacher_feedback} /></span>
              </div>
            )}
          </div>
        )}

        {/* If Submitted: Show Uploaded File Card */}
        {isSubmitted ? (
          <div className="space-y-3">
            <div className="p-4 bg-[#FAFAFA] border border-[#E5E5E5] rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#111111] text-white flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-[#111111] truncate">
                    {submission.student_name || 'My'}_Answer_Sheet.{submission.file_type === 'pdf' ? 'pdf' : 'jpg'}
                  </p>
                  <p className="text-[11px] text-[#737373]">
                    Submitted {new Date(submission.submitted_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="view-submitted-answersheet-btn"
                  onClick={() => onOpenSubmissionViewer(submission)}
                  className="p-2 rounded-xl bg-white hover:bg-[#E5E5E5] text-[#111111] text-xs font-bold border border-[#E5E5E5] transition-colors"
                  title="View Submitted Answer Sheet"
                >
                  <Eye size={15} />
                </button>
                <button
                  id="download-submitted-answersheet-btn"
                  onClick={handleDownloadSub}
                  disabled={downloadingSub}
                  className="p-2 rounded-xl bg-white hover:bg-[#E5E5E5] text-[#111111] text-xs font-bold border border-[#E5E5E5] transition-colors disabled:opacity-40"
                  title="Download Submitted Answer Sheet"
                >
                  {downloadingSub ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                </button>
              </div>
            </div>

            {!isGraded && (
              <div className="flex justify-end">
                <button
                  id="reupload-answersheet-btn"
                  onClick={() => setShowReupload(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#525252] hover:text-[#111111] hover:underline"
                >
                  <RotateCcw size={12} />
                  <span>Replace / Re-upload Answer Sheet</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Upload Form */
          <form onSubmit={handleUploadSubmission} className="space-y-4">
            {error && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-xs text-[#991B1B] flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 text-[#DC2626] mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div
              id="student-submission-dropzone"
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleFileDrop}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                dragActive
                  ? 'border-[#111111] bg-[#F5F5F5]'
                  : file
                  ? 'border-[#22C55E] bg-[#F0FDF4]'
                  : 'border-[#E5E5E5] bg-[#FAFAFA] hover:bg-[#F5F5F5]'
              }`}
            >
              <input
                type="file"
                id="student-answer-file-input"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileChange}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 text-[#16A34A] flex items-center justify-center shrink-0">
                    <FileCheck2 size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-[#111111] truncate max-w-xs">{file.name}</p>
                    <p className="text-[11px] text-[#737373]">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to submit
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#E5E5E5] text-[#525252] flex items-center justify-center mx-auto">
                    <Upload size={20} />
                  </div>
                  <p className="text-xs font-extrabold text-[#111111]">
                    Drag & drop your solved answer sheet here, or <span className="underline">browse file</span>
                  </p>
                  <p className="text-[11px] text-[#737373]">
                    Accepted: PDF, Scanned Images (JPG/PNG) up to 25MB
                  </p>
                </div>
              )}
            </div>

            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-[#525252]">
                  <span>Uploading answer sheet...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#111111] transition-all duration-200 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              {showReupload && (
                <button
                  type="button"
                  onClick={() => setShowReupload(false)}
                  disabled={uploading}
                  className="px-3 py-2 text-xs font-bold text-[#525252] hover:text-[#111111]"
                >
                  Cancel Re-upload
                </button>
              )}

              <button
                type="submit"
                id="submit-answersheet-btn"
                disabled={uploading || !file}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#111111] hover:bg-[#262626] text-white text-xs font-extrabold transition-all shadow-sm ml-auto disabled:opacity-40 disabled:hover:bg-[#111111]"
              >
                {uploading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Submitting Answer Sheet...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Submit Answer Sheet</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StudentSubmissionPanel;
