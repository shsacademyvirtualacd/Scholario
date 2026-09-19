import React, { useState, useEffect } from 'react';
import { 
  CreditCard, AlertCircle, CheckCircle2, 
  Clock, Share2, Clipboard, ArrowRight, Check, ShieldAlert, GraduationCap,
  Award, UploadCloud, FileText, X, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StudentShell from '../../components/student/StudentShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { getFeeStatus, updateFeeStatus, getFeeAuditLogs, getEnrollmentsForStudent, resolveGradeFeeConfig } from '../../lib/db';
import { getBoardDef, formatGradeDisplay, BoardId } from '../../lib/taxonomy';
import { useMobile } from '../../hooks/useMobile';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import {
  getStudentScholarshipApplication,
  submitScholarshipApplication,
  uploadScholarshipProofFile,
  calculateDiscountForMarks,
  getScholarshipTiers,
  DEFAULT_SCHOLARSHIP_TIERS
} from '../../lib/scholarshipService';
import { ScholarshipApplication, ScholarshipTier } from '../../types/scholarship';
import { toast } from 'sonner';

export const StudentCheckoutPage: React.FC = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();
  
  // States
  const [loading, setLoading] = useState(true);
  const [feeConfig, setFeeConfig] = useState<any | null>(null);
  const [feeStatus, setFeeStatus] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [studentBoardId, setStudentBoardId] = useState<BoardId>((profile?.board_id as any) || 'fbise');
  const [studentGrade, setStudentGrade] = useState<string>('10');
  const [copiedText, setCopiedText] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scholarship States
  const [scholarshipApp, setScholarshipApp] = useState<ScholarshipApplication | null>(null);
  const [scholarshipTiers, setScholarshipTiers] = useState<ScholarshipTier[]>(DEFAULT_SCHOLARSHIP_TIERS);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyMarks, setApplyMarks] = useState('');
  const [applyProofFile, setApplyProofFile] = useState<File | null>(null);
  const [applyProofUrl, setApplyProofUrl] = useState('');
  const [submittingScholarship, setSubmittingScholarship] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [scholarshipError, setScholarshipError] = useState<string | null>(null);

  const fetchFeeDetails = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      setError(null);
      
      // Get student's enrolled classes to identify primary class grade & board
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

      if (profile.class_id && (!enrolls || enrolls.length === 0)) {
        const { data: clsData } = await (supabase as any)
          .from('classes')
          .select('grade, id, board_id')
          .eq('id', profile.class_id)
          .limit(1);
        if (clsData?.[0]?.grade) grade = clsData[0].grade;
        if (clsData?.[0]?.board_id) boardId = clsData[0].board_id;
      }

      // Look up exact class ID for this grade & board to read from fee_configs table
      let classId = profile.class_id;
      if (!classId && enrolls && enrolls.length > 0) {
        const offering = enrolls[0].offering;
        if (offering?.class_id) classId = offering.class_id;
        else if (offering?.class?.id) classId = offering.class.id;
      }
      if (!classId) {
        const { data: dbProf } = await (supabase as any)
          .from('profiles')
          .select('class_id, board_id')
          .eq('id', profile.id)
          .maybeSingle();
        if (dbProf?.class_id) classId = dbProf.class_id;
        if (dbProf?.board_id) boardId = dbProf.board_id;
      }
      if (!classId) {
        const { data: clsData } = await (supabase as any)
          .from('classes')
          .select('id, board_id')
          .eq('board_id', boardId)
          .eq('grade', grade)
          .limit(1);
        if (clsData?.[0]?.id) classId = clsData[0].id;
      }

      setStudentBoardId(boardId);
      setStudentGrade(grade);

      // Read live fee configuration via centralized resolution helper with student ID context
      const resolvedCfg = await resolveGradeFeeConfig(grade, classId, boardId, undefined, profile.id);
      const status = await getFeeStatus(profile.id);
      const logs = await getFeeAuditLogs(profile.id);

      setFeeConfig(resolvedCfg);
      setFeeStatus(status || { status: 'unpaid' });
      setAuditLogs(logs || []);

      // Load student's scholarship application and tiers
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
      setError(`Could not retrieve fee information: ${err?.message || err?.details || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeDetails();
  }, [profile]);

  useRealtimeTable({
    table: 'fee_configs',
    onInsert: fetchFeeDetails,
    onUpdate: fetchFeeDetails,
    onDelete: fetchFeeDetails,
  });

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

  const handleCopyInstructions = () => {
    if (feeConfig?.payment_instructions) {
      navigator.clipboard.writeText(feeConfig.payment_instructions);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handleMarkAsSent = async () => {
    if (!profile) return;
    try {
      setUpdating(true);
      const boardDef = getBoardDef(studentBoardId);
      const activeSubs = (feeConfig?.subjects && feeConfig.subjects.length > 0) ? feeConfig.subjects : (profile.subjects || []);
      const isCustom = (feeConfig?.plan_type === 'custom' || studentBoardId === 'alevel' || studentBoardId === 'olevel') && activeSubs.length > 0;
      const subSummary = isCustom 
        ? ` (${activeSubs.length} subjects: ${activeSubs.join(', ')})`
        : ' (All Subjects Package)';
      const planName = studentBoardId === 'ielts'
        ? 'IELTS Complete Preparation Program'
        : `${boardDef.name} Grade ${formatGradeDisplay(studentGrade, studentBoardId)}${subSummary}`;
      const note = `Student submitted payment proof for PKR ${(feeConfig?.amount || 0).toLocaleString()} for ${planName}.`;
      await updateFeeStatus(profile.id, 'pending', note);
      await fetchFeeDetails();
    } catch (err: any) {
      setError(err.message || 'Failed to update fee status.');
    } finally {
      setUpdating(false);
    }
  };

  // Build WhatsApp Message Link
  const buildWhatsAppLink = () => {
    if (!feeConfig) return '#';
    let cleanPhone = feeConfig.whatsapp_number.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('03')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('3') && cleanPhone.length === 9) {
      cleanPhone = '92' + cleanPhone;
    }
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
    const message = `Hello, I am ${profile?.full_name || 'Student'}. I have sent the payment proof for my class fee (PKR ${feeConfig.amount.toLocaleString()}${schNote}) for ${className}. Please verify and authorize my account.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const getStatusBadge = () => {
    const status = feeStatus?.status || 'unpaid';
    switch (status) {
      case 'paid':
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-[#16a34a] bg-[#F0FDF4] border border-[#bbf7d0] px-3 py-1 rounded-full whitespace-nowrap shrink-0 self-start sm:self-auto">
            <CheckCircle2 size={14} />
            Authorized / Verified
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#d97706] bg-[#FFFBEB] border border-[#fef3c7] px-3 py-1 rounded-full animate-pulse whitespace-nowrap shrink-0 self-start sm:self-auto">
            <Clock size={14} />
            Pending Verification / Awaiting Authorization
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-[#dc2626] bg-[#FEF2F2] border border-[#fecaca] px-3 py-1 rounded-full whitespace-nowrap shrink-0 self-start sm:self-auto">
            <ShieldAlert size={14} />
            Registered but Unauthorized
          </span>
        );
    }
  };

  return (
    <StudentShell>
      <div className="space-y-6">
        <SectionHeader
          title="Tuition Dues & Checkout"
          description="View your active term fee, transfer instructions, and authorization status. Access is gated until verification completes."
        />

        {error && (
          <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#fecaca] text-sm text-[#dc2626] flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="card py-16 flex flex-col items-center justify-center gap-3 interactive">
            <div className="w-8 h-8 rounded-full border-2 border-[#E5E5E5] border-t-[#F4C430] animate-spin" />
            <span className="text-xs text-[#737373] font-medium">Loading checkout and fee details...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Banner */}
            {feeStatus?.status === 'pending' && (
              <div className={`bg-[#FFFBF0] border border-[#FDE68A] rounded-2xl p-6 flex ${isMobile ? 'flex-col items-start' : 'flex-row items-center'} justify-between gap-4 shadow-sm`}>
                <div className={`flex ${isMobile ? 'items-start' : 'items-center'} gap-4`}>
                  <div className="w-12 h-12 rounded-2xl bg-[#F4C430]/20 flex items-center justify-center text-[#92700A] shrink-0 mt-0.5 sm:mt-0">
                    <Clock size={24} className="animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-[#111111] tracking-tight">
                      Account Status: Pending Verification / Awaiting Authorization
                    </h3>
                    <p className="text-xs text-[#737373] max-w-xl leading-relaxed">
                      Thank you for submitting your proof! Your account is currently under review by our administration team. Once your receipt is verified, your status will update and full classroom dashboard access will unlock automatically.
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <a
                    href={buildWhatsAppLink()}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost text-xs border border-[#FDE68A] bg-white px-3.5 py-2 font-bold text-[#92700A] hover:bg-[#FFFBF0] flex items-center gap-1.5 interactive"
                  >
                    <Share2 size={13} />
                    Message Admin
                  </a>
                </div>
              </div>
            )}

            {feeStatus?.status === 'paid' && (
              <div className={`bg-[#F0FDF4] border border-[#bbf7d0] rounded-2xl p-6 flex ${isMobile ? 'flex-col items-start' : 'flex-row items-center'} justify-between gap-4 shadow-sm`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-700 shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#111111] tracking-tight">
                      Account Authorized & Verified
                    </h3>
                    <p className="text-xs text-[#737373] leading-relaxed">
                      Your tuition dues are fully cleared and your student access is active.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/student')}
                  className="btn bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm interactive"
                >
                  <GraduationCap size={15} />
                  Enter Classroom Dashboard
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            <div className={isMobile ? 'flex flex-col gap-6' : 'grid grid-cols-3 gap-6'}>
              {/* Left: Invoice & Instructions */}
              <div className={isMobile ? '' : 'col-span-2 space-y-6'}>
                {/* Fee Dues Summary */}
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F5F5F5] pb-4">
                    <div>
                      <h2 className="text-base font-extrabold text-[#111111] tracking-tight">Tuition Fee Package</h2>
                      <p className="text-xs text-[#737373] mt-0.5">
                        {studentBoardId === 'ielts'
                          ? 'IELTS Complete Preparation Program'
                          : ((feeConfig?.plan_type === 'custom' || studentBoardId === 'alevel' || studentBoardId === 'olevel') && feeConfig?.subjects && feeConfig.subjects.length > 0
                              ? `${getBoardDef(studentBoardId).name} • Grade ${formatGradeDisplay(studentGrade, studentBoardId)} (${feeConfig.subjects.length} Active ${feeConfig.subjects.length === 1 ? 'Subject' : 'Subjects'})` 
                              : `${getBoardDef(studentBoardId).name} Academic Program (Grade ${formatGradeDisplay(studentGrade, studentBoardId)}) • All Subjects Package`)}
                      </p>
                    </div>
                    {getStatusBadge()}
                  </div>

                  <div className="flex items-baseline justify-between py-2">
                    <span className="text-sm text-[#737373] font-medium">Total Fee Amount</span>
                    <div className="text-right">
                      {feeConfig?.amount && feeConfig.amount > 0 ? (
                        <>
                          {feeConfig?.scholarship_status === 'verified' && feeConfig?.scholarship_discount_percentage > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-[#737373] line-through font-mono">
                                  PKR {(feeConfig.original_amount || feeConfig.amount).toLocaleString()}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                                  <Award size={12} />
                                  Scholarship Applied: {feeConfig.scholarship_discount_percentage}%
                                </span>
                              </div>
                              <span className="text-3xl font-black text-emerald-800 tracking-tight font-mono block">
                                PKR {feeConfig.amount.toLocaleString()}
                              </span>
                              <span className="text-xs text-emerald-700 font-semibold block">
                                You save PKR {((feeConfig.original_amount || feeConfig.amount) - feeConfig.amount).toLocaleString()} via verified merit scholarship
                              </span>
                            </div>
                          ) : (
                            <>
                              <span className="text-3xl font-black text-[#111111] tracking-tight font-mono">
                                PKR {feeConfig.amount.toLocaleString()}
                              </span>
                              <span className="text-xs text-[#737373] font-semibold block mt-1">
                                {studentBoardId === 'alevel' || studentBoardId === 'olevel'
                                  ? `Cambridge ${studentBoardId === 'alevel' ? 'A Levels' : 'O Levels'} Per-Subject Enrollment${
                                      feeConfig?.subjects?.length && feeConfig.subjects.length >= 2
                                        ? ` (${feeConfig.subjects.length} subjects • 5% discount applied)`
                                        : feeConfig?.subjects?.length === 1
                                        ? ' (1 subject • full price)'
                                        : ''
                                    }`
                                  : feeConfig?.plan_type === 'custom'
                                  ? `Subject Enrollment Package (${feeConfig.subjects?.length || 'Selected'} subjects)`
                                  : 'Full Term Access Package'}
                              </span>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-right">
                          <span className="text-sm font-black text-amber-900 block">
                            Price not yet set — contact admin
                          </span>
                          <span className="text-[10px] text-amber-800 font-semibold block mt-0.5">
                            Tuition dues for your selected class have not been finalized yet.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scholarship Status Banners & Actions */}
                  {feeConfig?.scholarship_status === 'pending' || scholarshipApp?.status === 'pending' ? (
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-3">
                      <Clock size={16} className="text-amber-700 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold block text-amber-950">
                          Merit Scholarship Application Pending Verification ({scholarshipApp?.claimed_marks_percentage || '80+'}% Marks)
                        </span>
                        <p className="text-[11px] text-amber-800">
                          Your marksheet proof has been submitted to the administration. Once verified, a {scholarshipApp?.claimed_marks_percentage && scholarshipApp.claimed_marks_percentage >= 90 ? '60%' : '40%'} fee waiver will automatically update your payable amount. You can pay now for instant access or await review.
                        </p>
                      </div>
                    </div>
                  ) : !scholarshipApp && feeStatus?.status !== 'paid' ? (
                    <div className="p-3.5 rounded-xl bg-[#FFFDF5] border border-[#FDE68A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-[#D4A017] shrink-0">
                          <Award size={18} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#111111] block">
                            Scored 80%+ Marks or A/A* Grades in Previous Exams?
                          </span>
                          <span className="text-[11px] text-[#737373] block">
                            Apply for a 40% or 60% merit tuition scholarship across all boards & classes.
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowApplyModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-[#D4A017] hover:bg-[#b8890e] text-white text-xs font-bold shrink-0 transition-colors shadow-sm self-start sm:self-auto"
                      >
                        Apply for Scholarship
                      </button>
                    </div>
                  ) : null}

                  {feeConfig?.subjects && feeConfig.subjects.length > 0 && (
                    <div className="pt-3 border-t border-[#F5F5F5] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#111111]">
                          Enrolled Active Subjects ({feeConfig.subjects.length}):
                        </span>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                          {feeConfig.plan_type === 'custom' || studentBoardId === 'alevel' || studentBoardId === 'olevel' ? 'Custom Subject Plan' : 'Standard Stream'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {feeConfig.subjects.map((sub: string, idx: number) => (
                          <span key={idx} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] text-[#262626]">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {feeStatus?.status !== 'paid' && (
                    <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-xs text-[#525252] leading-relaxed flex items-start gap-2.5">
                      <AlertCircle size={15} className="text-[#F4C430] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-[#111111]">Deny-by-Default Security:</strong> As per security guidelines, access to course materials, schedule, and live lectures remains restricted until payment verification is marked authorized by an administrator.
                      </span>
                    </div>
                  )}
                </div>

                {/* Bank Instructions */}
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[#111111] flex items-center gap-2">
                      <CreditCard size={16} className="text-[#F4C430]" />
                      Payment Accounts (Easypaisa & JazzCash)
                    </h3>
                    <button
                      onClick={handleCopyInstructions}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#737373] border border-[#E5E5E5] hover:bg-[#FAFAFA] px-2.5 py-1.5 rounded-lg transition-colors interactive"
                    >
                      {copiedText ? <Check size={12} className="text-emerald-600" /> : <Clipboard size={12} />}
                      {copiedText ? 'Copied to Clipboard' : 'Copy Transfer Details'}
                    </button>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-[#F0F0F0] font-mono text-xs text-[#262626] whitespace-pre-line leading-relaxed shadow-inner">
                    {feeConfig?.payment_instructions}
                  </div>
                </div>
              </div>

              {/* Right: Checkout Actions & Trail */}
              <div className="space-y-6">
                {/* Payment Proof Actions */}
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 space-y-5">
                  <h3 className="text-sm font-extrabold text-[#111111] tracking-tight border-b border-[#F5F5F5] pb-3 flex items-center justify-between">
                    <span>Proof Verification</span>
                    <span className="text-[10px] font-bold text-[#A3A3A3] uppercase">2-Step Process</span>
                  </h3>

                  <div className="space-y-3">
                    <p className="text-xs text-[#737373] leading-relaxed font-medium">
                      <strong className="text-[#111111]">Step 1:</strong> Send your receipt or screenshot directly via WhatsApp to our verification desk.
                    </p>

                    <a
                      href={buildWhatsAppLink()}
                      target="_blank"
                      rel="noreferrer"
                      className="btn bg-[#25D366] hover:bg-[#20ba5a] text-white w-full flex items-center justify-center gap-2 py-3 font-bold rounded-xl transition-all shadow-sm hover:shadow text-xs interactive"
                    >
                      <Share2 size={16} />
                      Open WhatsApp & Send Proof
                    </a>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-[#F5F5F5]">
                    <p className="text-xs text-[#737373] leading-relaxed font-medium">
                      <strong className="text-[#111111]">Step 2:</strong> Once sent, click below so our administration knows your proof is awaiting authorization.
                    </p>

                    <button
                      disabled={feeStatus?.status !== 'unpaid' || updating}
                      onClick={handleMarkAsSent}
                      className={`btn w-full flex items-center justify-center gap-2 py-3.5 font-extrabold rounded-xl transition-all text-xs shadow-sm ${
                        feeStatus?.status === 'unpaid'
                          ? 'btn-gold hover:scale-[1.01]'
                          : 'bg-zinc-100 text-zinc-500 cursor-not-allowed border border-zinc-200'
                      }`}
                    >
                      {updating ? (
                        <div className="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin" />
                      ) : feeStatus?.status === 'unpaid' ? (
                        <>
                          <span>I have sent my proof of payment</span>
                          <ArrowRight size={14} />
                        </>
                      ) : feeStatus?.status === 'pending' ? (
                        <span>Proof Sent · Awaiting Authorization</span>
                      ) : (
                        <span>Authorized & Verified</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Audit Logs */}
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                    Status Audit Trail
                  </h3>

                  {auditLogs.length === 0 ? (
                    <p className="text-xs text-[#A3A3A3] italic py-2">No history records found.</p>
                  ) : (
                    <div className="space-y-3.5 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#F5F5F5]">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="flex gap-3 relative">
                          <div className={`w-6 h-6 rounded-full shrink-0 border flex items-center justify-center text-[10px] bg-white ${
                            log.status_to === 'paid' 
                              ? 'border-emerald-200 text-[#16a34a]' 
                              : 'border-amber-200 text-[#d97706]'
                          }`}>
                            {log.status_to === 'paid' ? '✓' : '!'}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-[#111111] leading-tight">
                              Moved to {log.status_to.toUpperCase()}
                            </p>
                            <p className="text-[10px] text-[#A3A3A3]">
                              {new Date(log.changed_at).toLocaleDateString()} at {new Date(log.changed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                            {log.notes && (
                              <p className="text-[10px] text-[#737373] mt-1 bg-[#FAFAFA] p-1.5 rounded border border-[#F0F0F0] leading-normal font-sans">
                                {log.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Apply for Scholarship Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-[#E5E5E5] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-[#D4A017]">
                    <Award size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#111111]">
                      Merit Scholarship Application
                    </h3>
                    <p className="text-xs text-[#737373]">
                      Available for all classes (9, 10, 11, 12) & boards
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="p-1 rounded-lg text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Marks percentage input */}
                <div>
                  <label className="block text-xs font-bold text-[#404040] mb-1">
                    Previous Marks / Percentage (%) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="e.g. 88.5 or 92"
                      value={applyMarks}
                      onChange={(e) => {
                        setApplyMarks(e.target.value);
                        setScholarshipError(null);
                      }}
                      className="w-full bg-white border border-[#D4D4D4] focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#111111] placeholder:text-[#A3A3A3] outline-none"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-extrabold text-[#737373]">
                      %
                    </span>
                  </div>
                  <p className="text-[10px] text-[#737373] mt-1">
                    O/A Levels: A = 80%+ equivalent (40% off), A* = 90%+ equivalent (60% off).
                  </p>
                </div>

                {/* Tier calculation preview */}
                {(() => {
                  const marks = parseFloat(applyMarks);
                  const calc = calculateDiscountForMarks(marks, studentBoardId, scholarshipTiers);
                  if (isNaN(marks)) return null;
                  if (calc.eligible) {
                    return (
                      <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs text-emerald-900 flex items-center gap-2.5 font-bold">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        <div>
                          <span className="block text-emerald-800 font-extrabold">
                            {calc.discountPercentage}% Scholarship Eligible!
                          </span>
                          <span className="text-[10px] text-emerald-700 font-normal">
                            Tuition will reduce from PKR {feeConfig?.amount?.toLocaleString()} to PKR {Math.round((feeConfig?.amount || 0) * (1 - calc.discountPercentage / 100)).toLocaleString()} upon verification.
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center gap-2 font-medium">
                      <AlertCircle size={16} className="text-amber-700 shrink-0" />
                      <span>Merit scholarships require at least 80% marks.</span>
                    </div>
                  );
                })()}

                {/* Proof file upload */}
                <div>
                  <label className="block text-xs font-bold text-[#404040] mb-1">
                    Upload Marksheet / Result Card Proof <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-[#D4D4D4] hover:border-[#D4A017] bg-[#FAFAFA] rounded-xl p-4 text-center transition-colors">
                    <input
                      type="file"
                      id="checkout-proof-file"
                      accept=".pdf,image/png,image/jpeg,image/jpg"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setApplyProofFile(file);
                        setScholarshipError(null);
                        setUploadingProof(true);
                        try {
                          const res = await uploadScholarshipProofFile(file);
                          setApplyProofUrl(res.url);
                          toast.success(`Proof file uploaded: ${file.name}`);
                        } catch (upErr: any) {
                          console.warn('Upload error:', upErr);
                        } finally {
                          setUploadingProof(false);
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="checkout-proof-file" className="cursor-pointer flex flex-col items-center justify-center gap-1.5">
                      {uploadingProof ? (
                        <Loader2 size={24} className="animate-spin text-[#D4A017]" />
                      ) : applyProofFile || applyProofUrl ? (
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                          <FileText size={15} />
                          <span className="truncate max-w-[220px]">{applyProofFile?.name || 'Document Ready'}</span>
                          <CheckCircle2 size={14} className="text-emerald-600" />
                        </div>
                      ) : (
                        <>
                          <UploadCloud size={24} className="text-[#A3A3A3]" />
                          <span className="text-xs font-bold text-[#111111]">
                            Click or drag & drop Result Card
                          </span>
                          <span className="text-[10px] text-[#737373]">
                            PDF, PNG, JPG (Board mark sheet, official transcript)
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {scholarshipError && (
                  <p className="text-xs text-red-600 font-medium">{scholarshipError}</p>
                )}

                <div className="bg-[#FFFDF7] border border-[#F0EAD6] rounded-xl p-3 text-[11px] text-[#525252] leading-relaxed flex items-start gap-2">
                  <ShieldAlert size={14} className="text-[#D4A017] shrink-0 mt-0.5" />
                  <span>
                    Applications are subject to administrator verification. Upon review, your fee invoice will automatically update with the verified discount.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F5F5F5]">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#737373] hover:text-[#111111] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingScholarship || uploadingProof}
                  onClick={async () => {
                    const marks = parseFloat(applyMarks);
                    if (isNaN(marks) || marks < 0 || marks > 100) {
                      setScholarshipError('Please enter a valid marks percentage between 0 and 100.');
                      return;
                    }
                    if (marks < 80) {
                      setScholarshipError('Merit scholarships require at least 80% marks.');
                      return;
                    }
                    if (!applyProofFile && !applyProofUrl) {
                      setScholarshipError('Please upload your marksheet proof document.');
                      return;
                    }

                    try {
                      setSubmittingScholarship(true);
                      setScholarshipError(null);

                      let finalUrl = applyProofUrl;
                      if (!finalUrl && applyProofFile) {
                        const upRes = await uploadScholarshipProofFile(applyProofFile);
                        finalUrl = upRes.url;
                      }

                      if (!finalUrl) throw new Error('Proof document upload failed.');

                      await submitScholarshipApplication({
                        student_id: profile!.id,
                        applicant_name: profile!.full_name || 'Student',
                        applicant_email: (profile as any)?.email || user?.email || '',
                        board: studentBoardId,
                        class_grade: studentGrade,
                        claimed_marks_percentage: marks,
                        proof_document_url: finalUrl,
                      });

                      toast.success('Scholarship application submitted for admin verification!');
                      setShowApplyModal(false);
                      await fetchFeeDetails();
                    } catch (err: any) {
                      setScholarshipError(err.message || 'Submission failed.');
                    } finally {
                      setSubmittingScholarship(false);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#D4A017] hover:bg-[#b8890e] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
                >
                  {submittingScholarship ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Award size={14} />
                  )}
                  <span>Submit for Verification</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentShell>
  );
};

export default StudentCheckoutPage;
