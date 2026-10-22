import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Download,
  Maximize2,
  FileText,
  AlertCircle,
  XCircle,
  Award,
  Sparkles,
  Phone,
  Mail,
  Loader2,
  Share2,
} from 'lucide-react';
import { ReceiptViewerData } from '../ReceiptViewerModal';

export interface PendingFeeItem {
  student_id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  class_name: string;
  grade: string;
  board_id: string;
  board_name: string;
  subjects?: string[];
  plan_type?: 'custom' | 'all';
  amount: number;
  original_amount?: number;
  scholarship_status?: string;
  scholarship_discount_percentage?: number;
  claimed_marks?: number | null;
  submission_note?: string | null;
  updated_at: string;
  proof_url?: string | null;
  proof_filename?: string | null;
  proof_file_type?: string | null;
  proof_uploaded_at?: string | null;
  rejection_reason?: string | null;
  explanation_label?: string;
}

interface AdminPendingCardProps {
  item: PendingFeeItem;
  onApprove: (studentId: string, note?: string) => Promise<void>;
  onReject: (studentId: string, reason: string) => Promise<void>;
  onOpenReceiptViewer: (data: ReceiptViewerData) => void;
  isApproving?: boolean;
}

export const AdminPendingCard: React.FC<AdminPendingCardProps> = ({
  item,
  onApprove,
  onReject,
  onOpenReceiptViewer,
  isApproving = false,
}) => {
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [auditComment, setAuditComment] = useState('');

  const hasProof = Boolean(item.proof_url);
  const isPdf =
    item.proof_file_type?.includes('pdf') ||
    item.proof_url?.toLowerCase().includes('.pdf') ||
    item.proof_filename?.toLowerCase().endsWith('.pdf');

  // Fix duplicate "Gr. Grade 9"
  const cleanClassName = item.class_name?.replace(/Gr\.\s*Grade/gi, 'Grade') || 'Grade 9';

  const handleConfirmApprove = async () => {
    setShowApproveConfirm(false);
    await onApprove(item.student_id, auditComment);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError('Please enter a specific reason for rejection.');
      return;
    }
    setRejectError(null);
    setIsRejecting(true);
    try {
      await onReject(item.student_id, rejectReason.trim());
      setShowRejectModal(false);
      setRejectReason('');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-[#E5E5E5] dark:border-[#2D2D2D] p-5 sm:p-6 transition-all duration-200 hover:shadow-md">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Student Meta & Billing Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          {/* Header Row: Student Name + Class Badge */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base font-extrabold text-[#111111] dark:text-white">
                {item.full_name}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F4C430]/15 text-[#92700A] dark:text-[#F4C430] border border-[#F4C430]/30 whitespace-nowrap">
                {cleanClassName}
              </span>
              {item.plan_type === 'custom' && item.subjects && item.subjects.length > 0 ? (
                <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-[11px] font-bold">
                  {item.subjects.length} Custom {item.subjects.length === 1 ? 'Subject' : 'Subjects'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-[11px] font-bold">
                  All Subjects Package
                </span>
              )}
            </div>

            {/* Contact details */}
            <div className="flex items-center gap-4 text-xs text-[#737373] dark:text-[#A3A3A3] flex-wrap">
              {item.email && (
                <span className="flex items-center gap-1">
                  <Mail size={12} className="text-[#A3A3A3]" />
                  <span>{item.email}</span>
                </span>
              )}
              {item.phone && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone size={12} className="text-[#A3A3A3]" />
                  <span>{item.phone}</span>
                </span>
              )}
            </div>
          </div>

          {/* Enrolled Subjects List */}
          {item.subjects && item.subjects.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373] dark:text-[#A3A3A3] block">
                Active Enrolled Subjects
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {item.subjects.map((subj, sIdx) => (
                  <span
                    key={sIdx}
                    className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-[#F5F5F5] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333] text-[#262626] dark:text-[#E5E5E5]"
                  >
                    {subj}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Verification Breakdown Card */}
          <div className="p-3.5 rounded-xl bg-[#FAFAFA] dark:bg-[#202020] border border-[#E5E5E5] dark:border-[#2E2E2E] space-y-2">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-[#737373] dark:text-[#A3A3A3] font-medium">Standard Expected Amount:</span>
              <span className={`font-mono font-bold ${item.original_amount && item.amount < item.original_amount ? 'line-through text-[#A3A3A3]' : 'text-[#111111] dark:text-white'}`}>
                PKR {(item.original_amount || item.amount).toLocaleString()}
              </span>
            </div>

            {/* Scholarship Discount Row */}
            {item.scholarship_discount_percentage && item.scholarship_discount_percentage > 0 ? (
              <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold border-t border-[#E5E5E5] dark:border-[#2E2E2E] pt-2">
                <span className="flex items-center gap-1">
                  <Award size={13} />
                  <span>{item.scholarship_status === 'verified' ? 'Verified' : 'Claimed'} {item.scholarship_discount_percentage}% Merit Scholarship:</span>
                </span>
                <span>
                  -PKR {Math.round(((item.original_amount || item.amount) * (item.scholarship_discount_percentage / 100))).toLocaleString()}
                </span>
              </div>
            ) : null}

            {/* Final Payable Amount Row */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E5] dark:border-[#2E2E2E]">
              <span className="text-xs font-extrabold text-[#111111] dark:text-white">
                Final Amount to Verify:
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-mono shadow-xs">
                PKR {item.amount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Submission Note */}
          {item.submission_note && (
            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
              <span className="font-bold text-amber-900 dark:text-amber-300">Student Note: </span>
              {item.submission_note}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-[#A3A3A3] font-medium">
            <Clock size={12} />
            <span>Updated: {new Date(item.updated_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Right Column (5 cols): Receipt Proof Box & Action Buttons */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4 border-t lg:border-t-0 lg:border-l border-[#E5E5E5] dark:border-[#2D2D2D] pt-4 lg:pt-0 lg:pl-6">
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373] dark:text-[#A3A3A3] block">
              Payment Receipt Proof
            </span>

            {/* Proof Display State */}
            {hasProof && item.proof_url ? (
              <div className="rounded-2xl border border-[#E5E5E5] dark:border-[#333] bg-[#FAFAFA] dark:bg-[#1E1E1E] p-3 space-y-2.5">
                {isPdf ? (
                  /* PDF File Card */
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#252525] border border-[#E5E5E5] dark:border-[#333]">
                    <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
                      <FileText size={22} />
                    </div>
                    <div className="flex-1 truncate">
                      <span className="text-xs font-bold text-[#111111] dark:text-white truncate block">
                        {item.proof_filename || 'receipt.pdf'}
                      </span>
                      <span className="text-[10px] text-[#737373] dark:text-[#A3A3A3]">
                        PDF Document • {item.proof_uploaded_at ? new Date(item.proof_uploaded_at).toLocaleDateString() : 'Uploaded'}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Image Thumbnail */
                  <div className="relative group rounded-xl overflow-hidden bg-black/5 dark:bg-black/30 border border-[#E5E5E5] dark:border-[#333] max-h-48 flex items-center justify-center">
                    <img
                      src={item.proof_url}
                      alt={`Receipt from ${item.full_name}`}
                      className="w-full h-40 object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenReceiptViewer({
                            url: item.proof_url!,
                            studentName: item.full_name,
                            filename: item.proof_filename || 'payment_receipt',
                            fileType: item.proof_file_type || 'image/jpeg',
                            uploadedAt: item.proof_uploaded_at || item.updated_at,
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-white/90 text-xs font-bold text-[#111111] hover:bg-white flex items-center gap-1.5 shadow-md"
                      >
                        <Maximize2 size={13} />
                        <span>View full</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* File Meta & Action Buttons */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[10px] text-[#737373] dark:text-[#A3A3A3] truncate max-w-[140px]">
                    {item.proof_filename || 'Receipt attached'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenReceiptViewer({
                          url: item.proof_url!,
                          studentName: item.full_name,
                          filename: item.proof_filename || 'receipt',
                          fileType: isPdf ? 'application/pdf' : 'image/jpeg',
                          uploadedAt: item.proof_uploaded_at || item.updated_at,
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-[#F5F5F5] dark:bg-[#2C2C2C] hover:bg-[#E5E5E5] dark:hover:bg-[#383838] text-[11px] font-bold text-[#111111] dark:text-white transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Maximize2 size={12} />
                      <span>{isPdf ? 'Open PDF' : 'View full'}</span>
                    </button>
                    <a
                      href={item.proof_url.includes('/view/') ? item.proof_url.replace('/view/', '/dl/') : item.proof_url}
                      download={item.proof_filename || 'payment_receipt'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-[#F5F5F5] dark:bg-[#2C2C2C] hover:bg-[#E5E5E5] dark:hover:bg-[#383838] text-[#111111] dark:text-white transition-colors cursor-pointer"
                      title="Download receipt file"
                    >
                      <Download size={13} />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              /* No Receipt Uploaded / WhatsApp State */
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto">
                  <Share2 size={16} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                    No receipt uploaded
                  </h4>
                  <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                    Proof sent via WhatsApp or manual direct bank transfer.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Row: Approve & Reject */}
          <div className="space-y-2 pt-2">
            <input
              type="text"
              placeholder="Optional audit comment..."
              value={auditComment}
              onChange={(e) => setAuditComment(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333] bg-[#FAFAFA] dark:bg-[#202020] text-[#111111] dark:text-white placeholder-[#A3A3A3] focus:outline-none focus:border-[#F4C430]"
            />

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                disabled={isApproving}
                className="flex-1 py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-xs font-bold text-rose-700 dark:text-rose-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] disabled:opacity-50"
              >
                <XCircle size={14} />
                <span>Reject</span>
              </button>

              <button
                type="button"
                onClick={() => setShowApproveConfirm(true)}
                disabled={isApproving}
                className="flex-2 py-2.5 px-4 rounded-xl bg-[#F4C430] hover:bg-[#D4A017] text-xs font-black text-[#111111] transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] disabled:opacity-50"
              >
                {isApproving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Approve &amp; Mark Paid</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirm Approve Modal ── */}
      {showApproveConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-[#E5E5E5] dark:border-[#333] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-[#111111] dark:text-white">
                Approve Payment for {item.full_name}?
              </h3>
              <p className="text-xs text-[#737373] dark:text-[#A3A3A3] leading-relaxed">
                This will mark the student's status as <strong>Paid</strong> for <strong>PKR {item.amount.toLocaleString()}</strong> and immediately unlock all live classes, subject vaults, and timetables.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333] text-xs font-bold text-[#525252] dark:text-[#D4D4D4] hover:bg-[#F5F5F5] min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="px-5 py-2.5 rounded-xl bg-[#F4C430] hover:bg-[#D4A017] text-xs font-black text-[#111111] shadow-sm min-h-[44px]"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal with Required Reason ── */}
      {showRejectModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-[#E5E5E5] dark:border-[#333] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-[#111111] dark:text-white">
                Reject Payment Proof
              </h3>
              <p className="text-xs text-[#737373] dark:text-[#A3A3A3] leading-relaxed">
                This will return <strong>{item.full_name}</strong> to <strong>Unpaid</strong> status. Please provide a clear reason so the student understands what to correct.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#111111] dark:text-white block">
                Rejection Reason (Required)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Blurry receipt image, partial transfer amount, incorrect TID, or wrong bank title..."
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectError) setRejectError(null);
                }}
                className="w-full text-xs p-3 rounded-xl border border-[#E5E5E5] dark:border-[#333] bg-[#FAFAFA] dark:bg-[#202020] text-[#111111] dark:text-white placeholder-[#A3A3A3] focus:outline-none focus:border-rose-500"
              />
              {rejectError && (
                <span className="text-[11px] text-rose-600 font-bold block">{rejectError}</span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setRejectError(null);
                }}
                disabled={isRejecting}
                className="px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333] text-xs font-bold text-[#525252] dark:text-[#D4D4D4] hover:bg-[#F5F5F5] min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isRejecting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black text-white shadow-sm min-h-[44px] flex items-center gap-1.5"
              >
                {isRejecting ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
