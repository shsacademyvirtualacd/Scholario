import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  Share2,
  Clipboard,
  ArrowRight,
  Check,
  ShieldAlert,
  GraduationCap,
  Award,
  UploadCloud,
  FileText,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Lock,
  Copy,
  RotateCcw,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StudentShell from '../../components/student/StudentShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  getFeeStatus,
  updateFeeStatus,
  getFeeAuditLogs,
  getEnrollmentsForStudent,
  resolveGradeFeeConfig,
} from '../../lib/db';
import { getBoardDef, formatGradeDisplay, BoardId } from '../../lib/taxonomy';
import { useMobile } from '../../hooks/useMobile';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import {
  getStudentScholarshipApplication,
  submitScholarshipApplication,
  uploadScholarshipProofFile,
  getScholarshipTiers,
  DEFAULT_SCHOLARSHIP_TIERS,
} from '../../lib/scholarshipService';
import { ScholarshipApplication, ScholarshipTier } from '../../types/scholarship';
import { getAcademicConfig } from '../../lib/academicConfig';
import { toast } from 'sonner';

export const StudentCheckoutPage: React.FC = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const config = useMemo(() => getAcademicConfig(), []);

  // ─── States ───
  const [loading, setLoading] = useState(true);
  const [feeConfig, setFeeConfig] = useState<any | null>(null);
  const [feeStatus, setFeeStatus] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [studentBoardId, setStudentBoardId] = useState<BoardId>(
    (profile?.board_id as any) || 'fbise'
  );
  const [studentGrade, setStudentGrade] = useState<string>('10');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Copy feedback states
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Stepper proof state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Activity accordion toggle
  const [activityOpen, setActivityOpen] = useState(false);

  // Scholarship States
  const [scholarshipApp, setScholarshipApp] = useState<ScholarshipApplication | null>(null);
  const [scholarshipTiers, setScholarshipTiers] = useState<ScholarshipTier[]>(DEFAULT_SCHOLARSHIP_TIERS);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyMarks, setApplyMarks] = useState('');
  const [isImprovement, setIsImprovement] = useState(false);
  const [applyProofFile, setApplyProofFile] = useState<File | null>(null);
  const [submittingScholarship, setSubmittingScholarship] = useState(false);

  // Fetch full tuition and authorization details
  const fetchFeeDetails = useCallback(async () => {
    if (!profile) return;
    try {
      setLoading(true);
      setError(null);

      let enrolls: any[] = [];
      try {
        enrolls = await getEnrollmentsForStudent(profile.id);
      } catch (e) {
        console.warn('Could not fetch student enrollments on checkout:', e);
      }

      let grade = '10';
      let boardId: BoardId = (profile.board_id as any) || 'fbise';

      if (enrolls && enrolls.length > 0) {
        const offering = enrolls[0].offering;
        if (offering && (offering.class?.grade || offering.grade)) {
          grade = offering.class?.grade || offering.grade;
        }
        if (offering?.class?.board_id || offering?.board_id || offering?.board) {
          boardId = offering.class?.board_id || offering.board_id || offering.board;
        }
      }

      let classId = profile.class_id;
      if (!classId && enrolls && enrolls.length > 0) {
        const offering = enrolls[0].offering;
        if (offering?.class_id) classId = offering.class_id;
        else if (offering?.class?.id) classId = offering.class.id;
      }

      setStudentBoardId(boardId);
      setStudentGrade(grade);

      const resolvedCfg = await resolveGradeFeeConfig(grade, classId, boardId, undefined, profile.id);
      const status = await getFeeStatus(profile.id);
      const logs = await getFeeAuditLogs(profile.id);

      setFeeConfig(resolvedCfg);
      setFeeStatus(status || { status: 'unpaid' });
      setAuditLogs(logs || []);

      try {
        const schApp = await getStudentScholarshipApplication(profile.id);
        setScholarshipApp(schApp);
        const tiers = await getScholarshipTiers();
        setScholarshipTiers(tiers);
      } catch (schErr) {
        console.warn('Could not load scholarship details:', schErr);
      }
    } catch (err: any) {
      console.error('fetchFeeDetails error:', err);
      setError(`Could not retrieve fee information: ${err?.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchFeeDetails();
  }, [fetchFeeDetails]);

  // Realtime updates
  useRealtimeTable({
    table: 'fee_statuses',
    onInsert: fetchFeeDetails,
    onUpdate: fetchFeeDetails,
    onDelete: fetchFeeDetails,
  });
  useRealtimeTable({
    table: 'scholarship_applications',
    onInsert: fetchFeeDetails,
    onUpdate: fetchFeeDetails,
    onDelete: fetchFeeDetails,
  });

  // Compress image if larger than 1MB
  const compressReceiptImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) return file;
    if (file.size < 1024 * 1024) return file;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1920;
          let width = img.width;
          let height = img.height;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              const compressed = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressed);
            },
            'image/jpeg',
            0.85
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  // Upload receipt with progress tracking
  const uploadReceiptWithProgress = (file: File, studentId: string): Promise<{ url: string; filename: string; file_type: string; uploaded_at: string }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('student_id', studentId);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/fees/receipt/upload');
      xhr.timeout = 45000;

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          const pct = Math.round((ev.loaded / ev.total) * 100);
          setUploadProgress(pct);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              url: data.url,
              filename: data.filename || file.name,
              file_type: data.file_type || file.type,
              uploaded_at: data.uploaded_at || new Date().toISOString(),
            });
          } catch {
            reject(new Error('Invalid response from server.'));
          }
        } else {
          let msg = 'Failed to upload receipt.';
          try {
            const parsed = JSON.parse(xhr.responseText);
            if (parsed.error) msg = parsed.error;
          } catch {}
          reject(new Error(msg));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during receipt upload.'));
      xhr.ontimeout = () => reject(new Error('Upload timed out after 45 seconds.'));
      xhr.send(formData);
    });
  };

  // Handle Receipt File Selection
  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type.toLowerCase())) {
      toast.error('Unsupported file format. Please upload PNG, JPG, or PDF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Receipt exceeds 5 MB limit. Please select a smaller file.');
      return;
    }

    try {
      const processed = file.type.startsWith('image/') ? await compressReceiptImage(file) : file;
      setReceiptFile(processed);

      if (processed.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result as string);
        };
        reader.readAsDataURL(processed);
      } else {
        setReceiptPreview(null);
      }
    } catch {
      setReceiptFile(file);
    }
  };

  // Copy Single Account Number
  const handleCopyNumber = (accNum: string, id: string) => {
    navigator.clipboard.writeText(accNum);
    setCopiedAccount(id);
    toast.success(`Copied ${accNum} to clipboard!`);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  // Copy Full Transfer Details
  const handleCopyAllDetails = () => {
    const text = config.paymentAccounts
      .map((acc) => `${acc.provider}:\nAccount Number: ${acc.accountNumber}\nAccount Title: ${acc.accountTitle}`)
      .join('\n\n') + `\n\nTuition Dues: PKR ${(feeConfig?.amount || 0).toLocaleString()} /${config.billingLabel}\nNote: Send exact amount and keep receipt.`;

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success('Complete payment details copied to clipboard!');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Submit Proof Action
  const handleMarkAsSent = async () => {
    if (!profile) return;
    try {
      setUpdating(true);
      setError(null);

      let uploadedReceiptData: { url: string; filename: string; file_type: string; uploaded_at: string } | null = null;
      if (receiptFile) {
        setUploadingReceipt(true);
        setUploadProgress(10);
        try {
          uploadedReceiptData = await uploadReceiptWithProgress(receiptFile, profile.id);
          setUploadProgress(100);
        } catch (uploadErr: any) {
          console.warn('[Checkout] In-app receipt upload warning:', uploadErr);
          toast.error(uploadErr?.message || 'Failed to upload receipt. Please check connection.');
          setUploadingReceipt(false);
          setUpdating(false);
          return;
        } finally {
          setUploadingReceipt(false);
        }
      }

      const boardDef = getBoardDef(studentBoardId);
      const activeSubs = (feeConfig?.subjects && feeConfig.subjects.length > 0) ? feeConfig.subjects : (profile.subjects || []);
      const isCustom = (feeConfig?.plan_type === 'custom' || studentBoardId === 'alevel' || studentBoardId === 'olevel') && activeSubs.length > 0;
      const subSummary = isCustom
        ? ` (${activeSubs.length} subjects)`
        : ' (All Subjects Package)';
      const planName = studentBoardId === 'ielts'
        ? 'IELTS Complete Preparation Program'
        : `${boardDef.name} Grade ${formatGradeDisplay(studentGrade, studentBoardId)}${subSummary}`;

      const receiptNote = uploadedReceiptData ? ` Receipt URL: ${uploadedReceiptData.url}` : '';
      const note = `Student submitted payment proof for PKR ${(feeConfig?.amount || 0).toLocaleString()} for ${planName}.${receiptNote}`;

      await updateFeeStatus(profile.id, 'pending', note, uploadedReceiptData ? {
        proof_url: uploadedReceiptData.url,
        proof_filename: uploadedReceiptData.filename,
        proof_file_type: uploadedReceiptData.file_type,
        proof_uploaded_at: uploadedReceiptData.uploaded_at,
      } : undefined);

      toast.success('Proof received! Our verification desk will review and authorize your account shortly.');
      await fetchFeeDetails();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit proof. Please try again.');
      toast.error(err?.message || 'Failed to submit proof.');
    } finally {
      setUpdating(false);
    }
  };

  // Resubmit Proof Action (for rejected status)
  const handleResubmitProof = async () => {
    if (!profile) return;
    try {
      setUpdating(true);
      await updateFeeStatus(profile.id, 'unpaid', 'Student initiated proof resubmission.');
      setReceiptFile(null);
      setReceiptPreview(null);
      toast.info('Status reset to Unpaid. Please upload your updated payment proof.');
      await fetchFeeDetails();
    } catch (err: any) {
      toast.error('Could not reset status. Please contact admin.');
    } finally {
      setUpdating(false);
    }
  };

  // Build WhatsApp Message Link
  const buildWhatsAppLink = () => {
    const cleanPhone = '9230586969050';
    const boardDef = getBoardDef(studentBoardId);
    const activeSubs = (feeConfig?.subjects && feeConfig.subjects.length > 0) ? feeConfig.subjects : (profile?.subjects || []);
    const isCustom = (feeConfig?.plan_type === 'custom' || studentBoardId === 'alevel' || studentBoardId === 'olevel') && activeSubs.length > 0;
    const subSummary = isCustom
      ? ` (${activeSubs.length} subjects: ${activeSubs.join(', ')})`
      : ' (All Subjects Package)';
    const className = studentBoardId === 'ielts'
      ? 'IELTS Complete Preparation Program'
      : `${boardDef.name} (Grade ${formatGradeDisplay(studentGrade, studentBoardId)})${subSummary}`;

    const schNote = feeConfig?.scholarship_status === 'verified' && feeConfig?.scholarship_discount_percentage
      ? ` (Scholarship Applied: ${feeConfig.scholarship_discount_percentage}% waiver)`
      : feeConfig?.scholarship_status === 'pending'
      ? ' (Scholarship: Pending Admin Verification)'
      : '';

    const message = `Hello, I am ${profile?.full_name || 'Student'}. I have sent the payment proof for my tuition fee (PKR ${(feeConfig?.amount || 0).toLocaleString()} /${config.billingLabel}${schNote}) for ${className}. Please verify and authorize my account.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Relative Time Helper
  const getRelativeTime = (dateString: string): string => {
    try {
      const ms = Date.now() - new Date(dateString).getTime();
      const secs = Math.floor(ms / 1000);
      if (secs < 60) return 'just now';
      const mins = Math.floor(secs / 60);
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}d ago`;
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Deduplicate consecutive identical audit logs in display only
  const deduplicatedLogs = useMemo(() => {
    if (!auditLogs || auditLogs.length === 0) return [];
    const result: any[] = [];
    for (let i = 0; i < auditLogs.length; i++) {
      const current = auditLogs[i];
      const prev = result[result.length - 1];
      if (prev && prev.status_to === current.status_to && prev.status_from === current.status_from) {
        continue;
      }
      result.push(current);
    }
    return result;
  }, [auditLogs]);

  const currentStatus = feeStatus?.status || 'unpaid';

  return (
    <StudentShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <SectionHeader
          title="Tuition Dues &amp; Checkout"
          description={`View your active session dues (${config.sessionLabel}), transfer details, and verification status. Access is gated until verification completes.`}
        />

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-[#E6A900]" />
            <span className="text-xs text-slate-500 font-medium">Loading checkout and tuition details...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ════════════ 1. STATE-DRIVEN STATUS CARD ════════════ */}
            {/* UNPAID STATE */}
            {currentStatus === 'unpaid' && (
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-900/60 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-900 dark:text-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert size={22} className="text-[#E6A900]" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-amber-950 dark:text-amber-100">
                        Status: Unpaid / Awaiting Payment Proof
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                        Action Required
                      </span>
                    </div>
                    <p className="text-xs text-amber-900/80 dark:text-amber-300/80 max-w-xl leading-relaxed">
                      Amount due: <strong>PKR {(feeConfig?.amount || 0).toLocaleString()}</strong> /{config.billingLabel}.
                      Dashboard access is currently restricted under our deny-by-default policy until payment verification is approved.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-white/80 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 flex items-center gap-1.5">
                    <Lock size={13} />
                    <span>Dashboard Locked</span>
                  </span>
                </div>
              </div>
            )}

            {/* PENDING VERIFICATION STATE */}
            {currentStatus === 'pending' && (
              <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={22} className="animate-spin text-blue-600" style={{ animationDuration: '8s' }} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-blue-950 dark:text-blue-100">
                        Status: Proof Received, Under Review
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 animate-pulse">
                        Pending Admin Verification
                      </span>
                    </div>
                    <p className="text-xs text-blue-900/80 dark:text-blue-300/80 max-w-xl leading-relaxed">
                      Thank you! Your payment proof is queued for administrative verification. Your account and live classroom timetable will unlock automatically as soon as verified.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <a
                    href={buildWhatsAppLink()}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-xs font-bold text-blue-800 dark:text-blue-300 hover:bg-blue-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Share2 size={13} />
                    <span>Message Verification Desk</span>
                  </a>
                </div>
              </div>
            )}

            {/* VERIFIED & PAID STATE */}
            {currentStatus === 'paid' && (
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-900 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={24} className="text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-emerald-950 dark:text-emerald-100">
                        Status: Authorized &amp; Verified
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                        Active Access
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900/80 dark:text-emerald-300/80 max-w-xl leading-relaxed">
                      Your tuition dues are cleared for this billing cycle. All course lecture archives, notes, tests, and timetable tools are unlocked.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/student')}
                  className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer min-h-[44px]"
                >
                  <GraduationCap size={16} />
                  <span>Enter Classroom Dashboard</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* REJECTED STATE or UNPAID with REJECTION REASON */}
            {(currentStatus === 'rejected' || (currentStatus === 'unpaid' && (feeStatus?.rejection_reason || auditLogs.some(l => l.notes?.toLowerCase().includes('rejected'))))) && (
              <div className="bg-red-50/80 dark:bg-red-950/40 border border-red-300 dark:border-red-900 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 flex items-center justify-center shrink-0 mt-0.5">
                    <X size={24} className="text-red-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-black text-red-950 dark:text-red-100">
                      Payment Verification Unsuccessful
                    </h3>
                    <p className="text-xs text-red-900/80 dark:text-red-300/80 max-w-xl leading-relaxed">
                      Reason: <strong>{feeStatus?.rejection_reason || auditLogs.find(l => l.notes?.toLowerCase().includes('rejected'))?.notes || 'Receipt invalid or amount mismatch'}</strong>. Please upload a clear receipt screenshot or valid PDF proof.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={updating}
                  onClick={handleResubmitProof}
                  className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <RotateCcw size={14} />
                  <span>Update Proof</span>
                </button>
              </div>
            )}

            {/* ════════════ 2-COLUMN MAIN LAYOUT ════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2 spans): Fee Card & Payment Accounts */}
              <div className="lg:col-span-2 space-y-6">
                {/* ─── 2. FEE DUES CARD ─── */}
                <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                    <div>
                      <h2 className="text-base font-black text-slate-900 dark:text-white">
                        Active Tuition Plan
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {studentBoardId === 'ielts'
                          ? 'IELTS Preparation Masterclass'
                          : `${getBoardDef(studentBoardId).name} • Grade ${formatGradeDisplay(studentGrade, studentBoardId)}`}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full self-start sm:self-auto">
                      Session {config.sessionLabel}
                    </span>
                  </div>

                  {/* Fee Numbers & Scholarship Line */}
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between py-1">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Payable Total ({config.billingLabel})
                      </span>
                      <div className="text-right">
                        <span className="text-3xl font-black text-slate-950 dark:text-white font-mono">
                          PKR {(feeConfig?.amount || 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 block">
                          /{config.billingLabel}
                        </span>
                      </div>
                    </div>

                    {/* Scholarship Line if verified or pending */}
                    {feeConfig?.scholarship_status === 'verified' && feeConfig?.scholarship_discount_percentage > 0 ? (
                      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Award size={16} className="text-emerald-600 shrink-0" />
                          <span className="font-bold text-emerald-900 dark:text-emerald-200">
                            Verified {feeConfig.scholarship_discount_percentage}% Merit Scholarship Applied
                          </span>
                        </div>
                        <span className="font-black text-emerald-800 dark:text-emerald-300">
                          Original: PKR {(feeConfig.original_amount || feeConfig.amount).toLocaleString()}
                        </span>
                      </div>
                    ) : feeConfig?.scholarship_status === 'pending' || scholarshipApp?.status === 'pending' ? (
                      <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-amber-600 shrink-0" />
                          <span className="font-bold text-amber-900 dark:text-amber-200">
                            Scholarship Review Pending ({scholarshipApp?.claimed_marks_percentage || '80+'}% Marks)
                          </span>
                        </div>
                        <span className="text-[11px] text-amber-700">Waiver applies upon verification</span>
                      </div>
                    ) : null}

                    {/* Included Subjects */}
                    {feeConfig?.subjects && feeConfig.subjects.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          Included Subjects ({feeConfig.subjects.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {feeConfig.subjects.map((sub: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── 3. PAYMENT ACCOUNTS (EASYPAISA & JAZZCASH FROM CONFIG) ─── */}
                <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 flex-wrap gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <CreditCard size={18} className="text-[#E6A900]" />
                      <span>Academy Payment Accounts</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleCopyAllDetails}
                      className="text-xs font-bold text-[#082B5C] dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedAll ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{copiedAll ? 'Copied All!' : 'Copy transfer details'}</span>
                    </button>
                  </div>

                  {/* Payment Account Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {config.paymentAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {acc.provider}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            {acc.badge || 'Wallet'}
                          </span>
                        </div>

                        <div>
                          <div className="text-[11px] text-slate-500">Account Number:</div>
                          <div className="text-base font-mono font-black text-slate-950 dark:text-white tracking-wide">
                            {acc.accountNumber}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            Title: <strong>{acc.accountTitle}</strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyNumber(acc.accountNumber, acc.id)}
                          className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
                        >
                          {copiedAccount === acc.id ? (
                            <>
                              <Check size={13} className="text-emerald-600" />
                              <span>Copied {acc.provider}!</span>
                            </>
                          ) : (
                            <>
                              <Clipboard size={13} />
                              <span>Copy Number</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Prominent Instruction Note */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                    💡 <strong>Important Note:</strong> Send the exact tuition amount (PKR {(feeConfig?.amount || 0).toLocaleString()}) and take a screenshot of your digital receipt to upload below.
                  </div>
                </div>
              </div>

              {/* Right Column (1 span): 3-Step Proof Flow & Audit Trail */}
              <div className="space-y-6">
                {/* ─── 4. PROOF FLOW AS A 3-STEP STEPPER ─── */}
                <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Verification Flow (3 Steps)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Submit proof for automatic account unlock.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Step 1 */}
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#082B5C] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          Pay via Easypaisa or JazzCash
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Transfer PKR {(feeConfig?.amount || 0).toLocaleString()} to either account.
                        </span>
                      </div>
                    </div>

                    {/* Step 2: Upload receipt */}
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#082B5C] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <div className="flex-1 space-y-2">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          Upload Receipt Screenshot
                        </span>
                        <label className="block p-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#E6A900] bg-slate-50/50 dark:bg-slate-900/50 text-center cursor-pointer transition-all">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleReceiptFileChange}
                            className="hidden"
                          />
                          <UploadCloud size={20} className="mx-auto text-slate-400 mb-1" />
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                            {receiptFile ? receiptFile.name : 'Choose receipt image'}
                          </span>
                          <span className="text-[9px] text-slate-400">PNG, JPG, or PDF (Max 5 MB)</span>
                        </label>

                        {/* Upload Progress Bar */}
                        {uploadingReceipt && (
                          <div className="space-y-1.5 py-1">
                            <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                              <span>Uploading & securing proof...</span>
                              <span className="font-mono text-[#E6A900]">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#E6A900] h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* PDF File Card */}
                        {receiptFile && receiptFile.type === 'application/pdf' && (
                          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <FileText size={18} className="text-red-500 shrink-0" />
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{receiptFile.name}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">({(receiptFile.size / 1024).toFixed(0)} KB)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setReceiptFile(null);
                                setReceiptPreview(null);
                              }}
                              className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                              title="Remove"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}

                        {/* Image Preview */}
                        {receiptPreview && (
                          <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-36">
                            <img
                              src={receiptPreview}
                              alt="Receipt Preview"
                              className="w-full h-auto object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setReceiptFile(null);
                                setReceiptPreview(null);
                              }}
                              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white"
                              title="Remove"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}

                        {/* WhatsApp alternate backup */}
                        <a
                          href={buildWhatsAppLink()}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 pt-1"
                        >
                          <Share2 size={11} />
                          <span>Alternate: Send proof directly on WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    {/* Step 3: Button State */}
                    <div className="flex items-start gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-[#082B5C] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <div className="flex-1 space-y-2">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          Confirm Submission
                        </span>
                        <button
                          type="button"
                          disabled={currentStatus === 'paid' || updating || uploadingReceipt}
                          onClick={handleMarkAsSent}
                          className={`w-full py-3 px-4 rounded-2xl text-xs font-black shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] ${
                            currentStatus === 'paid'
                              ? 'bg-emerald-600 text-white cursor-not-allowed'
                              : currentStatus === 'pending'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-[#E6A900] hover:bg-[#d49b00] text-slate-950'
                          }`}
                        >
                          {updating || uploadingReceipt ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Submitting Proof…</span>
                            </>
                          ) : currentStatus === 'paid' ? (
                            <>
                              <CheckCircle2 size={14} />
                              <span>Authorized &amp; Paid</span>
                            </>
                          ) : currentStatus === 'pending' ? (
                            <>
                              <Clock size={14} />
                              <span>Proof Received (Under Review)</span>
                            </>
                          ) : (
                            <>
                              <span>I've sent my proof</span>
                              <ArrowRight size={14} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── 5. AUDIT TRAIL / ACTIVITY ACCORDION ─── */}
                <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
                  <button
                    type="button"
                    onClick={() => setActivityOpen(!activityOpen)}
                    className="w-full flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <span>Status Activity Trail ({deduplicatedLogs.length})</span>
                    {activityOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  {activityOpen && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
                      {deduplicatedLogs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No activity recorded yet.</p>
                      ) : (
                        deduplicatedLogs.map((log) => (
                          <div
                            key={log.id}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white capitalize">
                                Status: {log.status_to}
                              </span>
                              <span
                                className="text-[10px] text-slate-400"
                                title={new Date(log.created_at).toLocaleString()}
                              >
                                {getRelativeTime(log.created_at)}
                              </span>
                            </div>
                            {log.notes && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                                {log.notes}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentShell>
  );
};

export default StudentCheckoutPage;
