import React, { useState, useEffect } from 'react';
import { 
  CreditCard, AlertCircle, CheckCircle2, 
  Clock, Share2, Clipboard, ArrowRight, Check
} from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { useAuth } from '../../features/auth/AuthContext';
import { getFeeConfig, getFeeStatus, updateFeeStatus, getFeeAuditLogs, getEnrollmentsForStudent } from '../../lib/db';

export const StudentCheckoutPage: React.FC = () => {
  const { profile } = useAuth();
  
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
      
      // Get student's enrolled classes to identify primary class ID
      const enrolls = await getEnrollmentsForStudent(profile.id);
      let classId = 'o1'; // fallback class offering ID
      if (enrolls && enrolls.length > 0) {
        setStudentClass(enrolls[0].offering);
        if (enrolls[0].offering_id) {
          classId = enrolls[0].offering_id;
        }
      }

      // Fetch config & status
      const config = await getFeeConfig(classId);
      const status = await getFeeStatus(profile.id);
      const logs = await getFeeAuditLogs(profile.id);

      setFeeConfig(config || {
        class_id: classId,
        amount: 4500, // fallback defaults
        payment_instructions: 'Bank Alfalah\nAccount Title: SHS Academy\nAccount No: 5502-1928-3746\n\nJazzCash / Easypaisa:\nNumber: 0300-1234567\nName: Ahmad Khan',
        whatsapp_number: '+923001234567'
      });
      setFeeStatus(status || { status: 'unpaid' });
      setAuditLogs(logs);
    } catch (err: any) {
      console.error(err);
      setError('Could not retrieve fee information. Please try again.');
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
      await updateFeeStatus(profile.id, 'pending', 'Student clicked "I\'ve sent my payment proof" button.');
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
    const cleanPhone = feeConfig.whatsapp_number.replace(/[^0-9+]/g, '');
    const className = studentClass ? `${studentClass.subject} (${studentClass.grade})` : 'Class';
    const message = `Hello, I am ${profile?.full_name || 'Student'}. I have sent the payment proof for my class fee (PKR ${feeConfig.amount.toLocaleString()}) for ${className}. Please verify it.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const getStatusBadge = () => {
    const status = feeStatus?.status || 'unpaid';
    switch (status) {
      case 'paid':
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-[#16a34a] bg-[#F0FDF4] border border-[#bbf7d0] px-2.5 py-1 rounded-full">
            <CheckCircle2 size={13} />
            Paid & Verified
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-[#d97706] bg-[#FFFBEB] border border-[#fef3c7] px-2.5 py-1 rounded-full animate-pulse">
            <Clock size={13} />
            Pending Verification
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-[#dc2626] bg-[#FEF2F2] border border-[#fecaca] px-2.5 py-1 rounded-full">
            <AlertCircle size={13} />
            Unpaid
          </span>
        );
    }
  };

  return (
    <StudentShell>
      <div className="space-y-6">
        <SectionHeader
          title="Tuition Dues & Checkout"
          description="View your active term fee, retrieve payment instructions, submit proof via WhatsApp, and check verification status."
        />

        {error && (
          <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#fecaca] text-sm text-[#dc2626] flex items-center gap-2">
            <AlertCircle size={16} />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="card py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#E5E5E5] border-t-[#F4C430] animate-spin" />
            <span className="text-xs text-[#737373] font-medium">Loading details...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Invoice & Instructions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Fee Dues Summary */}
              <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-[#111111] tracking-tight">Fee Summary</h2>
                    <p className="text-xs text-[#737373] mt-0.5">
                      Class assignment: {studentClass ? `${studentClass.subject} (${studentClass.grade})` : 'Class offering'}
                    </p>
                  </div>
                  {getStatusBadge()}
                </div>

                <div className="flex items-baseline justify-between py-2">
                  <span className="text-sm text-[#737373] font-medium">Total Term Fee Due</span>
                  <div className="text-right">
                    <span className="text-3xl font-black text-[#111111] tracking-tight font-mono">
                      PKR {feeConfig?.amount?.toLocaleString() || '0'}
                    </span>
                    <span className="text-xs text-[#737373] font-semibold block mt-1">Single installment</span>
                  </div>
                </div>

                {feeStatus?.status === 'unpaid' && (
                  <div className="p-3.5 rounded-xl bg-red-50/50 border border-red-100 text-xs text-[#991b1b] leading-relaxed flex gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>
                      Please note: Direct payment processing is not supported. Follow the transfer instructions below and send your receipt screenshot.
                    </span>
                  </div>
                )}
              </div>

              {/* Bank Instructions */}
              <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[#111111] flex items-center gap-2">
                    <CreditCard size={16} className="text-[#F4C430]" />
                    Transfer Instructions
                  </h3>
                  <button
                    onClick={handleCopyInstructions}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#737373] border border-[#E5E5E5] hover:bg-[#FAFAFA] px-2 py-1 rounded-lg transition-colors"
                  >
                    {copiedText ? <Check size={11} className="text-emerald-600" /> : <Clipboard size={11} />}
                    {copiedText ? 'Copied' : 'Copy details'}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0] font-mono text-xs text-[#262626] whitespace-pre-line leading-relaxed">
                  {feeConfig?.payment_instructions}
                </div>
              </div>
            </div>

            {/* Right: Checkout Actions & Trail */}
            <div className="space-y-6">
              {/* Payment Proof Actions */}
              <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 space-y-5">
                <h3 className="text-sm font-extrabold text-[#111111] tracking-tight border-b border-[#F5F5F5] pb-3">
                  Submit Payment Proof
                </h3>

                <p className="text-xs text-[#737373] leading-relaxed">
                  1. Send the transaction receipt/screenshot to our verified WhatsApp line.
                </p>

                <a
                  href={buildWhatsAppLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="btn bg-[#25D366] hover:bg-[#20ba5a] text-white w-full flex items-center justify-center gap-2 py-2.5 font-bold rounded-xl transition-all shadow-sm hover:shadow"
                >
                  <Share2 size={15} />
                  Send Proof via WhatsApp
                </a>

                <p className="text-xs text-[#737373] leading-relaxed">
                  2. Once sent, notify our administrators by clicking below to initiate review.
                </p>

                <button
                  disabled={feeStatus?.status !== 'unpaid' || updating}
                  onClick={handleMarkAsSent}
                  className={`btn w-full flex items-center justify-center gap-2 py-2.5 font-bold rounded-xl transition-all ${
                    feeStatus?.status === 'unpaid'
                      ? 'btn-gold'
                      : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
                  }`}
                >
                  {updating ? (
                    <div className="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin" />
                  ) : feeStatus?.status === 'unpaid' ? (
                    <>
                      <span>I've sent my payment proof</span>
                      <ArrowRight size={14} />
                    </>
                  ) : feeStatus?.status === 'pending' ? (
                    <span>Awaiting Admin Approval</span>
                  ) : (
                    <span>Completed & Checked</span>
                  )}
                </button>
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
        )}
      </div>
    </StudentShell>
  );
};

export default StudentCheckoutPage;
