import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  User,
  BookOpen,
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Award,
  Phone,
  Mail,
  ShieldAlert,
  LogOut,
  Edit2,
  UploadCloud,
  FileText,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MessageCircle,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../features/auth/AuthContext';
import { supabase } from '../../../lib/supabase';
import {
  completeStudentOnboarding,
  resolveGradeFeeConfig,
} from '../../../lib/db';
import { BOARDS, getGradesForBoard, BoardId, formatGradeDisplay } from '../../../lib/taxonomy';
import { validatePakistaniPhoneNumber } from '../../../lib/phoneValidation';
import { generateUniqueNumericStudentId } from '../../../lib/studentId';
import {
  uploadScholarshipProofFile,
  submitScholarshipApplication,
} from '../../../lib/scholarshipService';
import {
  getAcademicConfig,
  calculateConfigScholarship,
} from '../../../lib/academicConfig';
import { toast } from 'sonner';
import Logo from '../../ui/Logo';
import { LegalModal } from '../../ui/LegalModal';

interface StudentRegistrationV2Props {
  taxonomy: any;
  queryBoard?: string | null;
  queryGrade?: string | null;
}

export const StudentRegistrationV2: React.FC<StudentRegistrationV2Props> = ({
  taxonomy,
  queryBoard,
  queryGrade,
}) => {
  const { signOut, user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const config = useMemo(() => getAcademicConfig(), []);

  // ─── Step Management ───
  // 1: Personal info, 2: Board & Grade, 3: Stream & Subjects, 4: Review & Confirm
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Modal States ───
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showPlanCompareModal, setShowPlanCompareModal] = useState(false);
  const [showSbteModal, setShowSbteModal] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  // ─── Form State: Step 1 (Personal Info) ───
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [phoneTouched, setPhoneTouched] = useState<boolean>(false);
  const [isMinor, setIsMinor] = useState<boolean>(false);
  const [guardianName, setGuardianName] = useState<string>('');
  const [guardianPhone, setGuardianPhone] = useState<string>('');
  const [guardianEmail, setGuardianEmail] = useState<string>('');

  // ─── Form State: Step 2 (Board & Grade) ───
  const [selectedBoardId, setSelectedBoardId] = useState<BoardId>(
    (queryBoard as BoardId) || 'fbise'
  );
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // ─── Form State: Step 3 (Stream & Subjects) ───
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [planMode, setPlanMode] = useState<'all' | 'custom'>('all');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [expandedStreams, setExpandedStreams] = useState<Record<string, boolean>>({});

  // ─── Scholarship State ───
  const [applyScholarship, setApplyScholarship] = useState<boolean>(false);
  const [claimedMarks, setClaimedMarks] = useState<string>('');
  const [isImprovement, setIsImprovement] = useState<boolean>(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState<string>('');
  const [uploadingProof, setUploadingProof] = useState<boolean>(false);

  // ─── Form State: Step 4 (Consent) ───
  const [policyConsent, setPolicyConsent] = useState<boolean>(false);

  // ─── SBTE / Other Request Form State ───
  const [sbteBoardName, setSbteBoardName] = useState('');
  const [sbteProgramName, setSbteProgramName] = useState('');
  const [sbteSubjects, setSbteSubjects] = useState('');

  // ─── Draft Storage Key ───
  const draftKey = user?.id ? `scholario_reg_draft_${user.id}` : null;

  // ─── Generic name detection: prevent prefilling "SHS Virtual Academy" or generic accounts ───
  const isGenericName = (name: string): boolean => {
    if (!name || name.trim().length < 2) return true;
    const lower = name.trim().toLowerCase();
    return (
      lower.includes('shs') ||
      lower.includes('academy') ||
      lower.includes('virtual') ||
      lower.includes('admin') ||
      lower.includes('test') ||
      lower.includes('guest') ||
      lower.includes('student') ||
      lower.includes('user') ||
      lower.includes('support')
    );
  };

  // ─── Initialize Form & Restore Draft ───
  useEffect(() => {
    // 1. Initial name from Google account only if NOT generic
    const rawGoogleName =
      (user?.user_metadata?.full_name || user?.user_metadata?.name || '').trim();
    if (rawGoogleName && !isGenericName(rawGoogleName)) {
      setFullName(rawGoogleName);
    } else {
      setFullName('');
    }

    // 2. Load draft safely from localStorage
    if (draftKey) {
      try {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const draft = JSON.parse(savedDraft);
          if (draft.fullName) setFullName(draft.fullName);
          if (draft.phone) setPhone(draft.phone);
          if (draft.isMinor !== undefined) setIsMinor(draft.isMinor);
          if (draft.guardianName) setGuardianName(draft.guardianName);
          if (draft.guardianPhone) setGuardianPhone(draft.guardianPhone);
          if (draft.guardianEmail) setGuardianEmail(draft.guardianEmail);
          if (draft.selectedBoardId) setSelectedBoardId(draft.selectedBoardId);
          if (draft.selectedClassId) setSelectedClassId(draft.selectedClassId);
          if (draft.selectedStreamId) setSelectedStreamId(draft.selectedStreamId);
          if (draft.planMode) setPlanMode(draft.planMode);
          if (Array.isArray(draft.selectedSubjects)) setSelectedSubjects(draft.selectedSubjects);
          if (draft.applyScholarship !== undefined) setApplyScholarship(draft.applyScholarship);
          if (draft.claimedMarks) setClaimedMarks(draft.claimedMarks);
          if (draft.isImprovement !== undefined) setIsImprovement(draft.isImprovement);
        }
      } catch (err) {
        console.warn('[RegistrationV2] Draft parse fallback:', err);
      }
    }
  }, [user, draftKey]);

  // ─── Auto-save Draft on change (Safe Rule 4) ───
  useEffect(() => {
    if (!draftKey) return;
    try {
      const draftData = {
        fullName,
        phone,
        isMinor,
        guardianName,
        guardianPhone,
        guardianEmail,
        selectedBoardId,
        selectedClassId,
        selectedStreamId,
        planMode,
        selectedSubjects,
        applyScholarship,
        claimedMarks,
        isImprovement,
        updatedAt: Date.now(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    } catch {}
  }, [
    draftKey,
    fullName,
    phone,
    isMinor,
    guardianName,
    guardianPhone,
    guardianEmail,
    selectedBoardId,
    selectedClassId,
    selectedStreamId,
    planMode,
    selectedSubjects,
    applyScholarship,
    claimedMarks,
    isImprovement,
  ]);

  // ─── Available Grades for Selected Board ───
  const boardGrades = useMemo(() => {
    return getGradesForBoard(selectedBoardId);
  }, [selectedBoardId]);

  // ─── Initialize Class ID when Board changes ───
  useEffect(() => {
    if (!taxonomy || !taxonomy.classes) return;
    const boardClasses = taxonomy.classes.filter(
      (c: any) => c.board_id === selectedBoardId
    );

    if (boardClasses.length > 0) {
      if (queryGrade) {
        const match = boardClasses.find(
          (c: any) => String(c.grade).toLowerCase() === String(queryGrade).toLowerCase()
        );
        if (match) {
          setSelectedClassId(match.id);
          return;
        }
      }
      const existing = boardClasses.find((c: any) => c.id === selectedClassId);
      if (!existing) {
        setSelectedClassId(boardClasses[0].id);
      }
    } else {
      setSelectedClassId('');
    }
  }, [selectedBoardId, taxonomy, queryGrade, selectedClassId]);

  // ─── Available Streams for Selected Class ───
  const classStreams = useMemo(() => {
    if (!selectedClassId || !taxonomy || !taxonomy.classes) return [];
    const clsObj = taxonomy.classes.find((c: any) => c.id === selectedClassId);
    const gradeDef = boardGrades.find(
      (g) => String(g.grade) === String(clsObj?.grade)
    );

    if (gradeDef?.streams && gradeDef.streams.length > 0) {
      return gradeDef.streams;
    }

    if (taxonomy.streams) {
      const dbStreams = taxonomy.streams.filter(
        (s: any) => s.class_id === selectedClassId
      );
      if (dbStreams.length > 0) return dbStreams;
    }

    return [{ id: 'general', name: 'General', subjects: [] }];
  }, [selectedClassId, taxonomy, boardGrades]);

  // ─── Initialize Stream ID when classStreams change ───
  useEffect(() => {
    if (classStreams.length > 0) {
      const match = classStreams.find(
        (s: any) => s.id === selectedStreamId || s.name === selectedStreamId
      );
      if (!match) {
        const first = classStreams[0];
        setSelectedStreamId(first.id || first.name);
        setSelectedSubjects(first.subjects || []);
      }
    } else {
      setSelectedStreamId('General');
      setSelectedSubjects([]);
    }
  }, [classStreams, selectedStreamId]);

  // Update selected subjects when stream changes in 'all' mode
  const handleSelectStream = (streamId: string) => {
    setSelectedStreamId(streamId);
    const streamObj = classStreams.find(
      (s: any) => s.id === streamId || s.name === streamId
    );
    if (streamObj && Array.isArray(streamObj.subjects)) {
      setSelectedSubjects(streamObj.subjects);
    }
  };

  // ─── Phone Validation ───
  const phoneValidation = useMemo(() => {
    return validatePakistaniPhoneNumber(phone, false);
  }, [phone]);

  // ─── Fee Math from Single Source of Truth Config ───
  const currentGradeString = useMemo(() => {
    const cls = taxonomy?.classes?.find((c: any) => c.id === selectedClassId);
    return cls?.grade ? String(cls.grade) : '10';
  }, [taxonomy, selectedClassId]);

  const baseTuitionFee = useMemo(() => {
    if (selectedBoardId === 'ielts') {
      return config.feeGroups.ielts.allSubjectsFee;
    }
    if (selectedBoardId === 'alevel') {
      return planMode === 'all'
        ? config.feeGroups.alevel.allSubjectsFee
        : selectedSubjects.length * config.feeGroups.alevel.perSubjectFee;
    }
    if (selectedBoardId === 'olevel') {
      return planMode === 'all'
        ? config.feeGroups.olevel.allSubjectsFee
        : selectedSubjects.length * config.feeGroups.olevel.perSubjectFee;
    }
    const isFsc = ['11', '12'].includes(currentGradeString);
    if (isFsc) {
      return planMode === 'all'
        ? config.feeGroups.fsc.allSubjectsFee
        : selectedSubjects.length * config.feeGroups.fsc.perSubjectFee;
    }
    return planMode === 'all'
      ? config.feeGroups.matric.allSubjectsFee
      : selectedSubjects.length * config.feeGroups.matric.perSubjectFee;
  }, [selectedBoardId, planMode, selectedSubjects.length, currentGradeString, config]);

  // ─── Scholarship Math ───
  const scholarshipResult = useMemo(() => {
    if (!applyScholarship) {
      return { discountPercentage: 0, label: 'Standard Tuition', tier: null, isImprovement: false };
    }
    return calculateConfigScholarship(
      parseFloat(claimedMarks) || 0,
      isImprovement,
      config
    );
  }, [applyScholarship, claimedMarks, isImprovement, config]);

  const discountAmount = useMemo(() => {
    if (scholarshipResult.discountPercentage <= 0) return 0;
    return Math.round(baseTuitionFee * (scholarshipResult.discountPercentage / 100));
  }, [baseTuitionFee, scholarshipResult.discountPercentage]);

  const payableFee = useMemo(() => {
    return Math.max(0, baseTuitionFee - discountAmount);
  }, [baseTuitionFee, discountAmount]);

  // ─── Step Validation ───
  const step1Valid = useMemo(() => {
    return (
      fullName.trim().length >= 3 &&
      !isGenericName(fullName) &&
      phoneValidation.isValid &&
      (!isMinor || guardianEmail.trim().length > 3)
    );
  }, [fullName, phoneValidation.isValid, isMinor, guardianEmail]);

  const step2Valid = useMemo(() => {
    if (selectedBoardId === 'ielts') return true;
    return !!selectedClassId;
  }, [selectedBoardId, selectedClassId]);

  const step3Valid = useMemo(() => {
    if (selectedSubjects.length === 0) return false;
    return true;
  }, [selectedSubjects.length]);

  const step4Valid = useMemo(() => {
    return step1Valid && step2Valid && step3Valid && policyConsent;
  }, [step1Valid, step2Valid, step3Valid, policyConsent]);

  // Missing requirements list for Step 4 button disabled label
  const missingRequirements = useMemo(() => {
    const list: string[] = [];
    if (!fullName.trim() || isGenericName(fullName)) list.push('Full Legal Name');
    if (!phoneValidation.isValid) list.push('Valid 10-digit WhatsApp number');
    if (isMinor && !guardianEmail.trim()) list.push('Guardian email');
    if (selectedBoardId !== 'ielts' && !selectedClassId) list.push('Board & Grade');
    if (selectedSubjects.length === 0) list.push('At least one subject');
    if (!policyConsent) list.push('Terms & Privacy consent');
    return list;
  }, [fullName, phoneValidation.isValid, isMinor, guardianEmail, selectedBoardId, selectedClassId, selectedSubjects.length, policyConsent]);

  // ─── Navigation Handlers ───
  const handleNextStep = () => {
    setError(null);
    if (currentStep === 1 && !step1Valid) {
      setPhoneTouched(true);
      setError('Please provide your full legal name and a valid Pakistani mobile number.');
      return;
    }
    if (currentStep === 2 && !step2Valid) {
      setError('Please select an exam board and grade.');
      return;
    }
    if (currentStep === 3 && !step3Valid) {
      setError('Please select your stream and at least one subject.');
      return;
    }
    setCurrentStep((prev) => Math.min(4, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper UUID check
  const isUUID = (str?: string | null): boolean =>
    !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  // ─── Complete Registration (PROTECTED WRITE SEQUENCE) ───
  const handleCompleteRegistration = async () => {
    if (!user) return;
    if (!step4Valid) {
      setError('Please complete all required fields and accept the policies to continue.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const cleanClassId = isUUID(selectedClassId) ? selectedClassId : null;

      // 1. Resolve stream name and clean stream UUID
      let selectedStreamName: string | null = null;
      let cleanStreamId: string | null = null;

      const dbClassStreams = taxonomy ? taxonomy.streams?.filter((s: any) => s.class_id === selectedClassId) || [] : [];
      const selectedStreamObj = dbClassStreams.find(
        (s: any) => s.id === selectedStreamId || s.name.toLowerCase() === selectedStreamId?.toLowerCase()
      );

      if (selectedStreamObj) {
        selectedStreamName = selectedStreamObj.name;
        if (isUUID(selectedStreamObj.id)) cleanStreamId = selectedStreamObj.id;
      }

      if (!selectedStreamName) {
        const bGrades = getGradesForBoard(selectedBoardId);
        const clsObj = taxonomy?.classes?.find((c: any) => c.id === selectedClassId);
        const gradeDef = bGrades.find((g) => String(g.grade) === String(clsObj?.grade));
        const stDef = gradeDef?.streams.find(
          (st) => st.name.toLowerCase() === selectedStreamId?.toLowerCase()
        );
        selectedStreamName = stDef ? stDef.name : (selectedStreamId || 'General');
      }

      if (!cleanStreamId && cleanClassId && selectedStreamName) {
        try {
          const { data: dbStream } = await (supabase as any)
            .from('streams')
            .select('id')
            .eq('class_id', cleanClassId)
            .ilike('name', selectedStreamName)
            .maybeSingle();
          if ((dbStream as any)?.id && isUUID((dbStream as any).id)) {
            cleanStreamId = (dbStream as any).id;
          }
        } catch (streamErr) {
          console.warn('[RegisterV2] Stream DB lookup note:', streamErr);
        }
      }

      // 2. Insert or update Roster entry
      const emailLower = user.email?.toLowerCase() || '';
      const { data: existingRoster } = await (supabase as any)
        .from('roster')
        .select('id')
        .eq('email', emailLower)
        .maybeSingle();

      if (!existingRoster) {
        const numericStudentId = await generateUniqueNumericStudentId();
        const { error: rosterErr } = await (supabase as any)
          .from('roster')
          .insert({
            id: numericStudentId,
            email: emailLower,
            full_name: fullName.trim(),
            role: 'student',
            class_ids: cleanClassId ? [cleanClassId] : [],
            profile_id: user.id,
          });
        if (rosterErr) throw new Error(rosterErr.message || 'Roster creation failed.');
      } else {
        await (supabase as any)
          .from('roster')
          .update({
            profile_id: user.id,
            full_name: fullName.trim(),
            class_ids: cleanClassId ? [cleanClassId] : [],
          })
          .eq('id', existingRoster.id);
      }

      // 3. Upsert profiles table
      const { error: profileUpsertErr } = await (supabase as any)
        .from('profiles')
        .upsert(
          {
            id: user.id,
            role: 'student',
            full_name: fullName.trim(),
            avatar_url: user.user_metadata?.avatar_url ?? null,
            phone: phoneValidation.normalized,
            board_id: selectedBoardId,
            class_id: cleanClassId,
            stream_id: isUUID(cleanStreamId) ? cleanStreamId : null,
            stream: selectedStreamName,
            onboarding_complete: false,
          },
          { onConflict: 'id' }
        );

      if (profileUpsertErr) throw new Error(profileUpsertErr.message || 'Profile creation failed.');

      // 4. Update minor user metadata if applicable
      if (isMinor && guardianEmail.trim()) {
        try {
          await supabase.auth.updateUser({
            data: {
              parent_email: guardianEmail.trim(),
              guardian_name: guardianName.trim(),
              guardian_phone: guardianPhone.trim(),
              is_minor: true,
            },
          });
          localStorage.setItem(`scholario_parent_email_${user.id}`, guardianEmail.trim());
        } catch (metaErr) {
          console.warn('[RegisterV2] Parent email note:', metaErr);
        }
      }

      // 5. Complete Student Onboarding and enrollment
      await completeStudentOnboarding(
        user.id,
        selectedBoardId,
        cleanClassId || selectedClassId,
        isUUID(cleanStreamId) ? cleanStreamId : null,
        [],
        fullName.trim(),
        selectedSubjects,
        planMode
      );

      // 6. Submit scholarship application if requested
      if (applyScholarship && (claimedMarks || isImprovement)) {
        try {
          let finalDocUrl = proofUrl;
          if (!finalDocUrl && proofFile) {
            const uploadRes = await uploadScholarshipProofFile(proofFile);
            finalDocUrl = uploadRes.url;
            setProofUrl(uploadRes.url);
          }

          const clsObj = taxonomy?.classes?.find((c: any) => c.id === selectedClassId);
          const gradeName = clsObj?.grade ? String(clsObj.grade) : '10';
          const marksVal = parseFloat(claimedMarks);

          await submitScholarshipApplication({
            student_id: user.id,
            applicant_name: fullName.trim(),
            applicant_email: user.email || '',
            board: selectedBoardId,
            class_grade: gradeName,
            claimed_marks_percentage: isNaN(marksVal) ? (isImprovement ? 75 : 0) : marksVal,
            proof_document_url: finalDocUrl || '',
            admin_notes: isImprovement
              ? 'Applicant registered as Improvement Candidate (Manual Review / 50% discount)'
              : undefined,
          });
          toast.info('Scholarship application recorded. Verification will occur upon proof review.');
        } catch (schErr: any) {
          console.warn('[RegisterV2] Scholarship note:', schErr);
        }
      }

      // 7. Clear saved draft on success
      if (draftKey) {
        try {
          localStorage.removeItem(draftKey);
        } catch {}
      }

      // 8. Refresh profile and navigate directly to Checkout
      await refreshProfile();
      toast.success('Registration completed! Review your tuition dues to proceed.');
      navigate('/student/checkout', { replace: true });
    } catch (err: any) {
      console.error('[RegisterV2] Registration error:', err);
      setError(err?.message || 'Failed to complete registration. Please retry.');
      toast.error(err?.message || 'Failed to complete registration.');
    } finally {
      setSaving(false);
    }
  };

  // ─── SBTE WhatsApp Inquiry ───
  const handleSendSbteInquiry = () => {
    const text = `Hello Admissions Office, I would like to inquire about registering for a custom/diploma program with SHS Virtual Academy:\n• Board: ${sbteBoardName || 'SBTE / Other'}\n• Program: ${sbteProgramName || 'Technical / Professional Diploma'}\n• Desired Subjects: ${sbteSubjects || 'Multiple'}\n• Student Email: ${user?.email || 'N/A'}`;
    window.open(`https://wa.me/9230586969050?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    setShowSbteModal(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0D14] text-[#111111] dark:text-slate-100 flex flex-col font-sans">
      {/* ─── Top Header Bar ─── */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0D131F]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" variant="full" />
          <span className="hidden sm:inline-block text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-full">
            Session {config.sessionLabel}
          </span>
        </div>

        {/* User Info & Header Menu Sign Out */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
              {fullName || user?.email}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              New Student Setup
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowSignOutConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={14} />
            <span className="hidden xs:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* ─── Sticky 4-Step Progress Stepper ─── */}
      <div className="sticky top-[57px] z-20 bg-white dark:bg-[#0D131F] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-2.5 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          {[
            { num: 1, label: 'Personal Info' },
            { num: 2, label: 'Board & Grade' },
            { num: 3, label: 'Stream & Subjects' },
            { num: 4, label: 'Review & Confirm' },
          ].map((s) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num < currentStep) setCurrentStep(s.num);
                }}
                disabled={s.num > currentStep}
                className={`flex items-center gap-2 text-xs font-bold transition-all ${
                  isActive
                    ? 'text-amber-800 dark:text-amber-300'
                    : isCompleted
                    ? 'text-slate-700 dark:text-slate-300 cursor-pointer hover:underline'
                    : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                    isActive
                      ? 'bg-[#E6A900] text-slate-950 shadow-xs ring-2 ring-amber-400/30'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check size={12} /> : s.num}
                </span>
                <span className="hidden md:inline">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Main Content Container ─── */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col lg:flex-row gap-8 items-start">
        {/* ─── Left Panel: Form Steps ─── */}
        <div className="flex-1 w-full space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Action required</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* ════════════ STEP 1: PERSONAL INFO ════════════ */}
          {currentStep === 1 && (
            <section className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <User size={18} className="text-[#E6A900]" />
                  <span>Personal Information</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Your identity details for student marksheet records and live class rosters.
                </p>
              </div>

              {/* Full Legal Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center justify-between">
                  <span>Student Full Name *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Official academic name</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Ali Khan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    fullName && isGenericName(fullName)
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 focus:border-[#E6A900] focus:ring-2 focus:ring-[#E6A900]/20'
                  }`}
                />
                {fullName && isGenericName(fullName) && (
                  <p className="text-[11px] text-red-600 font-semibold">
                    Please enter your real full name instead of an institution or generic label.
                  </p>
                )}
              </div>

              {/* WhatsApp / Phone */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    WhatsApp Phone Number *
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">10 digits starting with 3</span>
                </div>
                <div className="relative flex items-center">
                  <span className="inline-flex items-center px-3.5 py-3 rounded-l-xl border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-sm font-bold select-none">
                    🇵🇰 +92
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="3XXXXXXXXX"
                    value={phone.replace(/^\+92\s?/, '')}
                    onChange={(e) => {
                      let digits = e.target.value.replace(/\D/g, '');
                      if (digits.startsWith('92')) digits = digits.slice(2);
                      if (digits.startsWith('0')) digits = digits.slice(1);
                      digits = digits.slice(0, 10);
                      setPhone(digits ? `+92 ${digits}` : '');
                      setPhoneTouched(true);
                    }}
                    className={`w-full px-4 py-3 rounded-r-xl border text-sm font-mono transition-all ${
                      phoneTouched && !phoneValidation.isValid
                        ? 'border-red-400 bg-red-50/20'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 focus:border-[#E6A900] focus:ring-2 focus:ring-[#E6A900]/20'
                    }`}
                  />
                  {phoneValidation.isValid && (
                    <CheckCircle2 size={16} className="absolute right-3.5 text-emerald-600 pointer-events-none" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MessageCircle size={12} className="text-emerald-600 shrink-0" />
                  <span>We send class updates here.</span>
                </p>
                {phoneTouched && !phoneValidation.isValid && (
                  <p className="text-[11px] text-red-600 font-semibold">{phoneValidation.error}</p>
                )}
              </div>

              {/* Locked Google Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center justify-between">
                  <span>Google Account Email</span>
                  <span className="text-[10px] text-slate-400 font-normal">From your Google account</span>
                </label>
                <div className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/80 text-sm font-mono text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>{user?.email || 'N/A'}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    Verified
                  </span>
                </div>
              </div>

              {/* Under 18 Guardian Toggle */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-amber-950 dark:text-amber-200 block">
                      Are you under 18 years of age?
                    </span>
                    <span className="text-[11px] text-amber-900/70 dark:text-amber-300/70 block">
                      Required for minors to receive parent updates and fee receipts.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isMinor}
                    onChange={(e) => setIsMinor(e.target.checked)}
                    className="w-5 h-5 rounded text-[#E6A900] focus:ring-[#E6A900] cursor-pointer"
                  />
                </label>

                {isMinor && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                        Guardian Email *
                      </label>
                      <input
                        type="email"
                        required={isMinor}
                        placeholder="parent@example.com"
                        value={guardianEmail}
                        onChange={(e) => setGuardianEmail(e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                        Guardian Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Tariq Mehmood"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                        Guardian Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="03XXXXXXXXX"
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ════════════ STEP 2: BOARD AND GRADE ════════════ */}
          {currentStep === 2 && (
            <section className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen size={18} className="text-[#E6A900]" />
                    <span>Select Exam Board &amp; Grade</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Choose your curriculum authority and current academic level.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPlanCompareModal(true)}
                  className="text-xs font-bold text-[#082B5C] dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle size={13} />
                  <span>Compare Plans &amp; Fees</span>
                </button>
              </div>

              {/* Grouped Board Grid */}
              <div className="space-y-4">
                {/* 1. Pakistani Boards */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-2">
                    Pakistani Boards (Matric &amp; Intermediate)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'fbise', label: 'Federal (FBISE)', tag: 'Recommended' },
                      { id: 'punjab', label: 'Punjab Boards' },
                      { id: 'sindh', label: 'Sindh Board' },
                      { id: 'kpk', label: 'KPK Board' },
                    ].map((b) => {
                      const isSel = selectedBoardId === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBoardId(b.id as BoardId)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative min-h-[52px] ${
                            isSel
                              ? 'border-[#E6A900] bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-[#E6A900]/30 shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-xs font-black text-slate-900 dark:text-white">{b.label}</div>
                          {b.tag && (
                            <span className="text-[9px] font-bold text-amber-800 dark:text-amber-300">
                              {b.tag}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Cambridge & Special */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-2">
                    International &amp; Language
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'olevel', label: 'Cambridge O Levels', sub: 'O1, O2, O3' },
                      { id: 'alevel', label: 'Cambridge A Levels', sub: 'AS & A2' },
                      { id: 'ielts', label: 'IELTS Prep', sub: 'Academic & GT' },
                    ].map((b) => {
                      const isSel = selectedBoardId === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBoardId(b.id as BoardId)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative min-h-[52px] ${
                            isSel
                              ? 'border-[#E6A900] bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-[#E6A900]/30 shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-xs font-black text-slate-900 dark:text-white">{b.label}</div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{b.sub}</span>
                        </button>
                      );
                    })}

                    {/* SBTE / Other Card */}
                    <button
                      type="button"
                      onClick={() => setShowSbteModal(true)}
                      className="p-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 hover:bg-amber-50/50 text-left transition-all cursor-pointer"
                    >
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200">Other / Diploma (SBTE)</div>
                      <span className="text-[10px] text-[#082B5C] dark:text-amber-400 font-bold">Inquire on WhatsApp →</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Adaptive Grade Selection */}
              {selectedBoardId !== 'ielts' && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide block">
                    Choose Class / Grade Level
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {boardGrades.map((g) => {
                      const clsMatch = taxonomy?.classes?.find(
                        (c: any) => c.board_id === selectedBoardId && String(c.grade) === String(g.grade)
                      );
                      const isSel = clsMatch && selectedClassId === clsMatch.id;

                      return (
                        <button
                          key={g.grade}
                          type="button"
                          onClick={() => {
                            if (clsMatch) setSelectedClassId(clsMatch.id);
                          }}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer min-h-[48px] flex flex-col justify-center items-center ${
                            isSel
                              ? 'border-[#E6A900] bg-amber-500 text-slate-950 font-black shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 font-bold'
                          }`}
                        >
                          <span className="text-xs">{formatGradeDisplay(String(g.grade), selectedBoardId)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ════════════ STEP 3: STREAM & SUBJECTS ════════════ */}
          {currentStep === 3 && (
            <section className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers size={18} className="text-[#E6A900]" />
                  <span>Choose Academic Stream &amp; Plan</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select your group and determine whether you want the full bundle or custom subjects.
                </p>
              </div>

              {/* Streams Radio Cards */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide block">
                  Academic Group
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {classStreams.map((st: any) => {
                    const stId = st.id || st.name;
                    const isSelected = selectedStreamId === stId;
                    const isExpanded = !!expandedStreams[stId];
                    const subs = st.subjects || [];

                    return (
                      <div
                        key={stId}
                        onClick={() => handleSelectStream(stId)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-[#E6A900] bg-amber-50/60 dark:bg-amber-950/30 ring-2 ring-[#E6A900]/30 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 hover:bg-slate-100/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-black text-slate-900 dark:text-white capitalize">
                            {st.name}
                          </span>
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              isSelected ? 'bg-[#E6A900] text-slate-950' : 'border border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span>{subs.length} Subjects included</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedStreams((prev) => ({ ...prev, [stId]: !prev[stId] }));
                            }}
                            className="text-[#082B5C] dark:text-amber-400 font-bold hover:underline flex items-center gap-0.5"
                          >
                            <span>{isExpanded ? 'Hide' : 'View subjects'}</span>
                            {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>
                        </div>

                        {/* Collapsed/Expanded Subjects */}
                        {isExpanded && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap gap-1 animate-in fade-in duration-100">
                            {subs.map((s: string) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Plan Mode Toggle: All Subjects vs Custom */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide block">
                  Tuition Plan
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPlanMode('all');
                      const currStream = classStreams.find((s: any) => s.id === selectedStreamId || s.name === selectedStreamId);
                      if (currStream?.subjects) setSelectedSubjects(currStream.subjects);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      planMode === 'all'
                        ? 'border-[#E6A900] bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-[#E6A900]/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-black text-slate-900 dark:text-white">All Subjects Package</div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
                      PKR {baseTuitionFee.toLocaleString()} /{config.billingLabel}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlanMode('custom')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      planMode === 'custom'
                        ? 'border-[#E6A900] bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-[#E6A900]/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-black text-slate-900 dark:text-white">Choose Specific Subjects</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Per subject customization
                    </div>
                  </button>
                </div>

                {/* Custom Subjects Checkboxes */}
                {planMode === 'custom' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 animate-in fade-in duration-150">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Select Your Subjects ({selectedSubjects.length} chosen):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(classStreams.find((s: any) => s.id === selectedStreamId || s.name === selectedStreamId)?.subjects || []).map(
                        (sub: string) => {
                          const isChecked = selectedSubjects.includes(sub);
                          return (
                            <label
                              key={sub}
                              className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                isChecked
                                  ? 'border-[#E6A900] bg-white dark:bg-slate-800 shadow-2xs font-bold'
                                  : 'border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSubjects((prev) => [...prev, sub]);
                                  } else {
                                    setSelectedSubjects((prev) => prev.filter((s) => s !== sub));
                                  }
                                }}
                                className="w-4 h-4 rounded text-[#E6A900] focus:ring-[#E6A900]"
                              />
                              <span className="text-xs">{sub}</span>
                            </label>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Scholarship Section */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 flex items-center justify-center shrink-0">
                      <Award size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-amber-950 dark:text-amber-100 block">
                        Apply for Merit Scholarship / Improvement Waiver
                      </span>
                      <span className="text-[11px] text-amber-900/80 dark:text-amber-300/80 block">
                        Get 20% to 60% fee waiver based on past marks or improvement exams.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={applyScholarship}
                    onChange={(e) => setApplyScholarship(e.target.checked)}
                    className="w-5 h-5 rounded text-[#E6A900] focus:ring-[#E6A900] cursor-pointer shrink-0"
                  />
                </label>

                {applyScholarship && (
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-3.5 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                          Previous Board Marks Percentage (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="e.g. 88.5"
                          value={claimedMarks}
                          onChange={(e) => setClaimedMarks(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isImprovement}
                            onChange={(e) => setIsImprovement(e.target.checked)}
                            className="w-4 h-4 rounded text-[#E6A900] focus:ring-[#E6A900]"
                          />
                          <span>Improvement Exam Candidate</span>
                        </label>
                      </div>
                    </div>

                    {/* Instant Feedback Chip */}
                    {scholarshipResult.discountPercentage > 0 && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-900 dark:text-emerald-200">
                          {scholarshipResult.label} ({scholarshipResult.discountPercentage}% Waiver)
                        </span>
                        <span className="font-extrabold text-emerald-800 dark:text-emerald-300">
                          Saves PKR {discountAmount.toLocaleString()} /{config.billingLabel}
                        </span>
                      </div>
                    )}

                    {/* Document Upload for Proof */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                        Upload Marksheet / Result Card Proof (Optional now, verified before unlock)
                      </label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setProofFile(file);
                        }}
                        className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-200 hover:file:bg-slate-300 cursor-pointer"
                      />
                      {proofFile && (
                        <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                          Attached: {proofFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ════════════ STEP 4: REVIEW & CONFIRM ════════════ */}
          {currentStep === 4 && (
            <section className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>Review &amp; Confirm Registration</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Verify your enrollment selections and agree to academy policies before submitting.
                </p>
              </div>

              {/* Review Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Personal Info Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">Personal Information</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-[11px] font-bold text-[#E6A900] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                    <div><strong>Name:</strong> {fullName}</div>
                    <div><strong>WhatsApp:</strong> {phoneValidation.normalized || phone}</div>
                    <div><strong>Google Email:</strong> {user?.email}</div>
                    {isMinor && guardianEmail && (
                      <div className="text-[11px] text-amber-800 dark:text-amber-300">
                        Guardian: {guardianEmail} {guardianPhone && `(${guardianPhone})`}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Academic Enrollment Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">Curriculum &amp; Plan</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-[11px] font-bold text-[#E6A900] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                    <div><strong>Board:</strong> {selectedBoardId.toUpperCase()}</div>
                    {selectedBoardId !== 'ielts' && (
                      <div><strong>Grade:</strong> {formatGradeDisplay(currentGradeString, selectedBoardId)}</div>
                    )}
                    <div><strong>Stream:</strong> {selectedStreamId}</div>
                    <div><strong>Plan:</strong> {planMode === 'all' ? 'All Subjects Package' : 'Custom Subjects'}</div>
                  </div>
                </div>
              </div>

              {/* Enrolled Subjects Pills */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Enrolled Subjects ({selectedSubjects.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSubjects.map((sub) => (
                    <span
                      key={sub}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-2.5">
                <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
                  <span>Base Tuition Fee</span>
                  <span className="font-bold">PKR {baseTuitionFee.toLocaleString()} /{config.billingLabel}</span>
                </div>
                {scholarshipResult.discountPercentage > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                    <span>Scholarship Waiver ({scholarshipResult.discountPercentage}%)</span>
                    <span>- PKR {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-amber-200/80 dark:border-amber-800/80 flex justify-between items-baseline">
                  <span className="text-sm font-black text-slate-900 dark:text-white">Payable Tuition Total</span>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-950 dark:text-white">
                      PKR {payableFee.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      /{config.billingLabel} (manual payment via Easypaisa / JazzCash)
                    </span>
                  </div>
                </div>
              </div>

              {/* Single Consent Checkbox with Sheet links */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={policyConsent}
                    onChange={(e) => setPolicyConsent(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded text-[#E6A900] focus:ring-[#E6A900] cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    I have reviewed my details and explicitly agree to the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setLegalModalType('terms');
                      }}
                      className="font-bold text-[#E6A900] underline cursor-pointer"
                    >
                      Terms of Service
                    </button>
                    ,{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setLegalModalType('privacy');
                      }}
                      className="font-bold text-[#E6A900] underline cursor-pointer"
                    >
                      Privacy Policy
                    </button>
                    , and Refund Guidelines of SHS Virtual Academy.
                  </span>
                </label>
              </div>

              {/* Missing Requirements Label if not ready */}
              {missingRequirements.length > 0 && (
                <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-2.5 rounded-xl">
                  <strong>Please complete before continuing:</strong> {missingRequirements.join(' • ')}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={saving}
                  className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleCompleteRegistration}
                  disabled={!step4Valid || saving}
                  className="flex-1 sm:flex-initial px-8 py-3.5 rounded-2xl bg-[#082B5C] hover:bg-[#0c3b7a] text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span>Creating Profile…</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </section>
          )}

          {/* Stepper Buttons (Steps 1, 2, 3) */}
          {currentStep < 4 && (
            <div className="flex items-center justify-between gap-3 pt-2">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                >
                  <ArrowLeft size={14} />
                  <span>Previous</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={handleNextStep}
                className="px-7 py-3 rounded-2xl bg-[#082B5C] hover:bg-[#0c3b7a] text-white text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ─── Right Panel (Desktop Sticky Summary Card) ─── */}
        <aside className="hidden lg:block w-[340px] sticky top-[125px] shrink-0">
          <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <span className="text-xs font-black uppercase text-slate-900 dark:text-white">
                Registration Summary
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Step {currentStep} of 4
              </span>
            </div>

            <div className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Board:</span>
                <span className="font-bold text-slate-900 dark:text-white uppercase">{selectedBoardId}</span>
              </div>
              {selectedBoardId !== 'ielts' && (
                <div className="flex justify-between">
                  <span>Grade:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatGradeDisplay(currentGradeString, selectedBoardId)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Plan Mode:</span>
                <span className="font-bold text-slate-900 dark:text-white capitalize">{planMode}</span>
              </div>
              <div className="flex justify-between">
                <span>Subjects:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedSubjects.length} selected</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Standard Fee</span>
                <span>PKR {baseTuitionFee.toLocaleString()}</span>
              </div>
              {scholarshipResult.discountPercentage > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 font-bold">
                  <span>{scholarshipResult.label}</span>
                  <span>- PKR {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-xs font-black text-slate-900 dark:text-white">Payable</span>
                <span className="text-base font-black text-slate-950 dark:text-white">
                  PKR {payableFee.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/{config.billingLabel}</span>
                </span>
              </div>
            </div>

            {/* Quick Guarantee */}
            <div className="text-[11px] text-slate-500 leading-relaxed">
              🔒 <strong>Safe Enrollment:</strong> Your information is saved automatically as a draft. You can pay via mobile wallet after submitting.
            </div>
          </div>
        </aside>
      </main>

      {/* ─── Mobile Sticky Bottom Bar ─── */}
      <div className="lg:hidden sticky bottom-0 z-20 bg-white/95 dark:bg-[#0D131F]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3.5 shadow-lg flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">
            Total Payable
          </span>
          <span className="text-sm font-black text-slate-950 dark:text-white">
            PKR {payableFee.toLocaleString()}
            <span className="text-[10px] font-normal text-slate-500"> /{config.billingLabel}</span>
          </span>
        </div>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="px-6 py-2.5 rounded-xl bg-[#082B5C] text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[44px]"
          >
            <span>Continue</span>
            <ArrowRight size={13} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCompleteRegistration}
            disabled={!step4Valid || saving}
            className="px-6 py-2.5 rounded-xl bg-[#082B5C] text-white text-xs font-black shadow-xs flex items-center gap-1.5 disabled:opacity-40 cursor-pointer min-h-[44px]"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <span>Complete</span>}
          </button>
        )}
      </div>

      {/* ─── Sign Out Confirmation Modal ─── */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Sign Out of Setup?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Your registration progress has been saved as a draft. You can sign back in with your Google account anytime to resume.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Stay here
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowSignOutConfirm(false);
                  await signOut();
                  navigate('/login');
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Plan Compare Bottom Sheet / Modal ─── */}
      {showPlanCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Academic Plans &amp; Fee Comparison
              </h3>
              <button
                type="button"
                onClick={() => setShowPlanCompareModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {Object.values(config.feeGroups).map((fg) => (
                <div
                  key={fg.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{fg.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{fg.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      PKR {fg.allSubjectsFee.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500">/{config.billingLabel}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowPlanCompareModal(false)}
                className="px-5 py-2 rounded-xl bg-[#082B5C] text-white text-xs font-bold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SBTE / Other Inquiry Modal ─── */}
      {showSbteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Technical Diploma &amp; SBTE Inquiry
              </h3>
              <button
                type="button"
                onClick={() => setShowSbteModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Technical board diplomas (Sindh Board of Technical Education, PBTE, etc.) are reviewed by the admissions committee for tailored teacher assignment:
            </p>

            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                  Board or Institution Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sindh Board of Technical Education (SBTE)"
                  value={sbteBoardName}
                  onChange={(e) => setSbteBoardName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                  Diploma / Program Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. DAE Electrical, CIT, or Commerce"
                  value={sbteProgramName}
                  onChange={(e) => setSbteProgramName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                  Desired Subjects
                </label>
                <input
                  type="text"
                  placeholder="e.g. Applied Math, Physics, Electrical Tech"
                  value={sbteSubjects}
                  onChange={(e) => setSbteSubjects(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSbteModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendSbteInquiry}
                className="px-5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <MessageCircle size={14} />
                <span>Send via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Legal Policy Modal (Opens in sheet so form is not lost) ─── */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
};

export default StudentRegistrationV2;
