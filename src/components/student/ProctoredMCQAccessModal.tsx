import React, { useState } from 'react';
import { ShieldAlert, KeyRound, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { toast } from 'sonner';
import type { ProctoredMCQTest } from '../../types/proctoredMcq';

interface ProctoredMCQAccessModalProps {
  isOpen: boolean;
  test: ProctoredMCQTest | null;
  defaultStudentId: string;
  defaultStudentName: string;
  onClose: () => void;
  onVerified: (studentId: string, studentName: string) => void;
}

export const ProctoredMCQAccessModal: React.FC<ProctoredMCQAccessModalProps> = ({
  isOpen,
  test,
  defaultStudentId,
  defaultStudentName,
  onClose,
  onVerified,
}) => {
  const [studentIdInput, setStudentIdInput] = useState<string>(defaultStudentId);
  const [studentNameInput] = useState<string>(defaultStudentName);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);

  if (!isOpen || !test) return null;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const id = studentIdInput.trim();
    if (!id) {
      toast.error('Please enter your Student ID to access this assessment.');
      return;
    }
    if (!acknowledged) {
      toast.error('Please acknowledge the anti-cheating proctoring terms before entering.');
      return;
    }
    onVerified(id, studentNameInput.trim() || 'Student');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E5E5E5] overflow-hidden p-6 sm:p-7">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#737373] hover:text-[#111111] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111111] text-[#F4C430] text-[10px] font-black uppercase tracking-wider mb-2 shadow-2xs">
            <ShieldAlert size={12} />
            <span>Active Proctoring Enabled</span>
          </div>
          <h2 className="text-xl font-black text-[#111111] tracking-tight">{test.title}</h2>
          <p className="text-xs text-[#737373] mt-0.5">
            {test.subject} • Grade {test.grade} • {test.duration_minutes} Mins • {test.questions.length} MCQs
          </p>
        </div>

        {/* Anti-Cheating Warning Box */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-950 space-y-2 mb-5">
          <div className="flex items-center gap-2 font-black text-xs">
            <AlertTriangle size={15} className="text-amber-700 shrink-0" />
            <span>Proctored Assessment Notice</span>
          </div>
          <p className="text-xs font-bold text-amber-950 leading-snug">
            This is a proctored exam. Screenshots, screen recording, tab-switching, or leaving this window will auto-submit your test and may be flagged for review.
          </p>
          <ul className="text-[11px] space-y-1.5 list-disc pl-4 text-amber-900 font-medium leading-relaxed pt-1 border-t border-amber-200/70">
            <li>
              <strong>Tab & Focus Loss:</strong> Leaving or minimizing the test window triggers immediate auto-submission.
            </li>
            <li>
              <strong>Screenshots & Shortcuts:</strong> PrintScreen, screen capture tools, and DevTools trigger instantaneous auto-submission.
            </li>
            <li>
              <strong>Dynamic Watermark:</strong> Content is watermarked with your candidate details and timestamp for leak traceability.
            </li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-[#111111] mb-1.5 flex items-center gap-1.5">
              <KeyRound size={13} className="text-[#F4C430]" />
              <span>Enter your Student ID</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. STU-1001 or Roll Number"
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border-2 border-[#111111] bg-[#FAFAFA] font-mono text-sm font-bold text-[#111111] focus:outline-hidden focus:bg-white transition-all"
            />
            <p className="text-[10px] text-[#737373] mt-1">
              Your registered institutional Student ID or Roll Number is required to access the exam.
            </p>
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#D4D4D4] text-[#111111] focus:ring-0 cursor-pointer"
            />
            <span className="text-[11px] font-semibold text-[#111111] leading-snug">
              I understand that taking screenshots, switching tabs, or leaving this window will auto-submit my test with a proctoring violation.
            </span>
          </label>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#737373] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-2 py-3 rounded-xl bg-[#111111] hover:bg-black text-[#F4C430] text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.99]"
            >
              <span>Verify & Begin Exam</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProctoredMCQAccessModal;
