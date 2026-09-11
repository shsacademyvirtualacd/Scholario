import React, { useState, useEffect } from 'react';
import { ShieldAlert, LogOut, GraduationCap, ArrowRight, Loader2, Sparkles, BookOpen, CheckCircle2, User, DollarSign, Layers, AlertCircle, Check, BookMarked } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { getTaxonomy, completeStudentOnboarding, resolveGradeFeeConfig, requestAccountTermination } from '../../lib/db';
import Logo from '../../components/ui/Logo';
import { BOARDS, getGradesForBoard, getBoardDef, getDefaultPrice, BoardId } from '../../lib/taxonomy';
import { toast } from 'sonner';
import { useMobile } from '../../hooks/useMobile';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { validatePakistaniPhoneNumber, PAKISTANI_PHONE_ERROR } from '../../lib/phoneValidation';
import { generateUniqueNumericStudentId } from '../../lib/studentId';
import {
  getSubjectPricingSettings,
  getCachedSubjectPricingSettings,
  calculateSubjectEnrollmentFee,
  SubjectPricingSettings,
} from '../../lib/subjectEnrollmentService';
import PlanComparisonPage from './PlanComparisonPage';

export const UnregisteredPage: React.FC = () => {
  const { signOut, user, profile, refreshProfile, suspended, isBillingSuspended, proceedToPaymentCheckout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useMobile();

  const queryBoard = searchParams.get('board');
  const queryGrade = searchParams.get('grade');

  const [taxonomy, setTaxonomy] = useState<any>(null);

  // Form Fields
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '+92 ');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [suggestedFix, setSuggestedFix] = useState<string | null>(null);

  // Real-time phone input handler
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    setPhoneTouched(true);

    if (val.trim() && val.trim() !== '+92') {
      const res = validatePakistaniPhoneNumber(val, true);
      if (!res.isValid) {
        setPhoneError(res.error);
        setSuggestedFix(res.suggestedFix || null);
      } else {
        setPhoneError(null);
        setSuggestedFix(null);
      }
    } else if (!val.trim()) {
      setPhoneError('Phone number is required.');
      setSuggestedFix(null);
    } else {
      setPhoneError(PAKISTANI_PHONE_ERROR);
      setSuggestedFix(null);
    }
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    const res = validatePakistaniPhoneNumber(phone, true);
    if (!res.isValid) {
      setPhoneError(res.error);
      setSuggestedFix(res.suggestedFix || null);
    } else {
      setPhoneError(null);
      setSuggestedFix(null);
    }
  };

  const isPhoneValid = validatePakistaniPhoneNumber(phone, true).isValid;
  const initialBoard = (queryBoard && BOARDS.some((b) => b.id.toLowerCase() === queryBoard.toLowerCase())
    ? queryBoard.toLowerCase()
    : 'fbise') as BoardId;
  const [selectedBoardId, setSelectedBoardId] = useState<BoardId>(initialBoard);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [baseClassFee, setBaseClassFee] = useState<number>(3000);
  const [enrollmentMode, setEnrollmentMode] = useState<'all' | 'custom'>(
    initialBoard === 'alevel' || initialBoard === 'olevel' ? 'custom' : 'all'
  );
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [pricingSettings, setPricingSettings] = useState<SubjectPricingSettings>(getCachedSubjectPricingSettings());
  const [showPlanComparison, setShowPlanComparison] = useState<boolean>(false);

  // Automatically enforce custom per-subject enrollment for Cambridge A/O Levels
  useEffect(() => {
    if (selectedBoardId === 'alevel' || selectedBoardId === 'olevel') {
      setEnrollmentMode('custom');
    }
  }, [selectedBoardId]);

  const [saving, setSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terminationStep, setTerminationStep] = useState<'idle' | 'confirm' | 'goodbye'>('idle');

  // Load subject fee pricing settings
  useEffect(() => {
    getSubjectPricingSettings()
      .then((s) => setPricingSettings(s))
      .catch(console.warn);
  }, []);

  // Fetch taxonomy and set initial classes
  useEffect(() => {
    getTaxonomy()
      .then((tax) => {
        setTaxonomy(tax);
        if (selectedBoardId === 'ielts') {
          const ieltsClass = tax.classes.find((c: any) => c.board_id === 'ielts');
          if (ieltsClass) {
            setSelectedClassId(ieltsClass.id);
            setSelectedStreamId('IELTS Preparation');
          }
        } else {
          // Default class to selected board's target grade or first class
          const boardClasses = tax.classes.filter((c: any) => c.board_id === selectedBoardId);
          const matchingClass = queryGrade
            ? boardClasses.find((c: any) => String(c.grade) === String(queryGrade))
            : boardClasses[0];

          if (matchingClass) {
            setSelectedClassId(matchingClass.id);
          } else if (boardClasses.length > 0) {
            setSelectedClassId(boardClasses[0].id);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load taxonomy:', err);
      });
  }, []);

  // Helper to resolve available subjects for selected stream
  const getAvailableSubjects = (): string[] => {
    if (selectedBoardId === 'ielts') {
      return ['IELTS Listening', 'IELTS Reading', 'IELTS Writing', 'IELTS Speaking'];
    }
    if (!selectedClassId || !selectedStreamId || !taxonomy) return [];

    const selectedClassObj = taxonomy.classes.find((c: any) => c.id === selectedClassId);
    let streamsForClass: any[] = taxonomy.streams.filter((s: any) => s.class_id === selectedClassId);
    if (streamsForClass.length === 0 && selectedClassObj) {
      const boardGrades = getGradesForBoard(selectedBoardId);
      const gradeDef = boardGrades.find((g) => String(g.grade) === String(selectedClassObj.grade));
      if (gradeDef) {
        streamsForClass = gradeDef.streams.map((st) => ({
          id: st.name,
          class_id: selectedClassObj.id,
          name: st.name,
          subjects: st.subjects,
        }));
      }
    }

    const s = streamsForClass.find(
      (st: any) => st.id === selectedStreamId || st.name.toLowerCase() === selectedStreamId?.toLowerCase()
    );
    if (!s) return [];

    let streamSubjects: string[] = [];
    if (Array.isArray(s.subjects) && s.subjects.length > 0) {
      streamSubjects = s.subjects;
    } else if (taxonomy.streamSubjects) {
      streamSubjects = taxonomy.streamSubjects
        .filter((ss: any) => ss.stream_id === s.id)
        .map((ss: any) => taxonomy.subjects.find((sub: any) => sub.id === ss.subject_id)?.name)
        .filter(Boolean);
    }
    if (streamSubjects.length === 0 && selectedClassObj) {
      const boardGrades = getGradesForBoard(selectedBoardId);
      const gradeDef = boardGrades.find((g) => String(g.grade) === String(selectedClassObj.grade));
      const stDef = gradeDef?.streams.find((st) => st.name.toLowerCase() === s.name?.toLowerCase());
      if (stDef) streamSubjects = stDef.subjects;
    }
    return streamSubjects;
  };

  // When board changes, ensure selectedClassId moves to the corresponding class in that board
  useEffect(() => {
    if (!taxonomy) return;
    if (selectedBoardId === 'ielts') {
      const ieltsClass = taxonomy.classes.find((c: any) => c.board_id === 'ielts');
      if (ieltsClass) {
        setSelectedClassId(ieltsClass.id);
        setSelectedStreamId('IELTS Preparation');
      }
    } else {
      const currentClass = taxonomy.classes.find((c: any) => c.id === selectedClassId);
      const targetGrade = currentClass?.grade || queryGrade || '10';
      const boardClasses = taxonomy.classes.filter((c: any) => c.board_id === selectedBoardId);
      const matchingClass = boardClasses.find((c: any) => String(c.grade) === String(targetGrade)) || boardClasses[0];

      if (matchingClass && matchingClass.id !== selectedClassId) {
        setSelectedClassId(matchingClass.id);
        setSelectedStreamId(null);
      }
    }
  }, [selectedBoardId, taxonomy]);

  const refreshLivePrice = () => {
    if (selectedBoardId === 'ielts') {
      const cls = taxonomy?.classes?.find((c: any) => c.board_id === 'ielts') || { id: 'ielts-IELTS', grade: 'IELTS' };
      resolveGradeFeeConfig('IELTS', cls.id, 'ielts')
        .then((cfg) => {
          const val = (cfg && typeof cfg.amount === 'number' && cfg.amount > 0) ? cfg.amount : 5000;
          setBaseClassFee(val);
        })
        .catch(() => {
          setBaseClassFee(5000);
        });
      return;
    }

    if (selectedClassId && taxonomy) {
      const cls = taxonomy.classes.find((c: any) => c.id === selectedClassId);
      if (cls) {
        resolveGradeFeeConfig(cls.grade || '10', cls.id, selectedBoardId)
          .then((cfg) => {
            const val = (cfg && typeof cfg.amount === 'number' && cfg.amount > 0)
              ? cfg.amount
              : (cls.grade ? getDefaultPrice(cls.grade, selectedBoardId) : 3000);
            setBaseClassFee(val);
          })
          .catch(() => {
            const val = cls.grade ? getDefaultPrice(cls.grade, selectedBoardId) : 3000;
            setBaseClassFee(val);
          });
      }
    }
  };

  // Reset stream and calculate live price when class or board changes
  useEffect(() => {
    if (selectedBoardId === 'ielts') {
      setSelectedStreamId('IELTS Preparation');
    } else {
      setSelectedStreamId(null);
    }
    refreshLivePrice();
  }, [selectedClassId, selectedBoardId, taxonomy]);

  // Realtime subscription to fee_configs updates
  useRealtimeTable({
    table: 'fee_configs',
    onInsert: refreshLivePrice,
    onUpdate: refreshLivePrice,
    onDelete: refreshLivePrice,
  });

  // Redirect if profile already exists and is fully set up
  useEffect(() => {
    if (profile && profile.onboarding_complete) {
      if (profile.role === 'admin') navigate('/admin', { replace: true });
      else if (profile.role === 'teacher') navigate('/teacher', { replace: true });
      else navigate('/student/checkout', { replace: true });
    }
  }, [profile, navigate]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/login', { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleTerminateAccount = async () => {
    if (!user) return;
    try {
      setSaving(true);
      await requestAccountTermination(user.id);
      setTerminationStep('goodbye');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to request account termination.');
      setSaving(false);
    }
  };

  const isUUID = (str?: string | null): boolean =>
    !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!fullName.trim() || !phone.trim() || !selectedClassId) {
      setError('Please fill out all required fields.');
      return;
    }

    // Strict Pakistani Phone Validation (+92 followed by 10 digits starting with 3)
    const phoneValidation = validatePakistaniPhoneNumber(phone, true);
    if (!phoneValidation.isValid) {
      setPhoneTouched(true);
      setPhoneError(phoneValidation.error);
      setSuggestedFix(phoneValidation.suggestedFix || null);
      setError(phoneValidation.error);
      toast.error(phoneValidation.error);
      return;
    }

    if (!selectedStreamId) {
      setError('Please select an academic stream.');
      return;
    }

    const isCambridge = selectedBoardId === 'alevel' || selectedBoardId === 'olevel';
    const effectiveEnrollmentMode = isCambridge ? 'custom' : enrollmentMode;
    const availableSubs = getAvailableSubjects();
    const finalSubjects = effectiveEnrollmentMode === 'all' ? availableSubs : selectedSubjects;

    if (effectiveEnrollmentMode === 'custom' && finalSubjects.length === 0) {
      setError(isCambridge ? 'Please select at least one Cambridge subject to enroll.' : 'Please select at least one subject to enroll, or choose All Subjects.');
      toast.error('Please select at least one subject.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const cleanClassId = isUUID(selectedClassId) ? selectedClassId : null;

      // 1. Resolve stream name and clean stream UUID separately (never concatenated)
      let selectedStreamName: string | null = null;
      let cleanStreamId: string | null = null;

      const classStreams = taxonomy ? taxonomy.streams.filter((s: any) => s.class_id === selectedClassId) : [];
      const selectedStreamObj = classStreams.find(
        (s: any) => s.id === selectedStreamId || s.name.toLowerCase() === selectedStreamId?.toLowerCase()
      );

      if (selectedStreamObj) {
        selectedStreamName = selectedStreamObj.name;
        if (isUUID(selectedStreamObj.id)) {
          cleanStreamId = selectedStreamObj.id;
        }
      }

      if (!selectedStreamName) {
        const boardGrades = getGradesForBoard(selectedBoardId);
        const clsObj = taxonomy?.classes?.find((c: any) => c.id === selectedClassId);
        const gradeDef = boardGrades.find((g) => String(g.grade) === String(clsObj?.grade));
        const stDef = gradeDef?.streams.find(
          (st) => st.name.toLowerCase() === selectedStreamId?.toLowerCase()
        );
        selectedStreamName = stDef ? stDef.name : (selectedStreamId || 'General');
      }

      // If cleanStreamId is still null, look up matching stream UUID in DB for this class
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
          console.warn('[Register] Stream DB lookup notice:', streamErr);
        }
      }

      // 2. Check or insert Roster entry linked to student profile
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
            profile_id: user.id
          });

        if (rosterErr) {
          console.error('Roster insert error:', rosterErr);
          throw new Error(rosterErr.message || 'Roster creation failed.');
        }
      } else {
        await (supabase as any)
          .from('roster')
          .update({
            profile_id: user.id,
            full_name: fullName.trim(),
            class_ids: cleanClassId ? [cleanClassId] : []
          })
          .eq('id', existingRoster.id);
      }

      // 3. Ensure student profile exists in profiles table with clean columns
      const { error: profileUpsertErr } = await (supabase as any)
        .from('profiles')
        .upsert({
          id: user.id,
          role: 'student',
          full_name: fullName.trim(),
          avatar_url: user.user_metadata?.avatar_url ?? null,
          phone: phoneValidation.normalized,
          board_id: selectedBoardId,
          class_id: cleanClassId,
          stream_id: isUUID(cleanStreamId) ? cleanStreamId : null,
          stream: selectedStreamName,
          onboarding_complete: false
        }, { onConflict: 'id' });

      if (profileUpsertErr) {
        console.error('Profile upsert error:', profileUpsertErr);
        throw new Error(profileUpsertErr.message || 'Student profile creation failed.');
      }

      // 4. Perform complete onboarding and enrollment assignment with clean UUIDs
      await completeStudentOnboarding(
        user.id,
        selectedBoardId,
        cleanClassId || selectedClassId,
        isUUID(cleanStreamId) ? cleanStreamId : null,
        [],
        fullName.trim(),
        finalSubjects,
        effectiveEnrollmentMode
      );

      // 5. Reload profile context
      await refreshProfile();

      // 6. Route directly to checkout
      navigate('/student/checkout', { replace: true });
      toast.success('Registration completed successfully.');

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to complete registration.');
      toast.error(err.message || 'Failed to complete registration.');
    } finally {
      setSaving(false);
    }
  };

  if (!taxonomy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#F4C430]" />
          <span className="text-xs text-[#737373] font-bold">Loading educational structure...</span>
        </div>
      </div>
    );
  }

  const currentBoardDef = getBoardDef(selectedBoardId);
  let classesForBoard = taxonomy.classes.filter((c: any) => c.board_id === selectedBoardId);
  if (classesForBoard.length === 0) {
    const boardGrades = getGradesForBoard(selectedBoardId);
    classesForBoard = boardGrades.map((g) => ({
      id: `${selectedBoardId}-${g.grade}`,
      board_id: selectedBoardId,
      grade: g.grade,
      display_name: g.displayName,
      board: { id: selectedBoardId, name: currentBoardDef.name },
    })) as any[];
  }
  const selectedClassObj = taxonomy.classes.find((c: any) => c.id === selectedClassId) || classesForBoard.find((c: any) => c.id === selectedClassId);

  // Extract streams for selected class, with seamless fallback to taxonomy definitions
  let streamsForClass: any[] = taxonomy.streams.filter((s: any) => s.class_id === selectedClassId);
  if (streamsForClass.length === 0 && selectedClassObj) {
    const boardGrades = getGradesForBoard(selectedBoardId);
    const gradeDef = boardGrades.find((g) => String(g.grade) === String(selectedClassObj.grade));
    if (gradeDef) {
      streamsForClass = gradeDef.streams.map((st) => ({
        id: st.name,
        class_id: selectedClassObj.id,
        name: st.name,
        subjects: st.subjects,
      }));
    }
  }

  if (showPlanComparison) {
    const targetGrade = selectedClassObj?.grade || queryGrade || '10';
    const targetStream = streamsForClass.find(
      (st: any) => st.id === selectedStreamId || st.name.toLowerCase() === selectedStreamId?.toLowerCase()
    ) || streamsForClass[0];
    return (
      <PlanComparisonPage
        boardId={selectedBoardId}
        classId={selectedClassId}
        grade={String(targetGrade)}
        streamId={selectedStreamId}
        streamName={targetStream?.name || selectedStreamId || 'General'}
        availableSubjects={getAvailableSubjects()}
        initialSelectedSubjects={selectedSubjects}
        initialEnrollmentMode={enrollmentMode}
        baseClassFee={baseClassFee}
        perSubjectFee={pricingSettings.per_subject_fee}
        onSelectPlan={(mode, subs) => {
          setEnrollmentMode(mode);
          setSelectedSubjects(subs);
          setShowPlanComparison(false);
        }}
        onBack={() => setShowPlanComparison(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col page-transition justify-center items-center px-4 py-12">
      <div className="w-full max-w-[620px]">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Logo size="md" variant="full" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-[#E5E5E5] p-6 sm:p-8 shadow-sm space-y-6">
          {isBillingSuspended ? (
            <div className="space-y-6 text-center">
              {terminationStep === 'idle' && (
                <>
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <DollarSign size={32} />
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-xl font-extrabold text-[#111111] tracking-tight">
                      Monthly Billing Lockout
                    </h1>
                    <p className="text-sm text-[#737373] leading-relaxed">
                      The account associated with <span className="font-bold text-[#111111]">{user?.email || 'your email'}</span> has been temporarily locked due to unpaid tuition dues.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-4 border-t border-[#F5F5F5]">
                    <button
                      onClick={() => proceedToPaymentCheckout && proceedToPaymentCheckout()}
                      className="btn bg-[#F4C430] hover:bg-[#eab308] text-[#111111] w-full flex items-center justify-center gap-2 py-3 font-extrabold rounded-xl shadow-sm text-sm transition-all hover:scale-[1.01] interactive"
                    >
                      Proceed to Payment Details
                      <ArrowRight size={16} />
                    </button>

                    <button
                      onClick={() => setTerminationStep('confirm')}
                      className="btn btn-ghost w-full flex items-center justify-center gap-2 py-2.5 text-xs text-red-600 hover:bg-red-50 font-semibold rounded-xl transition-colors interactive"
                    >
                      Request Enrollment Termination
                    </button>
                  </div>
                </>
              )}

              {terminationStep === 'confirm' && (
                <>
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                    <ShieldAlert size={32} />
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-xl font-extrabold text-[#111111] tracking-tight">
                      Confirm Account Termination
                    </h1>
                    <p className="text-sm text-[#737373] leading-relaxed">
                      Are you sure you want to terminate your enrollment? All active dashboard access, grade logs, class schedule tokens, and course notes will be scheduled for permanent removal.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-red-50/50 border border-red-200/50 text-left text-xs text-red-900 leading-relaxed font-medium">
                    ⚠️ <strong>Data Loss Notice:</strong> This action initiates a secure, administrative termination queue. Once confirmed, you will be signed out and unable to enter the portal.
                  </div>

                  <div className="flex flex-col gap-3 pt-4 border-t border-[#F5F5F5]">
                    <button
                      onClick={handleTerminateAccount}
                      disabled={saving}
                      className="btn bg-red-600 hover:bg-red-700 text-white w-full flex items-center justify-center gap-2 py-3 font-extrabold rounded-xl shadow-sm text-sm transition-all hover:scale-[1.01] disabled:opacity-50 interactive"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                      Yes, Terminate My Account
                    </button>

                    <button
                      onClick={() => setTerminationStep('idle')}
                      disabled={saving}
                      className="btn btn-ghost w-full flex items-center justify-center gap-2 py-2.5 text-xs text-[#737373] hover:text-[#111111] font-semibold rounded-xl transition-colors interactive"
                    >
                      Cancel and Go Back
                    </button>
                  </div>
                </>
              )}

              {terminationStep === 'goodbye' && (
                <>
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={32} />
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-xl font-extrabold text-[#111111] tracking-tight">
                      Request Submitted Successfully
                    </h1>
                    <p className="text-sm text-[#737373] leading-relaxed">
                      Thank you for studying with Scholario. Your account termination request has been registered and sent to our administration team for processing.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-4 border-t border-[#F5F5F5]">
                    <button
                      disabled={isSigningOut}
                      onClick={handleSignOut}
                      className="btn bg-[#111111] hover:bg-[#262626] disabled:opacity-50 text-white w-full flex items-center justify-center gap-2 py-3 font-extrabold rounded-xl shadow-sm text-sm transition-all hover:scale-[1.01] interactive"
                    >
                      {isSigningOut && <Loader2 size={16} className="animate-spin shrink-0" />}
                      Exit Platform
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : suspended ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                <ShieldAlert size={32} />
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-extrabold text-[#111111] tracking-tight">
                  Access Suspended
                </h1>
                <p className="text-sm text-[#737373] leading-relaxed">
                  The account associated with <span className="font-bold text-[#111111]">{user?.email || 'your email'}</span> has been temporarily suspended by Scholario Administration.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-red-50/50 border border-red-200/50 text-left space-y-2">
                <p className="text-xs text-red-900 leading-relaxed">
                  If you have pending tuition fees or believe this suspension is a mistake, please reach out to support immediately to restore access.
                </p>
              </div>

              <div className="pt-2 border-t border-[#F5F5F5]">
                <button
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  className="btn btn-ghost w-full flex items-center justify-center gap-2 py-2.5 text-xs text-[#737373] hover:text-[#111111] font-semibold disabled:opacity-50 interactive"
                >
                  {isSigningOut ? (
                    <Loader2 size={14} className="animate-spin shrink-0" />
                  ) : (
                    <LogOut size={14} className="shrink-0" />
                  )}
                  <span>{isSigningOut ? 'Signing Out...' : 'Sign Out & Switch Account'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-[#F5F5F5] pb-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-[#F4C430]" />
                    <h1 className="text-xl font-black text-[#111111] tracking-tight">Student Registration</h1>
                  </div>
                  <span className="text-xs font-bold text-[#111111] bg-[#F5F5F5] px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0">
                    {currentBoardDef.shortName}
                  </span>
                </div>
                <p className="text-xs text-[#737373]">
                  Select your board, academic grade, and learning stream to customize your curriculum and proceed to tuition checkout.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#fecaca] text-xs text-[#dc2626] font-semibold flex items-center gap-2">
                  <ShieldAlert size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-6 text-left">
                {/* Section 1: Personal Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#111111] uppercase tracking-wider">
                    <User size={14} className="text-[#F4C430]" />
                    <span>Step 1: Personal Information</span>
                  </div>

                  <div className={isMobile ? 'flex flex-col gap-3' : 'grid grid-cols-2 gap-3'}>
                    <div>
                      <label className="label text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wide mb-1 block">Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="input text-xs py-2.5 bg-white font-semibold"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="registration-phone" className="label text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wide">
                          WhatsApp / Phone <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] text-[#A3A3A3] font-medium flex items-center gap-1">
                          <span className="text-xs">🇵🇰</span> +92 3XXXXXXXXX
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          id="registration-phone"
                          type="tel"
                          required
                          value={phone}
                          onChange={handlePhoneChange}
                          onBlur={handlePhoneBlur}
                          placeholder="+92 3058969050"
                          className={`input text-xs py-2.5 bg-white font-semibold w-full pr-8 transition-colors ${
                            phoneError && phoneTouched
                              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                              : isPhoneValid && phone.trim() !== '' && phone.trim() !== '+92'
                              ? 'border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
                              : 'border-[#E5E5E5]'
                          }`}
                        />
                        {isPhoneValid && phone.trim() !== '' && phone.trim() !== '+92' && (
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                      </div>

                      {/* Inline Error Message */}
                      {phoneError && phoneTouched && (
                        <div id="registration-phone-error" className="mt-1.5 p-2 rounded-lg bg-red-50 border border-red-200 text-left">
                          <div className="flex items-start gap-1.5">
                            <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-[11px] text-red-600 font-semibold leading-tight">
                                {phoneError}
                              </p>
                              {suggestedFix && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPhone(suggestedFix);
                                    setPhoneError(null);
                                    setSuggestedFix(null);
                                  }}
                                  className="text-[10px] text-indigo-600 font-bold underline mt-1 block hover:text-indigo-800 cursor-pointer"
                                >
                                  Click to auto-format as: {suggestedFix}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="label text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wide mb-1 block">Google Account Email</label>
                    <input
                      type="text"
                      value={user?.email || ''}
                      disabled
                      className="input bg-[#FAFAFA] border-[#E5E5E5] text-[#737373] font-semibold text-xs cursor-not-allowed py-2"
                    />
                  </div>
                </div>

                {/* Section 2: Educational Board Selection */}
                <div className="space-y-3 pt-4 border-t border-[#F5F5F5]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#111111] uppercase tracking-wider">
                      <Layers size={14} className="text-[#F4C430]" />
                      <span>Step 2: Select Educational Board</span>
                    </div>
                    <span className="text-[10px] text-[#A3A3A3] font-medium">Curriculum Standard</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-[#F5F5F5] p-1.5 rounded-2xl border border-[#E5E5E5]">
                    {BOARDS.map((b) => (
                      <button
                        key={b.id}
                        id={`btn-board-${b.id}`}
                        type="button"
                        onClick={() => setSelectedBoardId(b.id as BoardId)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          selectedBoardId === b.id
                            ? 'bg-white text-[#111111] shadow-sm border border-[#E5E5E5]'
                            : 'text-[#737373] hover:text-[#111111]'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${selectedBoardId === b.id ? 'bg-[#F4C430]' : 'bg-[#D4D4D4]'}`} />
                        <span className="truncate">{b.shortName || b.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 3 & 4: Academic Grade & Stream Selection (Skipped for IELTS) */}
                {selectedBoardId === 'ielts' ? (
                  <div className="space-y-3 pt-4 border-t border-[#F5F5F5] animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#111111] uppercase tracking-wider">
                        <GraduationCap size={14} className="text-[#F4C430]" />
                        <span>IELTS Preparation Program</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                        Complete 4-Skill Track
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl border-2 border-[#F4C430] bg-[#FFFBF0] shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#111111]">IELTS Complete Preparation</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                            Unified Syllabus
                          </span>
                        </div>
                        <CheckCircle2 size={18} className="text-[#F4C430] shrink-0" />
                      </div>
                      <p className="text-xs text-[#737373] leading-relaxed mb-3">
                        One streamlined comprehensive program covering all four core exam modules with personalized feedback, practice tests, and live interactive speaking drills. No grade level or version selection needed.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['IELTS Listening', 'IELTS Reading', 'IELTS Writing', 'IELTS Speaking'].map((skill) => (
                          <div
                            key={skill}
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl bg-white text-[#111111] border border-[#E5E5E5] shadow-xs"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F4C430]" />
                            <span>{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Section 3: Class Selection */}
                    <div className="space-y-3 pt-4 border-t border-[#F5F5F5]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#111111] uppercase tracking-wider">
                          <BookOpen size={14} className="text-[#F4C430]" />
                          <span>Step 3: Select Academic Grade ({currentBoardDef.shortName})</span>
                        </div>
                        <button
                          id="btn-compare-plans-step3"
                          type="button"
                          onClick={() => setShowPlanComparison(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-[#111111] bg-[#FFFBF0] border border-[#FDE68A] hover:bg-[#FEF3C7] transition-all cursor-pointer shadow-2xs"
                        >
                          <Sparkles size={12} className="text-[#F4C430]" />
                          <span>Compare Plans</span>
                        </button>
                      </div>

                      <div className={isMobile ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-4 gap-2.5'}>
                        {classesForBoard.map((c: any) => (
                          <button
                            key={c.id}
                            id={`btn-class-${c.grade}`}
                            type="button"
                            onClick={() => setSelectedClassId(c.id)}
                            className={`p-3.5 rounded-2xl border-2 text-center transition-all duration-200 cursor-pointer ${selectedClassId === c.id
                                ? 'border-[#F4C430] bg-[#FFFBF0] shadow-sm font-black text-[#111111]'
                                : 'border-[#E5E5E5] bg-white hover:border-[#D4D4D4] font-bold text-[#737373]'
                              }`}
                          >
                            <div className="text-base tracking-tight">{c.display_name}</div>
                            <div className="text-[10px] text-[#A3A3A3] mt-0.5">Grade {c.grade}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Section 4: Stream Selection */}
                    {selectedClassId && (
                      <div className="space-y-3 pt-4 border-t border-[#F5F5F5] animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#111111] uppercase tracking-wider">
                            <GraduationCap size={14} className="text-[#F4C430]" />
                            <span>Step 4: Choose Stream ({selectedClassObj?.display_name} - {currentBoardDef.shortName})</span>
                          </div>
                          <span className="text-[10px] text-[#A3A3A3] font-medium">Select one</span>
                        </div>

                        <div className={isMobile ? 'flex flex-col gap-3' : 'grid grid-cols-2 gap-3'}>
                          {streamsForClass.map((s: any) => {
                            let streamSubjects: string[] = [];
                            if (Array.isArray(s.subjects) && s.subjects.length > 0) {
                              streamSubjects = s.subjects;
                            } else if (taxonomy.streamSubjects) {
                              streamSubjects = taxonomy.streamSubjects
                                .filter((ss: any) => ss.stream_id === s.id)
                                .map((ss: any) => taxonomy.subjects.find((sub: any) => sub.id === ss.subject_id)?.name)
                                .filter(Boolean);
                            }
                            if (streamSubjects.length === 0 && selectedClassObj) {
                              const boardGrades = getGradesForBoard(selectedBoardId);
                              const gradeDef = boardGrades.find((g) => String(g.grade) === String(selectedClassObj.grade));
                              const stDef = gradeDef?.streams.find((st) => st.name.toLowerCase() === s.name?.toLowerCase());
                              if (stDef) streamSubjects = stDef.subjects;
                            }

                            return (
                              <button
                                key={s.id}
                                id={`btn-stream-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                                type="button"
                                onClick={() => {
                                  setSelectedStreamId(s.id);
                                  // Update subjects for the new stream
                                  if (enrollmentMode === 'all') {
                                    setSelectedSubjects(streamSubjects);
                                  } else if (selectedSubjects.length === 0) {
                                    setSelectedSubjects(streamSubjects.slice(0, 2));
                                  }
                                }}
                                className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${selectedStreamId === s.id
                                    ? 'border-[#F4C430] bg-[#FFFBF0] shadow-sm'
                                    : 'border-[#E5E5E5] bg-white hover:border-[#D4D4D4]'
                                  }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-black text-[#111111]">{s.name} Stream</span>
                                    {selectedStreamId === s.id && (
                                      <CheckCircle2 size={16} className="text-[#F4C430] shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {streamSubjects.map((sub: string) => (
                                      <span
                                        key={sub}
                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5]"
                                      >
                                        {sub}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Section 5: Subject Selection / Enrollment Model */}
                    {selectedClassId && selectedStreamId && (() => {
                      const availSubs = getAvailableSubjects();
                      const isALevel = selectedBoardId === 'alevel';
                      const isOLevel = selectedBoardId === 'olevel';
                      const isCambridge = isALevel || isOLevel;
                      const effectivePerSubRate = isALevel ? 6500 : isOLevel ? 5000 : pricingSettings.per_subject_fee;

                      return (
                        <div className="space-y-3 pt-4 border-t border-[#F5F5F5] animate-in fade-in duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#111111] uppercase tracking-wider">
                              <BookMarked size={14} className="text-[#F4C430]" />
                              <span>
                                {isCambridge
                                  ? `Step 5: Select Your Subjects (${isALevel ? 'A Levels' : 'O Levels'})`
                                  : 'Step 5: Enrollment Model & Subject Choice'}
                              </span>
                            </div>
                            <button
                              id="btn-compare-plans-step5"
                              type="button"
                              onClick={() => setShowPlanComparison(true)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#92700A] hover:underline cursor-pointer"
                            >
                              <Sparkles size={11} className="text-[#F4C430]" />
                              <span>{isCambridge ? 'View Rates & Discounts' : 'Compare Plans'}</span>
                            </button>
                          </div>

                          {isCambridge ? (
                            /* Cambridge Per-Subject Selector (NO All-Subjects Plan or Option A/B framing) */
                            <div className="p-4 bg-[#FFFBF0] rounded-2xl border border-[#FDE68A] space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <div>
                                  <span className="text-xs font-black text-[#111111] block">
                                    Cambridge {isALevel ? 'A Levels' : 'O Levels'} — Per-Subject Enrollment
                                  </span>
                                  <span className="text-[11px] text-[#92700A]">
                                    PKR {effectivePerSubRate.toLocaleString()} per subject per term • Flat 5% discount applied automatically on 2 or more subjects
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSubjects(availSubs)}
                                    className="text-[10px] font-bold text-[#737373] hover:text-[#111111] underline cursor-pointer"
                                  >
                                    Select All
                                  </button>
                                  <span className="text-gray-300">•</span>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSubjects([])}
                                    className="text-[10px] font-bold text-[#737373] hover:text-[#111111] underline cursor-pointer"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 pt-1">
                                {availSubs.map((sub) => {
                                  const isSelected = selectedSubjects.includes(sub);
                                  return (
                                    <button
                                      key={sub}
                                      type="button"
                                      onClick={() => {
                                        setSelectedSubjects((prev) =>
                                          prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
                                        );
                                      }}
                                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border interactive cursor-pointer ${
                                        isSelected
                                          ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                                          : 'bg-white text-[#525252] border-[#E5E5E5] hover:border-[#D4D4D4]'
                                      }`}
                                    >
                                      <div
                                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border ${
                                          isSelected
                                            ? 'bg-[#F4C430] text-[#111111] border-[#F4C430]'
                                            : 'border-[#D4D4D4] bg-white'
                                        }`}
                                      >
                                        {isSelected && <Check size={11} strokeWidth={3} />}
                                      </div>
                                      <span>{sub}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {selectedSubjects.length === 0 && (
                                <p className="text-xs text-amber-800 font-medium bg-white/80 p-2.5 rounded-xl border border-amber-200">
                                  Please select at least 1 subject to enroll in Cambridge {isALevel ? 'A Levels' : 'O Levels'}.
                                </p>
                              )}
                            </div>
                          ) : (
                            /* Standard Board Enrollment Mode (Package vs Specific Subjects) */
                            <>
                              <div className={isMobile ? 'grid grid-cols-1 gap-2.5' : 'grid grid-cols-2 gap-2.5'}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEnrollmentMode('all');
                                    setSelectedSubjects(availSubs);
                                  }}
                                  className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-200 ${
                                    enrollmentMode === 'all'
                                      ? 'border-[#F4C430] bg-[#FFFBF0] shadow-sm'
                                      : 'border-[#E5E5E5] bg-white hover:border-[#D4D4D4]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-black text-[#111111]">All Subjects Package</span>
                                    {enrollmentMode === 'all' && <CheckCircle2 size={16} className="text-[#F4C430] shrink-0" />}
                                  </div>
                                  <p className="text-xs text-[#737373]">
                                    Full curriculum access to all {availSubs.length} stream subjects.
                                  </p>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEnrollmentMode('custom');
                                    if (selectedSubjects.length === 0 && availSubs.length > 0) {
                                      setSelectedSubjects(availSubs.slice(0, 2));
                                    }
                                  }}
                                  className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-200 ${
                                    enrollmentMode === 'custom'
                                      ? 'border-[#F4C430] bg-[#FFFBF0] shadow-sm'
                                      : 'border-[#E5E5E5] bg-white hover:border-[#D4D4D4]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-black text-[#111111]">Select Specific Subjects</span>
                                    {enrollmentMode === 'custom' && <CheckCircle2 size={16} className="text-[#F4C430] shrink-0" />}
                                  </div>
                                  <p className="text-xs text-[#737373]">
                                    Enroll in 1, 2, 3, or more specific subjects of your choice.
                                  </p>
                                </button>
                              </div>

                              {enrollmentMode === 'custom' && (
                                <div className="p-4 bg-[#F9F9F9] rounded-2xl border border-[#E5E5E5] space-y-3 animate-in fade-in duration-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="text-xs font-bold text-[#111111] block">
                                        Choose Enrolled Subjects ({selectedSubjects.length} of {availSubs.length} selected):
                                      </span>
                                      <span className="text-[11px] text-[#737373]">
                                        Rate: PKR {pricingSettings.per_subject_fee.toLocaleString()} / subject
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedSubjects(availSubs)}
                                        className="text-[10px] font-bold text-[#737373] hover:text-[#111111] underline"
                                      >
                                        Select All
                                      </button>
                                      <span className="text-gray-300">•</span>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedSubjects([])}
                                        className="text-[10px] font-bold text-[#737373] hover:text-[#111111] underline"
                                      >
                                        Clear
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {availSubs.map((sub) => {
                                      const isSelected = selectedSubjects.includes(sub);
                                      return (
                                        <button
                                          key={sub}
                                          type="button"
                                          onClick={() => {
                                            setSelectedSubjects((prev) =>
                                              prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
                                            );
                                          }}
                                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border interactive ${
                                            isSelected
                                              ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                                              : 'bg-white text-[#525252] border-[#E5E5E5] hover:border-[#D4D4D4]'
                                          }`}
                                        >
                                          <div
                                            className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border ${
                                              isSelected
                                                ? 'bg-[#F4C430] text-[#111111] border-[#F4C430]'
                                                : 'border-[#D4D4D4] bg-white'
                                            }`}
                                          >
                                            {isSelected && <Check size={11} strokeWidth={3} />}
                                          </div>
                                          <span>{sub}</span>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {selectedSubjects.length === 0 && (
                                    <p className="text-xs text-amber-700 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
                                      Please select at least 1 subject to enroll, or switch to All Subjects Package.
                                    </p>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </>
                )}

                {/* Section 6: Live Tuition Fee Summary */}
                {selectedClassId && selectedStreamId && (() => {
                  const availSubs = getAvailableSubjects();
                  const isALevel = selectedBoardId === 'alevel';
                  const isOLevel = selectedBoardId === 'olevel';
                  const isCambridge = isALevel || isOLevel;
                  const targetSubs = (isCambridge || enrollmentMode === 'custom') ? selectedSubjects : availSubs;
                  const effectivePerSubRate = isALevel ? 6500 : isOLevel ? 5000 : pricingSettings.per_subject_fee;
                  const pricingCalc = calculateSubjectEnrollmentFee({
                    baseClassFee: baseClassFee,
                    selectedSubjects: targetSubs,
                    perSubjectFee: effectivePerSubRate,
                    threshold: pricingSettings.auto_upgrade_threshold,
                    isAllPlanDirectlySelected: !isCambridge && enrollmentMode === 'all',
                    boardId: selectedBoardId,
                  });
                  const effectiveFee = pricingCalc.fee;

                  return (
                    <div className={`bg-[#FFFBF0] border border-[#FDE68A] rounded-2xl p-4 flex ${isMobile ? 'flex-col items-start' : 'flex-row items-center'} justify-between gap-3 animate-in fade-in duration-300`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F4C430]/20 flex items-center justify-center text-[#92700A] shrink-0">
                          <DollarSign size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                            {selectedBoardId === 'ielts'
                              ? 'Live Tuition Summary (IELTS Preparation)'
                              : `Live Tuition Summary (${selectedClassObj?.display_name || ''} - ${currentBoardDef.shortName})`}
                          </span>
                          {effectiveFee !== null && effectiveFee > 0 ? (
                            <span className="text-xl font-black text-[#111111]">
                              PKR {effectiveFee.toLocaleString()}{' '}
                              <span className="text-xs font-bold text-amber-800">
                                {isCambridge
                                  ? `(${targetSubs.length} ${targetSubs.length === 1 ? 'subject' : 'subjects'} @ PKR ${effectivePerSubRate.toLocaleString()} / subject / term)`
                                  : '/ term'}
                              </span>
                            </span>
                          ) : (
                            <span className="text-sm font-black text-amber-900 block mt-0.5">
                              {isCambridge && targetSubs.length === 0
                                ? 'Select at least 1 subject to see tuition'
                                : 'Price not yet set — contact admin'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-left sm:text-right text-[11px] text-amber-900 font-semibold leading-snug">
                        {effectiveFee !== null && effectiveFee > 0 ? (
                          <>
                            {isCambridge ? (
                              <span>
                                {targetSubs.length} Subject{targetSubs.length === 1 ? '' : 's'} Selected ({targetSubs.length} × PKR {effectivePerSubRate.toLocaleString()}).
                                {pricingCalc.discountAmount ? (
                                  <span className="text-emerald-800 font-bold block">
                                    5% Multi-Subject Discount (-PKR {pricingCalc.discountAmount.toLocaleString()})
                                  </span>
                                ) : (
                                  <span className="text-amber-800 text-[10px] block">
                                    (Add 1 more subject to unlock flat 5% discount)
                                  </span>
                                )}
                              </span>
                            ) : enrollmentMode === 'all' ? (
                              <span>All Subjects Package ({availSubs.length} subjects included).</span>
                            ) : targetSubs.length <= pricingSettings.auto_upgrade_threshold ? (
                              <span>
                                {targetSubs.length} Subject{targetSubs.length === 1 ? '' : 's'} Enrollment ({targetSubs.length} × PKR {pricingSettings.per_subject_fee.toLocaleString()}).
                              </span>
                            ) : (
                              <span>
                                Subject Enrollment Package ({targetSubs.length} subjects selected).
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {isCambridge ? (
                              <span>Cambridge tuition is calculated based on selected subjects.</span>
                            ) : (
                              <span>
                                Admin Price Manager has not set a fee for this grade yet.<br />
                                Please check back or contact support.
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="pt-4 border-t border-[#F5F5F5] flex flex-col gap-2.5">
                  <button
                    type="submit"
                    disabled={saving || !selectedClassId || !selectedStreamId}
                    className="btn btn-primary w-full flex items-center justify-center gap-2 py-3.5 font-extrabold text-sm shadow-md transition-all disabled:opacity-50 interactive"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin shrink-0" />
                        <span className="truncate">Creating Student Profile & Package…</span>
                      </>
                    ) : (
                      <>
                        <GraduationCap size={16} className="shrink-0" />
                        <span className="truncate">{isMobile ? 'Complete Registration' : 'Complete Registration & Proceed to Checkout'}</span>
                        <ArrowRight size={16} className="shrink-0" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isSigningOut}
                    onClick={handleSignOut}
                    className="btn btn-ghost w-full py-2 text-xs text-[#737373] hover:text-[#111111] font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5 interactive"
                  >
                    {isSigningOut && <Loader2 size={12} className="animate-spin shrink-0" />}
                    Sign Out
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-[#A3A3A3] mt-6 text-center font-medium">
          Scholario LMS Security System · Encrypted & Verified
        </p>
      </div>
    </div>
  );
};

export default UnregisteredPage;
