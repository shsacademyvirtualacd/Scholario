import React, { useState, useEffect } from 'react';
import { 
  CreditCard, AlertCircle, CheckCircle2, 
  Clock, Share2, Clipboard, ArrowRight, Check, ShieldAlert, GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StudentShell from '../../components/student/StudentShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { getFeeStatus, updateFeeStatus, getFeeAuditLogs, getEnrollmentsForStudent, resolveGradeFeeConfig } from '../../lib/db';
import { BOARD } from '../../lib/taxonomy';
import { useMobile } from '../../hooks/useMobile';

export const StudentCheckoutPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();
  
  // States
  const [loading, setLoading] = useState(true);
  const [feeConfig, setFeeConfig] = useState<any | null>(null);
  const [feeStatus, setFeeStatus] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [studentClass, setStudentClass] = useState<any | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeeDetails = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      setError(null);
      
      // Get student's enrolled classes to identify primary class grade
      let enrolls: any[] = [];
      try {
        enrolls = await getEnrollmentsForStudent(profile.id);
      } catch (e) {
        console.warn('Could not fetch student enrollments on checkout:', e);
      }

      let grade = '10';
      if (enrolls && enrolls.length > 0) {
        const offering = enrolls[0].offering;
        setStudentClass(offering);
        if (offering && (offering.class?.grade || offering.grade)) {
          grade = offering.class?.grade || offering.grade;
        }
      }

      if (profile.class_id && (!enrolls || enrolls.length === 0)) {
        const { data: clsData } = await (supabase as any)
          .from('classes')
          .select('grade, id')
          .eq('id', profile.class_id)
          .limit(1);
        if (clsData?.[0]?.grade) grade = clsData[0].grade;
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
          .select('class_id')
          .eq('id', profile.id)
          .maybeSingle();
        if (dbProf?.class_id) classId = dbProf.class_id;
      }
      if (!classId) {
        const { data: clsData } = await (supabase as any)
          .from('classes')
          .select('id')
          .eq('board_id', BOARD.id)
          .eq('grade', grade)
          .limit(1);
        if (clsData?.[0]?.id) classId = clsData[0].id;
      }

      // Read live fee configuration via centralized resolution helper
      const resolvedCfg = await resolveGradeFeeConfig(grade, classId);
      const status = await getFeeStatus(profile.id);
      const logs = await getFeeAuditLogs(profile.id);

      setFeeConfig(resolvedCfg);
      setFeeStatus(status || { status: 'unpaid' });
      setAuditLogs(logs || []);
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
      await updateFeeStatus(profile.id, 'pending', 'Student clicked "I have sent my proof of payment" button.');
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
    const className = studentClass ? `${studentClass.subject_name || studentClass.subject || 'FBISE'} (Grade ${studentClass.grade || '10'})` : 'FBISE Program';
    const message = `Hello, I am ${profile?.full_name || 'Student'}. I have sent the payment proof for my class fee (PKR ${feeConfig.amount.toLocaleString()}) for ${className}. Please verify and authorize my account.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const getStatusBadge = () => {
    const status = feeStatus?.status || 'unpaid';
    switch (status) {
      case 'paid':
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-[#16a34a] bg-[#F0FDF4] border border-[#bbf7d0] px-3 py-1 rounded-full">
            <CheckCircle2 size={14} />
            Authorized / Verified
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#d97706] bg-[#FFFBEB] border border-[#fef3c7] px-3 py-1 rounded-full animate-pulse">
            <Clock size={14} />
            Pending Verification / Awaiting Authorization
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-[#dc2626] bg-[#FEF2F2] border border-[#fecaca] px-3 py-1 rounded-full">
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
                  <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-4">
                    <div>
                      <h2 className="text-base font-extrabold text-[#111111] tracking-tight">Tuition Fee Package</h2>
                      <p className="text-xs text-[#737373] mt-0.5">
                        {studentClass ? `${studentClass.subject_name || studentClass.subject || 'FBISE Program'} (Grade ${studentClass.grade})` : 'FBISE Academic Program'}
                      </p>
                    </div>
                    {getStatusBadge()}
                  </div>

                  <div className="flex items-baseline justify-between py-2">
                    <span className="text-sm text-[#737373] font-medium">Total Fee Amount</span>
                    <div className="text-right">
                      {feeConfig?.amount && feeConfig.amount > 0 ? (
                        <>
                          <span className="text-3xl font-black text-[#111111] tracking-tight font-mono">
                            PKR {feeConfig.amount.toLocaleString()}
                          </span>
                          <span className="text-xs text-[#737373] font-semibold block mt-1">Full Term Access Package</span>
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
      </div>
    </StudentShell>
  );
};

export default StudentCheckoutPage;
