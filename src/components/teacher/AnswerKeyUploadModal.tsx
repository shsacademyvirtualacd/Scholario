import React, { useState, useEffect } from 'react';
import { Clock, Upload, KeyRound, AlertCircle, CheckCircle2, Loader2, X, FileText } from 'lucide-react';
import type { TestPaper } from '../../types';
import { uploadAnswerKeyToR2 } from '../../lib/db';

interface AnswerKeyUploadModalProps {
  isOpen: boolean;
  test: TestPaper | null;
  onClose: () => void;
  onSuccess: (updatedTest: TestPaper) => void;
}

export const AnswerKeyUploadModal: React.FC<AnswerKeyUploadModalProps> = ({
  isOpen,
  test,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || !test) return;

    const publishedAtTime = new Date(test.published_at || test.created_at).getTime();
    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - publishedAtTime;
      const left = Math.max(0, Math.floor((FIVE_MINUTES_MS - elapsed) / 1000));
      setSecondsRemaining(left);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isOpen, test]);

  if (!isOpen || !test) return null;

  const isWindowClosed = secondsRemaining <= 0;
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timerDisplay = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !test) return;
    if (isWindowClosed) {
      setError('The 5-minute answer key window has expired for this test paper.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const result = await uploadAnswerKeyToR2(test.id, file, (pct) => setProgress(pct));
      const updated: TestPaper = {
        ...test,
        has_answer_key: true,
        answer_key_url: result.answer_key_url || `/api/tests/answer-key/view/${test.id}`,
        answer_key_name: file.name,
      };
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error('Answer key upload modal error:', err);
      setError(err.message || 'Failed to attach answer key. Please retry.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      id="answer-key-upload-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) onClose();
      }}
    >
      <div
        id="answer-key-upload-modal-content"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[#E5E5E5]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5] bg-[#FAFAFA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E293B] text-white flex items-center justify-center shadow-xs">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#111111]">Attach Answer Key</h3>
              <p className="text-xs text-[#737373]">{test.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#111111] hover:bg-[#E5E5E5] transition-colors disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Live Countdown Banner */}
          {!isWindowClosed ? (
            <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1D4ED8]">
                <Clock size={16} className="animate-pulse text-[#2563EB]" />
                <span>5-Minute Upload Window Active</span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#1D4ED8] text-white text-xs font-black tracking-wider">
                {timerDisplay}
              </span>
            </div>
          ) : (
            <div className="p-3.5 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-xs text-[#991B1B] flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-[#DC2626]" />
              <span>The 5-minute answer key window has expired for this test paper.</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-xs text-[#991B1B] flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 text-[#DC2626] mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs text-[#525252]">
            Uploading a marking scheme enables instant <strong>Gemini AI Auto-Grading</strong> when students submit their answer sheets. Answer keys are strictly protected and never shown to students.
          </p>

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleFileDrop}
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              isWindowClosed
                ? 'border-[#E5E5E5] bg-[#F5F5F5] opacity-60'
                : dragActive
                ? 'border-[#2563EB] bg-[#EFF6FF]'
                : file
                ? 'border-[#10B981] bg-[#ECFDF5]'
                : 'border-[#E2E8F0] bg-[#FAFAFA] hover:bg-[#F1F5F9]'
            }`}
          >
            <input
              type="file"
              id="answer-key-modal-file-input"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              disabled={uploading || isWindowClosed}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />

            {file ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 text-[#059669] flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-[#111111] truncate max-w-xs">{file.name}</p>
                  <p className="text-[11px] text-[#737373]">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to attach
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="w-9 h-9 rounded-xl bg-[#E2E8F0] text-[#475569] flex items-center justify-center mx-auto">
                  <Upload size={17} />
                </div>
                <p className="text-xs font-bold text-[#111111]">
                  Drag & drop Marking Scheme PDF, or <span className="underline">browse files</span>
                </p>
                <p className="text-[11px] text-[#737373]">Supports PDF, JPG, PNG (max 25MB)</p>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-[#525252]">
                <span>Uploading answer key...</span>
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

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#525252] hover:bg-[#F5F5F5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file || isWindowClosed}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-[#262626] text-white text-xs font-extrabold transition-all shadow-xs disabled:opacity-40"
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Attach Answer Key</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnswerKeyUploadModal;
