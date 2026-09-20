import React, { useState, useEffect } from 'react';
import { 
  Settings, ShieldCheck, Clock, Search, Check,
  AlertCircle, Sparkles, Save, Loader2, Coins, BookOpen,
  Award, FileText, ExternalLink, XCircle, CheckCircle2, Plus, Trash2, ShieldAlert, X,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { 
  getUniversalFeeConfig, saveUniversalFeeConfig, 
  getPendingFeeStatuses, updateFeeStatus,
  getClassesWithFeeConfigs, syncPricingToFeeConfigs,
  ClassWithFeeConfig
} from '../../lib/db';
import { BOARDS } from '../../lib/taxonomy';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { useMobile } from '../../hooks/useMobile';
import { validatePakistaniPhoneNumber } from '../../lib/phoneValidation';
import {
  getSubjectPricingSettings,
  updateSubjectPricingSettings,
} from '../../lib/subjectEnrollmentService';
import {
  getScholarshipApplications,
  getScholarshipTiers,
  saveScholarshipTiers,
  adminApproveScholarship,
  adminRejectScholarship,
  adminRevokeScholarship,
  DEFAULT_SCHOLARSHIP_TIERS
} from '../../lib/scholarshipService';
import { ScholarshipApplication, ScholarshipTier } from '../../types/scholarship';
import { toast } from 'sonner';

export const AdminFeesPage: React.FC = () => {
  const isMobile = useMobile();
  // Tabs
  const [activeTab, setActiveTab] = useState<'pending' | 'scholarships' | 'configs'>('pending');

  // Scholarship Queue & Config States
  const [scholarshipApps, setScholarshipApps] = useState<ScholarshipApplication[]>([]);
  const [scholarshipTiers, setScholarshipTiers] = useState<ScholarshipTier[]>(DEFAULT_SCHOLARSHIP_TIERS);
  const [scholarshipFilterStatus, setScholarshipFilterStatus] = useState<string>('all');
  const [scholarshipFilterBoard, setScholarshipFilterBoard] = useState<string>('all');
  const [scholarshipSearch, setScholarshipSearch] = useState<string>('');
  const [processingSchId, setProcessingSchId] = useState<string | null>(null);
  const [rejectModalAppId, setRejectModalAppId] = useState<string | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState<string>('');
  const [verifiedMarksInputs, setVerifiedMarksInputs] = useState<Record<string, string>>({});
  const [verifiedDiscountInputs, setVerifiedDiscountInputs] = useState<Record<string, string>>({});
  const [reviewNotesInputs, setReviewNotesInputs] = useState<Record<string, string>>({});
  const [savingTiers, setSavingTiers] = useState<boolean>(false);

  // Loaders & Errors
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingClasses, setSavingClasses] = useState(false);
  const [savingClassId, setSavingClassId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queryErrors, setQueryErrors] = useState<{
    pending?: { message: string; code?: string; details?: string };
    configs?: { message: string; code?: string; details?: string };
    classes?: { message: string; code?: string; details?: string };
    scholarships?: { message: string; code?: string; details?: string };
  }>({});
  const [successNotif, setSuccessNotif] = useState<string | null>(null);

  // Data States
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<ClassWithFeeConfig[]>([]);
  const [selectedBoardFilter, setSelectedBoardFilter] = useState<string>('all');
  const [classPrices, setClassPrices] = useState<Record<string, number>>({});

  // Config Form States
  const [instructions, setInstructions] = useState<string>('');
  const [whatsappNum, setWhatsappNum] = useState<string>('+92 3222314436');
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [whatsappTouched, setWhatsappTouched] = useState<boolean>(false);
  const [suggestedFix, setSuggestedFix] = useState<string | null>(null);
  const [approvingIds, setApprovingIds] = useState<Record<string, boolean>>({});

  // Subject Enrollment Pricing Config States
  const [perSubjectFee, setPerSubjectFee] = useState<number>(1000);
  const [autoUpgradeThreshold, setAutoUpgradeThreshold] = useState<number>(3);
  const [savingSubjectPricing, setSavingSubjectPricing] = useState<boolean>(false);

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setWhatsappNum(val);
    setWhatsappTouched(true);

    if (val.trim()) {
      const res = validatePakistaniPhoneNumber(val, true);
      if (!res.isValid) {
        setWhatsappError(res.error);
        setSuggestedFix(res.suggestedFix || null);
      } else {
        setWhatsappError(null);
        setSuggestedFix(null);
      }
    } else {
      setWhatsappError('WhatsApp phone number is required.');
      setSuggestedFix(null);
    }
  };

  const handleWhatsappBlur = () => {
    setWhatsappTouched(true);
    const res = validatePakistaniPhoneNumber(whatsappNum, true);
    if (!res.isValid) {
      setWhatsappError(res.error);
      setSuggestedFix(res.suggestedFix || null);
    } else {
      setWhatsappError(null);
      setSuggestedFix(null);
    }
  };

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Audit notes state when verifying
  const [auditNotes, setAuditNotes] = useState<Record<string, string>>({});

  const showNotification = (message: string) => {
    setSuccessNotif(message);
    setTimeout(() => setSuccessNotif(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const errors: {
        pending?: { message: string; code?: string; details?: string };
        configs?: { message: string; code?: string; details?: string };
        classes?: { message: string; code?: string; details?: string };
        scholarships?: { message: string; code?: string; details?: string };
      } = {};

      const [
        pendingRes,
        configRes,
        classesRes,
        subjectPricingRes,
        schAppsRes,
        schTiersRes
      ] = await Promise.allSettled([
        getPendingFeeStatuses(),
        getUniversalFeeConfig(),
        getClassesWithFeeConfigs(),
        getSubjectPricingSettings(),
        getScholarshipApplications(),
        getScholarshipTiers(),
      ]);

      if (pendingRes.status === 'fulfilled') {
        setPendingList(pendingRes.value || []);
      } else {
        const err = pendingRes.reason;
        console.error('[AdminFeesPage:loadData] Pending fee status query error:', {
          message: err?.message,
          code: err?.code,
          details: err?.details,
          hint: err?.hint
        });
        errors.pending = {
          message: err?.message || 'Failed to retrieve fee_statuses from Supabase.',
          code: err?.code,
          details: err?.details || err?.hint,
        };
      }

      if (configRes.status === 'fulfilled') {
        const configData = configRes.value;
        if (configData) {
          setInstructions(configData.payment_instructions);
          setWhatsappNum(configData.whatsapp_number);
        } else {
          setInstructions('Easypaisa:\nNumber: 03335292094\nName: Sadia Fatima\n\nJazzCash:\nNumber: 03058969050\nName: Haseena Bibi');
          setWhatsappNum('03222314436');
        }
      } else {
        const err = configRes.reason;
        console.error('[AdminFeesPage:loadData] Universal fee config query error:', err);
        errors.configs = {
          message: err?.message || 'Universal fee configuration query failed.',
          code: err?.code,
          details: err?.details,
        };
      }

      if (classesRes.status === 'fulfilled') {
        const classesData = classesRes.value || [];
        setClassesList(classesData);
        const initialPrices: Record<string, number> = {};
        classesData.forEach((cls) => {
          initialPrices[cls.id] = cls.amount || 0;
        });
        setClassPrices(initialPrices);
      } else {
        const err = classesRes.reason;
        console.error('[AdminFeesPage:loadData] Classes query error:', err);
        errors.classes = {
          message: err?.message || 'Failed to retrieve classes & fee rates.',
          code: err?.code,
          details: err?.details,
        };
      }

      if (subjectPricingRes.status === 'fulfilled' && subjectPricingRes.value) {
        setPerSubjectFee(subjectPricingRes.value.per_subject_fee);
        setAutoUpgradeThreshold(subjectPricingRes.value.auto_upgrade_threshold);
      }

      if (schAppsRes.status === 'fulfilled') {
        setScholarshipApps(schAppsRes.value || []);
      } else {
        const err = schAppsRes.reason;
        console.error('[AdminFeesPage:loadData] Scholarship applications query error:', {
          message: err?.message,
          code: err?.code,
          details: err?.details,
          hint: err?.hint
        });
        errors.scholarships = {
          message: err?.message || 'Failed to retrieve scholarship_applications from Supabase.',
          code: err?.code,
          details: err?.details || err?.hint,
        };
      }

      if (schTiersRes.status === 'fulfilled') {
        setScholarshipTiers(schTiersRes.value || DEFAULT_SCHOLARSHIP_TIERS);
      } else {
        setScholarshipTiers(DEFAULT_SCHOLARSHIP_TIERS);
      }

      setQueryErrors(errors);

      const errKeys = Object.keys(errors) as (keyof typeof errors)[];
      if (errKeys.length > 0) {
        const detailStr = errKeys
          .map(k => `${k.toUpperCase()}: ${errors[k]?.message}${errors[k]?.code ? ` (Code: ${errors[k]?.code})` : ''}`)
          .join(' | ');
        setError(`Database Error: ${detailStr}`);
      }
    } catch (err: any) {
      console.error('[AdminFeesPage:loadData] Unexpected failure:', err);
      setError(err?.message || 'Unexpected failure occurred while loading fee data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Keep pending list live: refresh whenever any fee_statuses row changes
  useRealtimeTable({
    table: 'fee_statuses',
    onInsert: async () => {
      const fresh = await getPendingFeeStatuses().catch(() => []);
      setPendingList(fresh);
    },
    onUpdate: async () => {
      const fresh = await getPendingFeeStatuses().catch(() => []);
      setPendingList(fresh);
    },
  });

  // Keep scholarship list live
  useRealtimeTable({
    table: 'scholarship_applications',
    onInsert: async () => {
      const fresh = await getScholarshipApplications().catch(() => []);
      setScholarshipApps(fresh);
      const freshPending = await getPendingFeeStatuses().catch(() => []);
      setPendingList(freshPending);
    },
    onUpdate: async () => {
      const fresh = await getScholarshipApplications().catch(() => []);
      setScholarshipApps(fresh);
      const freshPending = await getPendingFeeStatuses().catch(() => []);
      setPendingList(freshPending);
    },
    onDelete: async () => {
      const fresh = await getScholarshipApplications().catch(() => []);
      setScholarshipApps(fresh);
      const freshPending = await getPendingFeeStatuses().catch(() => []);
      setPendingList(freshPending);
    },
  });

  const handleApproveScholarship = async (app: ScholarshipApplication) => {
    try {
      setProcessingSchId(app.id);
      setError(null);
      const marks = parseFloat(verifiedMarksInputs[app.id] ?? app.claimed_marks_percentage.toString());
      const defaultDiscount = marks >= 90 ? 60 : 40;
      const discount = parseFloat(verifiedDiscountInputs[app.id] ?? defaultDiscount.toString());
      const notes = reviewNotesInputs[app.id] || '';

      await adminApproveScholarship(app.id, {
        verified_marks_percentage: isNaN(marks) ? app.claimed_marks_percentage : marks,
        discount_percentage: isNaN(discount) ? defaultDiscount : discount,
        review_notes: notes,
      });

      toast.success(`Scholarship approved for ${app.applicant_name} (${discount}% discount)!`);
      showNotification(`Scholarship authorized: ${discount}% fee reduction applied.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to approve scholarship application.');
      toast.error('Approval failed: ' + err.message);
    } finally {
      setProcessingSchId(null);
    }
  };

  const handleRejectScholarship = async (appId: string) => {
    try {
      setProcessingSchId(appId);
      setError(null);
      const reason = rejectReasonText.trim() || 'Eligibility criteria not met or unverified mark sheet.';
      await adminRejectScholarship(appId, reason);
      toast.success('Scholarship application rejected.');
      showNotification('Scholarship application rejected.');
      setRejectModalAppId(null);
      setRejectReasonText('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to reject scholarship.');
      toast.error('Rejection failed: ' + err.message);
    } finally {
      setProcessingSchId(null);
    }
  };

  const handleRevokeScholarship = async (appId: string) => {
    try {
      setProcessingSchId(appId);
      setError(null);
      await adminRevokeScholarship(appId, 'Revoked by administrator');
      toast.success('Scholarship revoked and fee restored to standard amount.');
      showNotification('Scholarship revoked and fee restored.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke scholarship.');
      toast.error('Revocation failed: ' + err.message);
    } finally {
      setProcessingSchId(null);
    }
  };

  const handleSaveTiers = async () => {
    try {
      setSavingTiers(true);
      setError(null);
      await saveScholarshipTiers(scholarshipTiers);
      toast.success('Scholarship tiers saved successfully!');
      showNotification('Scholarship tiers configuration updated!');
    } catch (err: any) {
      setError(err.message || 'Failed to save tiers.');
      toast.error('Failed to save tiers: ' + err.message);
    } finally {
      setSavingTiers(false);
    }
  };

  const handlePriceChange = (classId: string, value: string) => {
    const parsed = parseInt(value, 10);
    setClassPrices((prev) => ({
      ...prev,
      [classId]: isNaN(parsed) ? 0 : parsed
    }));
  };

  const handleSaveSingleClassFee = async (classId: string) => {
    setSavingClassId(classId);
    try {
      setError(null);
      const amount = classPrices[classId] || 0;
      await syncPricingToFeeConfigs(classId, amount);
      showNotification('Class fee rate updated successfully in database!');
      const updatedClasses = await getClassesWithFeeConfigs();
      setClassesList(updatedClasses);
    } catch (err: any) {
      setError(err.message || 'Failed to update class fee.');
    } finally {
      setSavingClassId(null);
    }
  };

  const handleSaveAllClassFees = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingClasses(true);
    try {
      setError(null);
      const targetClasses = selectedBoardFilter === 'all'
        ? classesList
        : classesList.filter((c) => c.board_id === selectedBoardFilter);

      for (const cls of targetClasses) {
        const amount = classPrices[cls.id] || 0;
        await syncPricingToFeeConfigs(cls.id, amount);
      }

      showNotification('All class tuition fee rates saved and synced to database!');
      const updatedClasses = await getClassesWithFeeConfigs();
      setClassesList(updatedClasses);
    } catch (err: any) {
      setError(err.message || 'Failed to save class fees.');
    } finally {
      setSavingClasses(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneValidation = validatePakistaniPhoneNumber(whatsappNum, true);
    if (!phoneValidation.isValid) {
      setWhatsappTouched(true);
      setWhatsappError(phoneValidation.error);
      setSuggestedFix(phoneValidation.suggestedFix || null);
      setError(phoneValidation.error);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await saveUniversalFeeConfig(instructions.trim(), phoneValidation.normalized);
      showNotification('Universal fee configuration successfully saved!');
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSubjectPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSubjectPricing(true);
      setError(null);
      await updateSubjectPricingSettings({
        per_subject_fee: Math.max(100, Number(perSubjectFee) || 1000),
        auto_upgrade_threshold: Math.max(1, Number(autoUpgradeThreshold) || 3)
      });
      showNotification('Per-subject tuition fee & auto-upgrade threshold successfully updated!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save subject pricing configuration.');
    } finally {
      setSavingSubjectPricing(false);
    }
  };

  const handleApprovePayment = async (studentId: string) => {
    setApprovingIds(prev => ({ ...prev, [studentId]: true }));
    try {
      setError(null);
      const note = auditNotes[studentId]?.trim() || 'Payment verified manually by Administrator via WhatsApp screenshot reference.';
      await updateFeeStatus(studentId, 'paid', note);
      showNotification('Student marked as PAID successfully.');
      
      // Update local state
      setPendingList(prev => prev.filter(item => item.student_id !== studentId));
      setAuditNotes(prev => {
        const copy = { ...prev };
        delete copy[studentId];
        return copy;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to verify payment.');
    } finally {
      setApprovingIds(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const handleAuditNoteChange = (studentId: string, val: string) => {
    setAuditNotes(prev => ({
      ...prev,
      [studentId]: val
    }));
  };

  // Filter list
  const filteredPending = pendingList.filter(item => 
    item.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (Array.isArray(item.subjects) && item.subjects.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const filteredClasses = selectedBoardFilter === 'all'
    ? classesList
    : classesList.filter((c) => c.board_id === selectedBoardFilter);

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Institutional Fee Management"
            description="Manage active student billing, per-class tuition rates across all boards (FBISE, Punjab Board, Sindh Board & IELTS Preparation), and WhatsApp verification."
          />
        </div>

        {/* Success Toast */}
        {successNotif && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-[#F0FDF4] border-[#bbf7d0] text-[#16a34a] shadow-lg animate-in slide-in-from-bottom-5 duration-300">
            <Check size={16} />
            <span className="text-xs font-bold">{successNotif}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#fecaca] text-sm text-[#dc2626] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0 mt-0.5 sm:mt-0 text-[#dc2626]" />
              <div className="space-y-0.5">
                <span className="font-bold block">{error}</span>
                <span className="text-xs text-rose-700 block">
                  Verify Supabase RLS policies and table structures. One failing query no longer blanks the page.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadData()}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#dc2626] text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors shrink-0 shadow-2xs"
            >
              <RefreshCw size={13} />
              Retry Failed Queries
            </button>
          </div>
        )}

        {/* Tab Controls */}
        <div className={`flex border-b border-[#E5E5E5] pb-px ${isMobile ? 'flex-col gap-0' : 'items-center gap-1'}`}>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 transition-all duration-200 ${
              isMobile
                ? `px-4 py-3 text-xs font-bold border-b-2 w-full ${
                    activeTab === 'pending'
                      ? 'border-[#F4C430] text-[#111111] bg-amber-50/30'
                      : 'border-transparent text-[#737373]'
                  }`
                : `px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 ${
                    activeTab === 'pending'
                      ? 'border-[#F4C430] text-[#111111]'
                      : 'border-transparent text-[#737373] hover:text-[#262626]'
                  }`
            }`}
          >
            <Clock size={14} />
            <span>Pending Verification</span>
            {queryErrors.pending ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">Error</span>
            ) : (
              <span className="text-xs">({pendingList.length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('scholarships')}
            className={`flex items-center gap-2 transition-all duration-200 ${
              isMobile
                ? `px-4 py-3 text-xs font-bold border-b-2 w-full ${
                    activeTab === 'scholarships'
                      ? 'border-[#F4C430] text-[#111111] bg-amber-50/30'
                      : 'border-transparent text-[#737373]'
                  }`
                : `px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 ${
                    activeTab === 'scholarships'
                      ? 'border-[#F4C430] text-[#111111]'
                      : 'border-transparent text-[#737373] hover:text-[#262626]'
                  }`
            }`}
          >
            <Award size={14} />
            <span>Scholarship Queue</span>
            {queryErrors.scholarships ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">Error</span>
            ) : (
              <span className="text-xs">({scholarshipApps.filter((a) => a.status === 'pending').length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('configs')}
            className={`flex items-center gap-2 transition-all duration-200 ${
              isMobile
                ? `px-4 py-3 text-xs font-bold border-b-2 w-full ${
                    activeTab === 'configs'
                      ? 'border-[#F4C430] text-[#111111] bg-amber-50/30'
                      : 'border-transparent text-[#737373]'
                  }`
                : `px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 ${
                    activeTab === 'configs'
                      ? 'border-[#F4C430] text-[#111111]'
                      : 'border-transparent text-[#737373] hover:text-[#262626]'
                  }`
            }`}
          >
            <Settings size={14} />
            Fee Configuration & Rates
          </button>
        </div>

        {loading ? (
          <div className="card py-20 flex flex-col items-center justify-center gap-3 interactive">
            <div className="w-8 h-8 rounded-full border-2 border-[#E5E5E5] border-t-[#F4C430] animate-spin" />
            <span className="text-xs text-[#737373] font-medium">Loading fee modules...</span>
          </div>
        ) : (
          <div>
            {/* Tab 1: Pending Approvals */}
            {activeTab === 'pending' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="card bg-white border border-[#E5E5E5] p-4 interactive">
                  <div className="relative w-full sm:max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                    <input
                      type="text"
                      placeholder="Search pending students by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input pl-9 py-2 text-xs w-full bg-[#FAFAFA] border-[#F0F0F0]"
                    />
                  </div>
                </div>

                {/* Query Error State or List */}
                {queryErrors.pending ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-4">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                      <AlertTriangle size={24} />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h3 className="text-sm font-black text-rose-900">Failed to Retrieve Fee Verification Records</h3>
                      <p className="text-xs font-medium text-rose-700">
                        {queryErrors.pending.message}
                      </p>
                      {(queryErrors.pending.code || queryErrors.pending.details) && (
                        <div className="text-[11px] font-mono text-rose-800 bg-white/80 p-3 rounded-xl text-left border border-rose-200 break-all space-y-1">
                          {queryErrors.pending.code && <div><span className="font-bold">Supabase Code:</span> {queryErrors.pending.code}</div>}
                          {queryErrors.pending.details && <div><span className="font-bold">Details:</span> {queryErrors.pending.details}</div>}
                        </div>
                      )}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => loadData()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all shadow-sm"
                      >
                        <RefreshCw size={14} />
                        Retry Verification Query
                      </button>
                    </div>
                  </div>
                ) : filteredPending.length === 0 ? (
                  <div className="card text-center py-16 interactive">
                    <ShieldCheck size={32} className="mx-auto text-emerald-500 mb-3" />
                    <h3 className="text-sm font-bold text-[#111111]">All caught up!</h3>
                    <p className="text-xs text-[#737373] mt-1">There are no student fee payments awaiting verification.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredPending.map((item) => (
                      <div key={item.student_id} className="bg-white rounded-2xl border border-[#E5E5E5] p-6 flex flex-col gap-4">
                        {/* Student Meta */}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-extrabold text-[#111111]">{item.full_name}</span>
                            <span className="badge badge-gray text-[10px] whitespace-nowrap">{item.class_name}</span>
                            {item.plan_type === 'custom' && item.subjects && item.subjects.length > 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-800 text-[10px] font-bold whitespace-nowrap">
                                {item.subjects.length} Active {item.subjects.length === 1 ? 'Subject' : 'Subjects'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold whitespace-nowrap">
                                All Subjects Package
                              </span>
                            )}
                            {item.original_amount && item.amount && item.original_amount > item.amount ? (
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span className="text-xs line-through text-slate-400 font-bold">
                                  PKR {item.original_amount.toLocaleString()}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-black">
                                  PKR {item.amount.toLocaleString()} / term
                                </span>
                              </div>
                            ) : item.amount && typeof item.amount === 'number' && item.amount > 0 ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black whitespace-nowrap">
                                PKR {item.amount.toLocaleString()} / term
                              </span>
                            ) : null}
                            {item.scholarship_status === 'verified' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black whitespace-nowrap flex items-center gap-1">
                                <Award size={12} />
                                Scholarship: {item.scholarship_discount_percentage}% Verified
                              </span>
                            )}
                            {item.scholarship_status === 'pending' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black whitespace-nowrap flex items-center gap-1">
                                <Clock size={12} />
                                Scholarship Pending ({item.scholarship_discount_percentage}% Waiver Claimed{item.claimed_marks ? ` • ${item.claimed_marks}% Marks` : ''})
                              </span>
                            )}
                            {item.explanation_label && (
                              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 bg-emerald-50/70 border border-emerald-200 px-2 py-0.5 rounded-md">
                                <Sparkles size={11} className="text-emerald-600" />
                                {item.explanation_label}
                              </span>
                            )}
                          </div>

                          {/* Active Enrolled Subjects Pills */}
                          {item.subjects && item.subjects.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              <span className="text-[10px] text-[#737373] font-bold uppercase tracking-wider mr-1">
                                Active Subjects:
                              </span>
                              {item.subjects.map((subj: string, sIdx: number) => (
                                <span
                                  key={sIdx}
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] text-[#262626] whitespace-nowrap"
                                >
                                  {subj}
                                </span>
                              ))}
                            </div>
                          )}

                          {item.email && <p className="text-xs text-[#737373]">{item.email}</p>}

                          {item.scholarship_proof_url && (
                            <div className="pt-1">
                              <a
                                href={item.scholarship_proof_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-amber-800 hover:text-amber-950 font-bold bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
                              >
                                <FileText size={13} />
                                <span>View Marksheet Proof Document</span>
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          )}

                          {item.submission_note && (
                            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 font-medium leading-relaxed mt-1">
                              <span className="font-bold text-amber-900">Proof Submission Details: </span>
                              {item.submission_note}
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-[10px] text-[#A3A3A3] font-semibold mt-1">
                            <Clock size={11} />
                            <span>Submitted: {new Date(item.updated_at).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Audit Input & Verify Button */}
                        <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row items-center'}`}>
                          <input
                            type="text"
                            placeholder="Optional audit log comment..."
                            value={auditNotes[item.student_id] || ''}
                            onChange={(e) => handleAuditNoteChange(item.student_id, e.target.value)}
                            className="input py-2 text-xs bg-[#FAFAFA] w-full"
                          />
                          <button
                            onClick={() => handleApprovePayment(item.student_id)}
                            disabled={approvingIds[item.student_id]}
                            className={`btn btn-gold flex items-center justify-center gap-1.5 py-2 text-xs font-bold shrink-0 disabled:opacity-50 ${isMobile ? 'w-full px-4' : 'px-5'}`}
                          >
                            {approvingIds[item.student_id] ? (
                              <Loader2 size={14} className="animate-spin shrink-0" />
                            ) : (
                              <Check size={14} />
                            )}
                            Approve & Mark Paid
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Scholarship Verification Queue & Tiers */}
            {activeTab === 'scholarships' && (
              <div className="space-y-8">
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 space-y-1">
                    <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider block">
                      Total Applications
                    </span>
                    <span className="text-2xl font-black text-[#111111] font-mono block">
                      {queryErrors.scholarships ? (
                        <span className="text-rose-600 text-sm font-bold">Error</span>
                      ) : (
                        scholarshipApps.length
                      )}
                    </span>
                  </div>
                  <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-1">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                      Pending Review
                    </span>
                    <span className="text-2xl font-black text-amber-900 font-mono block">
                      {queryErrors.scholarships ? (
                        <span className="text-rose-600 text-sm font-bold">Error</span>
                      ) : (
                        scholarshipApps.filter((a) => a.status === 'pending').length
                      )}
                    </span>
                  </div>
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Approved & Active
                    </span>
                    <span className="text-2xl font-black text-emerald-900 font-mono block">
                      {queryErrors.scholarships ? (
                        <span className="text-rose-600 text-sm font-bold">Error</span>
                      ) : (
                        scholarshipApps.filter((a) => a.status === 'verified').length
                      )}
                    </span>
                  </div>
                  <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-4 space-y-1">
                    <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                      Rejected
                    </span>
                    <span className="text-2xl font-black text-rose-900 font-mono block">
                      {queryErrors.scholarships ? (
                        <span className="text-rose-600 text-sm font-bold">Error</span>
                      ) : (
                        scholarshipApps.filter((a) => a.status === 'rejected').length
                      )}
                    </span>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 sm:max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                    <input
                      type="text"
                      placeholder="Search applicant name, email, or board..."
                      value={scholarshipSearch}
                      onChange={(e) => setScholarshipSearch(e.target.value)}
                      className="input pl-9 py-2 text-xs w-full bg-[#FAFAFA] border-[#F0F0F0]"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Filter */}
                    <div className="flex items-center bg-[#F5F5F5] p-1 rounded-xl">
                      {['all', 'pending', 'verified', 'rejected'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setScholarshipFilterStatus(st)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-all ${
                            scholarshipFilterStatus === st
                              ? 'bg-white text-[#111111] shadow-xs'
                              : 'text-[#737373] hover:text-[#111111]'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    {/* Board Filter */}
                    <select
                      value={scholarshipFilterBoard}
                      onChange={(e) => setScholarshipFilterBoard(e.target.value)}
                      className="input py-1.5 px-3 text-xs bg-white border border-[#E5E5E5] rounded-xl font-bold text-[#111111]"
                    >
                      <option value="all">All Boards & Streams</option>
                      {BOARDS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Queue of Applications */}
                <div className="space-y-4">
                  {queryErrors.scholarships ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-4">
                      <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle size={24} />
                      </div>
                      <div className="max-w-md mx-auto space-y-2">
                        <h3 className="text-sm font-black text-rose-900">Failed to Retrieve Scholarship Applications</h3>
                        <p className="text-xs font-medium text-rose-700">
                          {queryErrors.scholarships.message}
                        </p>
                        {(queryErrors.scholarships.code || queryErrors.scholarships.details) && (
                          <div className="text-[11px] font-mono text-rose-800 bg-white/80 p-3 rounded-xl text-left border border-rose-200 break-all space-y-1">
                            {queryErrors.scholarships.code && <div><span className="font-bold">Supabase Code:</span> {queryErrors.scholarships.code}</div>}
                            {queryErrors.scholarships.details && <div><span className="font-bold">Details:</span> {queryErrors.scholarships.details}</div>}
                          </div>
                        )}
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => loadData()}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all shadow-sm"
                        >
                          <RefreshCw size={14} />
                          Retry Scholarship Query
                        </button>
                      </div>
                    </div>
                  ) : (() => {
                    const filtered = scholarshipApps.filter((app) => {
                      const matchesStatus =
                        scholarshipFilterStatus === 'all' || app.status === scholarshipFilterStatus;
                      const matchesBoard =
                        scholarshipFilterBoard === 'all' || app.board === scholarshipFilterBoard;
                      const q = scholarshipSearch.toLowerCase().trim();
                      const matchesSearch =
                        !q ||
                        (app.applicant_name && app.applicant_name.toLowerCase().includes(q)) ||
                        (app.applicant_email && app.applicant_email.toLowerCase().includes(q)) ||
                        (app.board && app.board.toLowerCase().includes(q));
                      return matchesStatus && matchesBoard && matchesSearch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="bg-white rounded-2xl border border-[#E5E5E5] text-center py-16 p-6 space-y-2">
                          <Award size={32} className="mx-auto text-amber-500 mb-2" />
                          <h3 className="text-sm font-bold text-[#111111]">No scholarship applications found</h3>
                          <p className="text-xs text-[#737373]">
                            {scholarshipApps.length === 0
                              ? 'No students have applied for merit scholarships yet.'
                              : 'No applications match the currently selected filters.'}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 gap-4">
                        {filtered.map((app) => {
                          const isPending = app.status === 'pending';
                          const isApproved = app.status === 'verified';
                          const isRejected = app.status === 'rejected';
                          const isProcessing = processingSchId === app.id;

                          const curVerifiedMarks =
                            verifiedMarksInputs[app.id] !== undefined
                              ? verifiedMarksInputs[app.id]
                              : app.claimed_marks_percentage.toString();
                          const curMarksNum = parseFloat(curVerifiedMarks) || app.claimed_marks_percentage;
                          const recommendedDiscount = curMarksNum >= 90 ? 60 : curMarksNum >= 80 ? 40 : 0;
                          const curDiscount =
                            verifiedDiscountInputs[app.id] !== undefined
                              ? verifiedDiscountInputs[app.id]
                              : recommendedDiscount.toString();

                          return (
                            <div
                              key={app.id}
                              className="bg-white rounded-2xl border border-[#E5E5E5] p-6 flex flex-col gap-4 shadow-xs"
                            >
                              {/* Header Meta */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F5F5F5] pb-3">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-extrabold text-[#111111]">
                                      {app.applicant_name}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-extrabold uppercase">
                                      {app.board}
                                    </span>
                                    <span className="badge badge-gray text-[10px]">
                                      Grade / Class {app.class_grade}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#737373] mt-0.5">{app.applicant_email}</p>
                                </div>

                                <div>
                                  {isPending && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                                      <Clock size={13} />
                                      Pending Verification
                                    </span>
                                  )}
                                  {isApproved && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                                      <CheckCircle2 size={13} />
                                      Verified ({app.applied_discount_percentage || app.discount_percentage || 0}% Waiver Applied)
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300">
                                      <XCircle size={13} />
                                      Rejected
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Application Details & Marksheet Proof */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FAFAFA] p-4 rounded-xl border border-[#F0F0F0]">
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-[#737373] block">
                                    Claimed Marks / Grade
                                  </span>
                                  <span className="text-base font-black text-[#111111] font-mono">
                                    {app.claimed_marks_percentage}%
                                  </span>
                                  <span className="text-[10px] font-semibold text-amber-700 block mt-0.5">
                                    Recommended: {recommendedDiscount}% Tuition Waiver
                                  </span>
                                </div>

                                <div>
                                  <span className="text-[10px] uppercase font-bold text-[#737373] block">
                                    Submission Date
                                  </span>
                                  <span className="text-xs font-bold text-[#111111] block mt-0.5">
                                    {new Date(app.created_at).toLocaleDateString()} at{' '}
                                    {new Date(app.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-[10px] uppercase font-bold text-[#737373] block mb-1">
                                    Result Card Marksheet
                                  </span>
                                  {app.proof_document_url ? (
                                    <a
                                      href={app.proof_document_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs text-amber-800 hover:text-amber-950 font-bold bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-xs hover:border-amber-400 transition-colors"
                                    >
                                      <FileText size={13} />
                                      <span>Inspect Marksheet</span>
                                      <ExternalLink size={12} />
                                    </a>
                                  ) : (
                                    <span className="text-xs text-[#A3A3A3] italic">No document attached</span>
                                  )}
                                </div>
                              </div>

                              {/* Action Bar / Form */}
                              {isPending && (
                                <div className="space-y-3 pt-1">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                      <label className="text-[11px] font-bold text-[#404040] block mb-1">
                                        Verified Marks (%)
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={curVerifiedMarks}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setVerifiedMarksInputs((prev) => ({ ...prev, [app.id]: val }));
                                          const num = parseFloat(val);
                                          if (!isNaN(num)) {
                                            const autoDisc = num >= 90 ? '60' : num >= 80 ? '40' : '0';
                                            setVerifiedDiscountInputs((prev) => ({ ...prev, [app.id]: autoDisc }));
                                          }
                                        }}
                                        className="input py-1.5 px-3 text-xs w-full font-mono font-bold bg-white border-[#D4D4D4]"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[11px] font-bold text-[#404040] block mb-1">
                                        Fee Discount (%)
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={curDiscount}
                                        onChange={(e) =>
                                          setVerifiedDiscountInputs((prev) => ({
                                            ...prev,
                                            [app.id]: e.target.value,
                                          }))
                                        }
                                        className="input py-1.5 px-3 text-xs w-full font-mono font-bold bg-white border-[#D4D4D4]"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[11px] font-bold text-[#404040] block mb-1">
                                        Verification Notes (Optional)
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Verified from official board gazette"
                                        value={reviewNotesInputs[app.id] || ''}
                                        onChange={(e) =>
                                          setReviewNotesInputs((prev) => ({
                                            ...prev,
                                            [app.id]: e.target.value,
                                          }))
                                        }
                                        className="input py-1.5 px-3 text-xs w-full bg-white border-[#D4D4D4]"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-end gap-2.5 pt-2">
                                    <button
                                      type="button"
                                      disabled={isProcessing}
                                      onClick={() => {
                                        setRejectModalAppId(app.id);
                                        setRejectReasonText('Marksheet document could not be verified or does not meet the 80% merit requirement.');
                                      }}
                                      className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                                    >
                                      Reject Application
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isProcessing}
                                      onClick={() => handleApproveScholarship(app)}
                                      className="btn btn-gold px-5 py-2 text-xs font-bold flex items-center gap-1.5"
                                    >
                                      {isProcessing ? (
                                        <Loader2 size={14} className="animate-spin" />
                                      ) : (
                                        <Check size={14} />
                                      )}
                                      <span>Verify & Apply {curDiscount}% Scholarship</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {isApproved && (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#F5F5F5]">
                                  <div className="text-xs text-[#737373]">
                                    <span className="font-bold text-[#111111]">
                                      Verified Marks: {app.verified_marks_percentage}%
                                    </span>{' '}
                                    • Approved by Admin on{' '}
                                    {(app.reviewed_at || app.verified_at) ? new Date((app.reviewed_at || app.verified_at)!).toLocaleDateString() : 'Recent'}
                                    {(app.admin_notes || app.review_notes) && (
                                      <span className="block text-[11px] text-[#525252] mt-0.5 italic">
                                        Notes: {app.admin_notes || app.review_notes}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => handleRevokeScholarship(app.id)}
                                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors self-start sm:self-auto"
                                  >
                                    Revoke Scholarship
                                  </button>
                                </div>
                              )}

                              {isRejected && (
                                <div className="pt-2 border-t border-[#F5F5F5] text-xs text-rose-800">
                                  <span className="font-bold">Rejection Reason: </span>
                                  <span>{app.rejection_reason || 'Criteria not met.'}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Section 2: Scholarship Tiers Configuration */}
                <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F5F5F5] pb-4">
                    <div className="flex items-center gap-2">
                      <Award size={18} className="text-[#D4A017]" />
                      <div>
                        <h2 className="font-extrabold text-[#111111] text-base">
                          Configurable Scholarship Tiers (All Boards & Classes)
                        </h2>
                        <p className="text-xs text-[#737373] mt-0.5">
                          Set the minimum marks percentage requirements and corresponding fee discount waivers. These tiers apply automatically to registration and tuition checkout across FBISE, Punjab, Sindh, KPK, Cambridge O/A Levels, and IELTS.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tiers List */}
                  <div className="space-y-3">
                    {scholarshipTiers.map((tier, idx) => (
                      <div
                        key={tier.id || idx}
                        className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-[#737373] block mb-1">
                              Tier Label
                            </label>
                            <input
                              type="text"
                              value={tier.tier_name || tier.description || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setScholarshipTiers((prev) =>
                                  prev.map((t, i) => (i === idx ? { ...t, tier_name: val, description: val } : t))
                                );
                              }}
                              className="input py-1.5 px-3 text-xs w-full bg-white font-bold text-[#111111]"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold text-[#737373] block mb-1">
                              Min Marks (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={tier.min_marks_percentage}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setScholarshipTiers((prev) =>
                                  prev.map((t, i) =>
                                    i === idx ? { ...t, min_marks_percentage: val } : t
                                  )
                                );
                              }}
                              className="input py-1.5 px-3 text-xs w-full font-mono font-bold bg-white text-[#111111]"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold text-[#737373] block mb-1">
                              Max Marks (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={tier.max_marks_percentage ?? ''}
                              onChange={(e) => {
                                const val = e.target.value ? parseFloat(e.target.value) : undefined;
                                setScholarshipTiers((prev) =>
                                  prev.map((t, i) =>
                                    i === idx ? { ...t, max_marks_percentage: val } : t
                                  )
                                );
                              }}
                              className="input py-1.5 px-3 text-xs w-full font-mono font-bold bg-white text-[#111111]"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold text-[#737373] block mb-1">
                              Tuition Discount (%)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={tier.discount_percentage}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setScholarshipTiers((prev) =>
                                  prev.map((t, i) =>
                                    i === idx ? { ...t, discount_percentage: val } : t
                                  )
                                );
                              }}
                              className="input py-1.5 px-3 text-xs w-full font-mono font-bold bg-white text-emerald-800"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-[#525252] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tier.is_active}
                              onChange={(e) => {
                                const val = e.target.checked;
                                setScholarshipTiers((prev) =>
                                  prev.map((t, i) => (i === idx ? { ...t, is_active: val } : t))
                                );
                              }}
                              className="rounded text-[#D4A017] focus:ring-[#D4A017]"
                            />
                            <span>Active</span>
                          </label>

                          {scholarshipTiers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setScholarshipTiers((prev) => prev.filter((_, i) => i !== idx));
                              }}
                              className="p-1.5 text-[#737373] hover:text-rose-600 rounded-lg transition-colors"
                              title="Delete tier"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#F5F5F5]">
                    <button
                      type="button"
                      onClick={() => {
                        setScholarshipTiers((prev) => [
                          ...prev,
                          {
                            id: `tier_${Date.now()}`,
                            tier_name: 'Custom Merit Tier',
                            description: 'Custom Merit Tier',
                            min_marks_percentage: 95,
                            max_marks_percentage: 100,
                            discount_percentage: 75,
                            applicable_boards: 'all',
                            is_active: true,
                          },
                        ]);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4A017] hover:text-[#b8890e] self-start sm:self-auto"
                    >
                      <Plus size={14} />
                      <span>Add New Tier</span>
                    </button>

                    <button
                      type="button"
                      disabled={savingTiers}
                      onClick={handleSaveTiers}
                      className="btn btn-gold px-6 py-2.5 text-xs font-bold flex items-center gap-2 self-start sm:self-auto"
                    >
                      {savingTiers ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      <span>Save Scholarship Tiers</span>
                    </button>
                  </div>
                </div>

                {/* Reject Modal */}
                {rejectModalAppId && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border border-[#E5E5E5] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-3">
                        <div className="flex items-center gap-2">
                          <ShieldAlert size={18} className="text-rose-600" />
                          <h3 className="text-sm font-extrabold text-[#111111]">
                            Reject Scholarship Application
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRejectModalAppId(null)}
                          className="text-[#737373] hover:text-[#111111]"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <p className="text-xs text-[#737373]">
                        Please provide a reason for rejecting this application. This reason will be recorded in the audit log and communicated to the student.
                      </p>

                      <div>
                        <label className="text-[11px] font-bold text-[#404040] block mb-1">
                          Rejection Reason
                        </label>
                        <textarea
                          rows={3}
                          value={rejectReasonText}
                          onChange={(e) => setRejectReasonText(e.target.value)}
                          className="input w-full p-2.5 text-xs bg-[#FAFAFA] border-[#D4D4D4] rounded-xl outline-none"
                          placeholder="State reason (e.g. Marksheet proof illegible or marks below 80%)..."
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F5F5F5]">
                        <button
                          type="button"
                          onClick={() => setRejectModalAppId(null)}
                          className="px-4 py-2 text-xs font-bold text-[#737373] hover:text-[#111111] rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={processingSchId === rejectModalAppId}
                          onClick={() => handleRejectScholarship(rejectModalAppId)}
                          className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center gap-1.5 shadow-sm"
                        >
                          {processingSchId === rejectModalAppId ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <XCircle size={13} />
                          )}
                          <span>Confirm Rejection</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Configurations */}
            {activeTab === 'configs' && (
              <div className="space-y-8 max-w-4xl mx-auto">
                {/* Section 1: Per-Class Tuition Rates */}
                <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F5F5F5] pb-4">
                    <div className="flex items-center gap-2">
                      <Coins size={18} className="text-[#F4C430]" />
                      <div>
                        <h2 className="font-extrabold text-[#111111] text-base">
                          Per-Class Tuition Rates (All Boards & Classes)
                        </h2>
                        <p className="text-xs text-[#737373] mt-0.5">
                          Configure official tuition fee amounts across Federal Board (FBISE), Punjab Board, Sindh Board, and IELTS Preparation. Prices set here apply instantly across student onboarding, checkout, and the public fee calculator.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Board Filter Switcher */}
                  <div className="flex items-center gap-1.5 bg-[#F5F5F5] p-1.5 rounded-xl overflow-x-auto no-scrollbar max-w-full">
                    <button
                      type="button"
                      onClick={() => setSelectedBoardFilter('all')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                        selectedBoardFilter === 'all'
                          ? 'bg-white text-[#111111] shadow-xs'
                          : 'text-[#737373] hover:text-[#111111]'
                      }`}
                    >
                      All Classes ({classesList.length})
                    </button>
                    {BOARDS.map((b) => {
                      const count = classesList.filter((c) => c.board_id === b.id).length;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBoardFilter(b.id)}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                            selectedBoardFilter === b.id
                              ? 'bg-white text-[#111111] shadow-xs'
                              : 'text-[#737373] hover:text-[#111111]'
                          }`}
                        >
                          {b.name} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Classes Table / Form */}
                  <form onSubmit={handleSaveAllClassFees} className="space-y-4">
                    <div className="divide-y divide-[#F5F5F5]">
                      {filteredClasses.map((cls) => {
                        const priceVal = classPrices[cls.id] !== undefined ? classPrices[cls.id] : 0;
                        const isSet = cls.is_set && cls.amount > 0;

                        return (
                          <div key={cls.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-[#111111]">
                                  {cls.board_id === 'ielts' ? cls.display_name : `Class ${cls.display_name}`}
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                                  {cls.board_name}
                                </span>
                                {isSet ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    DB Rate: PKR {cls.amount.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    Unset (PKR 0) — will insert row
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-[#A3A3A3] uppercase">PKR</span>
                              <input
                                type="number"
                                min="0"
                                value={priceVal === 0 ? '' : priceVal}
                                onChange={(e) => handlePriceChange(cls.id, e.target.value)}
                                placeholder="0 (Unset)"
                                className="input py-1.5 text-xs bg-white border-[#E5E5E5] rounded-lg font-bold font-mono w-28 text-right"
                              />
                              <span className="text-[10px] font-black text-[#A3A3A3] uppercase">/term</span>

                              <button
                                type="button"
                                onClick={() => handleSaveSingleClassFee(cls.id)}
                                disabled={savingClassId === cls.id || savingClasses}
                                title="Save this class rate"
                                className="p-2 rounded-lg bg-slate-100 hover:bg-[#F4C430] text-slate-700 hover:text-black transition-colors disabled:opacity-50"
                              >
                                {savingClassId === cls.id ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <Check size={13} />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-4 border-t border-[#F5F5F5] flex justify-end">
                      <button
                        type="submit"
                        disabled={savingClasses}
                        className="btn btn-gold flex items-center justify-center gap-1.5 px-6 py-2 text-xs font-bold"
                      >
                        {savingClasses ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Saving Class Rates…
                          </>
                        ) : (
                          <>
                            <Save size={14} />
                            Save All Class Rates
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Section 2: Per-Subject Pricing & Silent Auto-Upgrade Threshold */}
                <form onSubmit={handleSaveSubjectPricing} className="bg-white rounded-2xl border border-[#E5E5E5] p-6 space-y-6">
                  <div className="flex items-center gap-2 border-b border-[#F5F5F5] pb-3">
                    <BookOpen size={16} className="text-[#F4C430]" />
                    <div>
                      <h2 className="font-extrabold text-[#111111] text-base">
                        Per-Subject Tuition & Auto-Upgrade Threshold
                      </h2>
                      <p className="text-xs text-[#737373] mt-0.5">
                        Configure individual subject billing rates and the threshold for automatic standard class fee pricing.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Per-Subject Fee */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-[#262626]">
                          Per-Subject Tuition Fee (PKR)
                        </label>
                        <span className="text-[10px] text-[#737373] font-medium">Default: Rs. 1,000</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#737373]">PKR</span>
                        <input
                          type="number"
                          min="100"
                          step="100"
                          required
                          value={perSubjectFee}
                          onChange={(e) => setPerSubjectFee(Number(e.target.value) || 0)}
                          className="input py-2 text-xs font-bold w-full"
                          placeholder="1000"
                        />
                      </div>
                      <span className="text-[10px] text-[#A3A3A3] block">
                        Charged per subject when a student selects 1, 2, or 3 individual subjects.
                      </span>
                    </div>

                    {/* Auto-Upgrade Threshold */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-[#262626]">
                          Silent Auto-Upgrade Subject Threshold
                        </label>
                        <span className="text-[10px] text-[#737373] font-medium">Default: 3 subjects</span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        required
                        value={autoUpgradeThreshold}
                        onChange={(e) => setAutoUpgradeThreshold(Number(e.target.value) || 3)}
                        className="input py-2 text-xs font-bold w-full"
                        placeholder="3"
                      />
                      <span className="text-[10px] text-[#A3A3A3] block">
                        If a student selects more than this threshold (e.g. 4+ subjects), they are charged the standard all-subjects class rate.
                      </span>
                    </div>
                  </div>

                  {/* Pricing Matrix Preview */}
                  <div className="p-4 bg-[#F9F9F9] rounded-xl border border-[#E5E5E5] space-y-2">
                    <span className="text-xs font-bold text-[#111111] block">
                      Active Billing Rules Preview:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 bg-white rounded-lg border border-[#E5E5E5]">
                        <span className="text-[10px] text-[#737373] block">1 Subject</span>
                        <span className="font-extrabold text-[#111111]">PKR {perSubjectFee.toLocaleString()}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-[#E5E5E5]">
                        <span className="text-[10px] text-[#737373] block">2 Subjects</span>
                        <span className="font-extrabold text-[#111111]">PKR {(perSubjectFee * 2).toLocaleString()}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-[#E5E5E5]">
                        <span className="text-[10px] text-[#737373] block">3 Subjects</span>
                        <span className="font-extrabold text-[#111111]">PKR {(perSubjectFee * 3).toLocaleString()}</span>
                      </div>
                      <div className="p-2.5 bg-[#FFFBF0] rounded-lg border border-[#FDE68A]">
                        <span className="text-[10px] text-amber-800 font-bold block">4+ Subjects</span>
                        <span className="font-extrabold text-amber-900">Standard Class Rate</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#F5F5F5] flex justify-end">
                    <button
                      type="submit"
                      disabled={savingSubjectPricing}
                      className="btn btn-gold flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs font-bold interactive"
                    >
                      {savingSubjectPricing ? (
                        <div className="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin" />
                      ) : (
                        <>
                          <Save size={14} />
                          Save Subject Pricing Settings
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Section 3: Universal Payment Setup */}
                <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl border border-[#E5E5E5] p-6 space-y-6">
                  <div className="flex items-center gap-2 border-b border-[#F5F5F5] pb-3">
                    <Sparkles size={16} className="text-[#F4C430]" />
                    <div>
                      <h2 className="font-extrabold text-[#111111] text-base">
                        Universal Payment Accounts & WhatsApp Verification
                      </h2>
                      <p className="text-xs text-[#737373] mt-0.5">
                        Account numbers and verification instructions sent to students during registration and checkout.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* WhatsApp Phone */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-[#262626]">
                          WhatsApp Verification Line (wa.me Number)
                        </label>
                        <span className="text-[10px] text-[#737373] font-medium">🇵🇰 +92 3XXXXXXXXX</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={whatsappNum}
                        onChange={handleWhatsappChange}
                        onBlur={handleWhatsappBlur}
                        placeholder="+92 3058969050"
                        className={`input py-2 text-xs w-full transition-colors ${
                          whatsappError && whatsappTouched
                            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                            : ''
                        }`}
                      />
                      {whatsappError && whatsappTouched && (
                        <div className="mt-1 text-left">
                          <p className="text-[11px] text-red-600 font-semibold leading-tight">
                            {whatsappError}
                          </p>
                          {suggestedFix && (
                            <button
                              type="button"
                              onClick={() => {
                                setWhatsappNum(suggestedFix);
                                setWhatsappError(null);
                                setSuggestedFix(null);
                              }}
                              className="text-[10px] text-indigo-600 font-bold underline mt-0.5 inline-block hover:text-indigo-800 cursor-pointer"
                            >
                              Auto-fix to {suggestedFix}
                            </button>
                          )}
                        </div>
                      )}
                      <span className="text-[10px] text-[#A3A3A3] mt-1 block">
                        Specify the verified Pakistani mobile number (+92 3XXXXXXXXX) where students will send payment receipts via WhatsApp.
                      </span>
                    </div>

                    {/* Instructions */}
                    <div>
                      <label className="block text-xs font-bold text-[#262626] mb-1.5">
                        Payment Account Details (Bank, Easypaisa, JazzCash)
                      </label>
                      <textarea
                        required
                        rows={6}
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        className="input py-2 text-xs font-mono leading-relaxed"
                        placeholder="Easypaisa:&#10;Number: 03335292094&#10;Name: Sadia Fatima"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#F5F5F5] flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-gold flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs font-bold interactive"
                    >
                      {saving ? (
                        <div className="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin" />
                      ) : (
                        <>
                          <Save size={14} />
                          Save Universal Setup
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
};

export default AdminFeesPage;
