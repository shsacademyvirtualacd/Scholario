import React, { useState, useEffect } from 'react';
import { ShieldAlert, LogOut, GraduationCap, ArrowRight, Loader2, Sparkles, BookOpen, CheckCircle2, User, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { getTaxonomy, completeStudentOnboarding, resolveGradeFeeConfig, requestAccountTermination } from '../../lib/db';
import Logo from '../../components/ui/Logo';
import { BOARD, getDefaultPrice } from '../../lib/taxonomy';
import { toast } from 'sonner';
import { useMobile } from '../../hooks/useMobile';

export const UnregisteredPage: React.FC = () => {
  const { signOut, user, profile, refreshProfile, suspended, isBillingSuspended, proceedToPaymentCheckout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();

  const [taxonomy, setTaxonomy] = useState<any>(null);

  // Form Fields
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
  const [phone, setPhone] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [livePrice, setLivePrice] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terminationStep, setTerminationStep] = useState<'idle' | 'confirm' | 'goodbye'>('idle');

  // Fetch taxonomy and set initial classes
  useEffect(() => {
    getTaxonomy()
      .then((tax) => {
        setTaxonomy(tax);
        // Default class to first FBISE class
        const fbiseClasses = tax.classes.filter((c: any) => c.board_id === BOARD.id);
        if (fbiseClasses.length > 0) {
          setSelectedClassId(fbiseClasses[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load taxonomy:', err);
      });
  }, []);

  // Reset stream and calculate live price when class changes
  useEffect(() => {
    setSelectedStreamId(null);
    if (selectedClassId && taxonomy) {
      const cls = taxonomy.classes.find((c: any) => c.id === selectedClassId);
      if (cls) {
        resolveGradeFeeConfig(cls.grade || '10', cls.id)
          .then((cfg) => {
            if (cfg && typeof cfg.amount === 'number' && cfg.amount > 0) {
              setLivePrice(cfg.amount);
            } else {
              setLivePrice(cls.grade ? getDefaultPrice(cls.grade) : 2499);
            }
          })
          .catch(() => setLivePrice(cls.grade ? getDefaultPrice(cls.grade) : 2499));
      }
    }
  }, [selectedClassId, taxonomy]);

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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!fullName.trim() || !phone.trim() || !selectedClassId) {
      setError('Please fill out all required fields.');
      return;
    }

    if (!selectedStreamId) {
      setError('Please select an academic stream.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // 1. Check or insert Roster entry linked to student profile
      const emailLower = user.email?.toLowerCase() || '';
      const { data: existingRoster } = await (supabase as any)
        .from('roster')
        .select('id')
        .eq('email', emailLower)
        .maybeSingle();

      if (!existingRoster) {
        const { error: rosterErr } = await (supabase as any)
          .from('roster')
          .insert({
            email: emailLower,
            full_name: fullName.trim(),
            role: 'student',
            class_ids: [],
            profile_id: user.id
          });

        if (rosterErr) {
          console.error('Roster insert error:', rosterErr);
          throw new Error(rosterErr.message || 'Roster creation failed.');
        }
      } else {
        await (supabase as any)
          .from('roster')
          .update({ profile_id: user.id, full_name: fullName.trim() })
          .eq('id', existingRoster.id);
      }

      // 2. Ensure student profile exists in profiles table before calling completeStudentOnboarding
      const { error: profileUpsertErr } = await (supabase as any)
        .from('profiles')
        .upsert({
          id: user.id,
          role: 'student',
          full_name: fullName.trim(),
          avatar_url: user.user_metadata?.avatar_url ?? null,
          phone: phone.trim() || null,
          onboarding_complete: false
        }, { onConflict: 'id' });

      if (profileUpsertErr) {
        console.error('Profile upsert error:', profileUpsertErr);
        throw new Error(profileUpsertErr.message || 'Student profile creation failed.');
      }

      // 3. Perform complete onboarding and enrollment assignment
      await completeStudentOnboarding(
        user.id,
        BOARD.id,
        selectedClassId,
        selectedStreamId,
        [],
        fullName.trim()
      );

      // 4. Reload profile context
      await refreshProfile();

      // 5. Route directly to checkout
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

  const classesForBoard = taxonomy.classes.filter((c: any) => c.board_id === BOARD.id);
  const streamsForClass = taxonomy.streams.filter((s: any) => s.class_id === selectedClassId);
  const selectedClassObj = taxonomy.classes.find((c: any) => c.id === selectedClassId);

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
                  <span className="text-xs font-bold text-[#737373] bg-[#F5F5F5] px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {BOARD.name} Only
                  </span>
                </div>
                <p className="text-xs text-[#737373]">
                  Complete your registration in one simple step to customize your learning stream and unlock tuition checkout.
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
                      <label className="label text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wide mb-1 block">WhatsApp / Phone</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 03001234567"
                        className="input text-xs py-2.5 bg-white font-semibold"
                      />
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

                {/* Section 2: Class Selection */}
                <div className="space-y-3 pt-4 border-t border-[#F5F5F5]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#111111] uppercase tracking-wider">
                    <BookOpen size={14} className="text-[#F4C430]" />
                    <span>Step 2: Select Academic Grade</span>
                  </div>

                  <div className={isMobile ? 'flex flex-col gap-2.5' : 'grid grid-cols-4 gap-2.5'}>
                    {classesForBoard.map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedClassId(c.id)}
                        className={`p-3.5 rounded-2xl border-2 text-center transition-all duration-200 ${selectedClassId === c.id
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

                {/* Section 3: Stream Selection */}
                {selectedClassId && (
                  <div className="space-y-3 pt-4 border-t border-[#F5F5F5] animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#111111] uppercase tracking-wider">
                        <GraduationCap size={14} className="text-[#F4C430]" />
                        <span>Step 3: Choose Stream ({selectedClassObj?.display_name})</span>
                      </div>
                      <span className="text-[10px] text-[#A3A3A3] font-medium">Select one</span>
                    </div>

                    <div className={isMobile ? 'flex flex-col gap-3' : 'grid grid-cols-2 gap-3'}>
                      {streamsForClass.map((s: any) => {
                        const streamSubjects = taxonomy.streamSubjects
                          ? taxonomy.streamSubjects
                            .filter((ss: any) => ss.stream_id === s.id)
                            .map((ss: any) => taxonomy.subjects.find((sub: any) => sub.id === ss.subject_id)?.name)
                            .filter(Boolean)
                          : [];

                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelectedStreamId(s.id)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between ${selectedStreamId === s.id
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

                {/* Section 4: Live Tuition Fee Summary */}
                {selectedClassId && selectedStreamId && (
                  <div className={`bg-[#FFFBF0] border border-[#FDE68A] rounded-2xl p-4 flex ${isMobile ? 'flex-col items-start' : 'flex-row items-center'} justify-between gap-3 animate-in fade-in duration-300`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F4C430]/20 flex items-center justify-center text-[#92700A] shrink-0">
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                          Live Tuition Summary ({selectedClassObj?.display_name})
                        </span>
                        {livePrice !== null && livePrice > 0 ? (
                          <span className="text-xl font-black text-[#111111]">
                            PKR {livePrice.toLocaleString()} <span className="text-xs font-bold text-amber-800">/ term</span>
                          </span>
                        ) : (
                          <span className="text-sm font-black text-amber-900 block mt-0.5">
                            Price not yet set — contact admin
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-left sm:text-right text-[10px] text-amber-900 font-semibold leading-snug">
                      {livePrice !== null && livePrice > 0 ? (
                        <>
                          Includes full access upon payment authorization.
                        </>
                      ) : (
                        <>
                          Admin Price Manager has not set a fee for this grade yet.<br />
                          Please check back or contact support.
                        </>
                      )}
                    </div>
                  </div>
                )}

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
