import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Loader2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import Logo from '../../components/ui/Logo';
import { normalizeEmail, mapAuthError, evaluatePasswordStrength } from '../../utils/authErrors';

export const RegisterPage: React.FC = () => {
  const {
    signInWithGoogle,
    signUpWithEmail,
    resendVerificationEmail,
    profile,
    session,
    loading: authLoading,
    needsOnboarding
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);

  // Status & states
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Post-signup verification screen
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  // Live password evaluation
  const passwordStrength = evaluatePasswordStrength(password);
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  // 60-second cooldown timer
  useEffect(() => {
    if (!signupSuccess || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [signupSuccess, resendCooldown]);

  // ── Redirect once authenticated (for existing or OAuth users) ───────────────
  useEffect(() => {
    if (authLoading) return;

    if (session) {
      if (!profile) {
        // New Google user goes to unregistered page to fill the student registration form
        navigate('/unregistered' + location.search, { replace: true });
        return;
      }
      // Existing user goes to their dashboard
      let dest = from && from !== '/login' && from !== '/register' ? from : '/';
      if (!from || from === '/login' || from === '/register') {
        if (profile.role === 'admin')        dest = '/admin';
        else if (profile.role === 'teacher') dest = '/teacher';
        else if (needsOnboarding)            dest = '/student/onboarding';
        else                                 dest = '/student';
      }
      navigate(dest, { replace: true });
    }
  }, [session, profile, from, navigate, authLoading, needsOnboarding, location.search]);

  // ── Google sign-up handler ─────────────────────────────────────────────────
  const handleGoogleSignUp = async () => {
    if (!termsConsent) return;
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const mapped = mapAuthError(err);
      setError(mapped.message);
      setGoogleLoading(false);
    }
  };

  // ── Email sign-up handler ──────────────────────────────────────────────────
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsConsent) {
      setError('Please agree to the Terms of Service, Privacy Policy, and Refund Policy to proceed.');
      return;
    }

    setError(null);
    const cleanEmail = normalizeEmail(email);
    const cleanName = fullName.trim();

    if (!cleanName) {
      setError('Please provide your full legal name.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setEmailLoading(true);
    try {
      const result = await signUpWithEmail(cleanEmail, password, cleanName);

      if (result.isExistingUser) {
        setError('Account already exists, please sign in.');
        setEmailLoading(false);
        return;
      }

      setRegisteredEmail(cleanEmail);
      setSignupSuccess(true);
      setResendCooldown(60);
    } catch (err: any) {
      const mapped = mapAuthError(err);
      setError(mapped.message);
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Resend Verification Handler ────────────────────────────────────────────
  const handleResend = async () => {
    if (!registeredEmail || resendCooldown > 0) return;
    setResending(true);
    setResendNotice(null);
    try {
      await resendVerificationEmail(registeredEmail);
      setResendNotice('Verification email resent! Please check your inbox.');
      setResendCooldown(60);
    } catch (err: any) {
      const mapped = mapAuthError(err);
      setResendNotice(mapped.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0D0D0D] text-[#111111] dark:text-[#E5E5E5] flex page-transition">
      {/* ─── Left panel — signup / confirmation ─── */}
      <div className="flex-1 flex flex-col justify-between items-center px-4 sm:px-8 py-10 sm:py-12 min-h-screen">
        {/* Top Header */}
        <div className="w-full max-w-md flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#F4C430] rounded-lg p-1 transition-transform active:scale-95"
            aria-label="Scholario Home"
          >
            <Logo size="md" variant="full" />
          </Link>
          <Link
            to="/login"
            className="text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white transition-colors"
          >
            Sign In Instead →
          </Link>
        </div>

        {/* Center Container */}
        <div className="w-full max-w-md my-auto py-6">
          {signupSuccess ? (
            /* ── Post-Signup Verification Screen ── */
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#141416] border border-black/[0.08] dark:border-white/[0.08] shadow-sm text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-[#D4A017] dark:text-[#F4C430] flex items-center justify-center mx-auto shadow-inner">
                <Mail size={32} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-[#111111] dark:text-white tracking-tight">
                  Check your inbox to verify your email
                </h2>
                <p className="text-xs sm:text-sm text-[#737373] dark:text-[#A3A3A3] mt-2 leading-relaxed">
                  We've dispatched a secure verification link to:
                </p>
                <div className="mt-2 inline-block px-3 py-1.5 rounded-xl bg-[#FAFAFA] dark:bg-[#1C1C1E] border border-[#E5E5E5] dark:border-[#2E2E32] font-mono text-xs font-semibold text-[#111111] dark:text-white">
                  {registeredEmail}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFFDF5] dark:bg-[#1A1813] border border-[#F4C430]/30 text-xs text-[#737373] dark:text-[#A3A3A3] text-left space-y-1.5 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-[#111111] dark:text-white">
                  <ShieldCheck size={14} className="text-[#F4C430]" />
                  <span>Activation instructions</span>
                </div>
                <p>1. Open the email sent from Scholario.</p>
                <p>2. Click <strong>Verify Email Address</strong> to activate your student account.</p>
                <p className="text-[11px] text-[#888888]">
                  Can't find it? Check your Spam or Promotions folder. Links expire in 24 hours.
                </p>
              </div>

              {resendNotice && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-300 font-medium animate-fade-in">
                  {resendNotice}
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || resendCooldown > 0}
                  className="w-full sm:flex-1 min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#262626] border border-[#D4D4D4] dark:border-[#404040] text-xs font-bold text-[#111111] dark:text-white hover:bg-[#FAFAFA] dark:hover:bg-[#333333] transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {resending ? (
                    <Loader2 size={14} className="animate-spin text-[#F4C430]" />
                  ) : (
                    <RefreshCw size={14} className="text-[#F4C430]" />
                  )}
                  <span>
                    {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend verification email'}
                  </span>
                </button>

                <Link
                  to="/login"
                  className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] text-xs font-extrabold transition-colors shadow-xs"
                >
                  <span>Sign In</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            /* ── Sign-up Form ── */
            <>
              {/* Heading */}
              <div className="mb-6 text-left">
                <h1 className="text-2xl sm:text-3xl font-black text-[#111111] dark:text-white tracking-tight mb-2">
                  Create Student Account
                </h1>
                <p className="text-sm text-[#737373] dark:text-[#A3A3A3] leading-relaxed">
                  Join Scholario to access course materials, live schedules, and auto-evaluated assessments.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div
                  className="mb-5 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-left space-y-2 animate-fade-in"
                  role="alert"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-red-900 dark:text-red-200">
                        Registration Notice
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-0.5 leading-relaxed">
                        {error}
                      </p>
                    </div>
                  </div>
                  {error.includes('already exists') && (
                    <div className="pt-1">
                      <Link
                        to="/login"
                        className="inline-flex items-center gap-1 text-xs font-bold text-red-900 dark:text-red-200 underline hover:no-underline"
                      >
                        <span>Click here to sign in</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Explicit Consent Checkbox (Mandatory before Google and Email Sign-Up) */}
              <div className="mb-5 p-3.5 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#333333] space-y-2 text-left">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    id="register-consent-checkbox"
                    type="checkbox"
                    checked={termsConsent}
                    onChange={(e) => setTermsConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#D4A017] focus:ring-[#D4A017] border-[#D4D4D4] dark:border-[#525252] cursor-pointer"
                  />
                  <span className="text-xs text-[#525252] dark:text-[#A3A3A3] leading-relaxed">
                    I have read and explicitly agree to the{' '}
                    <Link id="register-terms-link" to="/terms" target="_blank" className="font-bold text-[#D4A017] dark:text-[#F4C430] hover:underline">
                      Terms of Service
                    </Link>
                    ,{' '}
                    <Link id="register-privacy-link" to="/privacy" target="_blank" className="font-bold text-[#D4A017] dark:text-[#F4C430] hover:underline">
                      Privacy Policy
                    </Link>
                    , and{' '}
                    <Link id="register-refund-link" to="/refund" target="_blank" className="font-bold text-[#D4A017] dark:text-[#F4C430] hover:underline">
                      Refund Policy
                    </Link>
                    .
                  </span>
                </label>
                <p className="text-[11px] text-[#737373] dark:text-[#666666] pl-6.5">
                  <em>Students under 18:</em> A parent/guardian email can be provided during profile setup.
                </p>
              </div>

              {/* Google OAuth Button */}
              <button
                id="google-sign-up"
                type="button"
                onClick={handleGoogleSignUp}
                disabled={googleLoading || emailLoading || authLoading || !termsConsent}
                className="w-full min-h-[48px] flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl border border-[#D4D4D4] dark:border-[#333333] bg-white dark:bg-[#1A1A1A] hover:bg-[#F5F5F5] dark:hover:bg-[#262626] hover:border-[#A3A3A3] dark:hover:border-[#525252] active:scale-[0.99] transition-all font-bold text-sm text-[#262626] dark:text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
              >
                {googleLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-[#737373] dark:text-[#A3A3A3]" />
                    <span>Connecting with Google…</span>
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" aria-hidden="true" className="shrink-0">
                      <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
                      <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
                      <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
                      <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
                    </svg>
                    <span>Sign Up with Google</span>
                  </>
                )}
              </button>

              {/* Or Divider */}
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E5E5E5] dark:border-[#262626]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-[#FAFAFA] dark:bg-[#0D0D0D] px-3 font-bold text-[#737373] dark:text-[#A3A3A3]">
                    or sign up with email
                  </span>
                </div>
              </div>

              {/* Email Sign-up Form */}
              <form onSubmit={handleEmailSignUp} className="space-y-4 text-left">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-[#525252] dark:text-[#A3A3A3] uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737373]">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Sarah Khan"
                      autoComplete="name"
                      required
                      disabled={emailLoading || googleLoading || authLoading}
                      className="w-full h-12 pl-10 pr-4 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-[#D4D4D4] dark:border-[#333333] text-sm text-[#111111] dark:text-white placeholder-[#A3A3A3] focus:outline-hidden focus:border-[#F4C430] focus:ring-2 focus:ring-[#F4C430]/20 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-[#525252] dark:text-[#A3A3A3] uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737373]">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoComplete="email"
                      required
                      disabled={emailLoading || googleLoading || authLoading}
                      className="w-full h-12 pl-10 pr-4 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-[#D4D4D4] dark:border-[#333333] text-sm text-[#111111] dark:text-white placeholder-[#A3A3A3] focus:outline-hidden focus:border-[#F4C430] focus:ring-2 focus:ring-[#F4C430]/20 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password with live validation */}
                <div>
                  <label className="block text-xs font-bold text-[#525252] dark:text-[#A3A3A3] uppercase tracking-wider mb-1.5">
                    Password (Min. 8 characters)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737373]">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      disabled={emailLoading || googleLoading || authLoading}
                      className="w-full h-12 pl-10 pr-11 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-[#D4D4D4] dark:border-[#333333] text-sm text-[#111111] dark:text-white placeholder-[#A3A3A3] focus:outline-hidden focus:border-[#F4C430] focus:ring-2 focus:ring-[#F4C430]/20 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#737373] hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1.5 animate-fade-in">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#737373]">Strength:</span>
                        <span className="font-bold text-[#111111] dark:text-white">
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#E5E5E5] dark:bg-[#262626] overflow-hidden flex gap-1">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${(passwordStrength.score / 4) * 100}%`,
                            backgroundColor: passwordStrength.color
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-[#737373]">
                        {password.length < 8
                          ? 'Needs at least 8 characters.'
                          : 'Tip: Combine letters, numbers, and symbols.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-[#525252] dark:text-[#A3A3A3] uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737373]">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      required
                      disabled={emailLoading || googleLoading || authLoading}
                      className={`w-full h-12 pl-10 pr-11 rounded-2xl bg-white dark:bg-[#1A1A1A] border text-sm text-[#111111] dark:text-white placeholder-[#A3A3A3] focus:outline-hidden transition-all font-medium ${
                        passwordMismatch
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-400/20'
                          : passwordsMatch
                          ? 'border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                          : 'border-[#D4D4D4] dark:border-[#333333] focus:border-[#F4C430] focus:ring-2 focus:ring-[#F4C430]/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#737373] hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordMismatch && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium animate-fade-in">
                      Passwords do not match.
                    </p>
                  )}
                  {passwordsMatch && (
                    <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 animate-fade-in">
                      <CheckCircle2 size={12} />
                      Passwords match.
                    </p>
                  )}
                </div>

                {/* Submit button */}
                <button
                  id="email-sign-up"
                  type="submit"
                  disabled={
                    emailLoading ||
                    googleLoading ||
                    authLoading ||
                    !termsConsent ||
                    !fullName.trim() ||
                    !email.trim() ||
                    password.length < 8 ||
                    password !== confirmPassword
                  }
                  className="w-full min-h-[48px] flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#F4C430] hover:bg-[#E5B520] active:scale-[0.99] transition-all font-extrabold text-sm text-[#111111] shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F4C430]"
                >
                  {emailLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-[#111111]" />
                      <span>Creating Account…</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </form>

              {/* Notice */}
              <div className="mt-6 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-left">
                <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                  <strong>Registration is 100% free.</strong> Once registered, you will be directed to course selection and tuition activation.
                </p>
              </div>

              {/* Switch to login */}
              <div className="mt-6 text-center text-xs text-[#737373] dark:text-[#A3A3A3]">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-[#D4A017] dark:text-[#F4C430] hover:underline">
                  Sign In
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="w-full max-w-md pt-6 border-t border-[#F0F0F0] dark:border-[#1F1F1F] text-center">
          <p className="text-[11px] text-[#A3A3A3] dark:text-[#525252]">
            © {new Date().getFullYear()} Scholario · SHS Virtual Academy · Rawalpindi, Pakistan
          </p>
        </div>
      </div>

      {/* ─── Right panel — branding (desktop only) ─── */}
      <div
        className="hidden lg:flex flex-1 flex-col justify-between p-12 xl:p-16 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #111111 0%, #1a1a1a 60%, #0d0d0d 100%)',
        }}
      >
        <div
          className="absolute -top-24 -right-24 w-96 h-96 pointer-events-none rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(244,196,48,0.12) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(244,196,48,0.12)', border: '1px solid rgba(244,196,48,0.2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#F4C430]" />
            <span className="text-xs font-semibold text-[#F4C430]">SHS Virtual Academy — Scholario</span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 max-w-sm">
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-5">
            Start your learning<br />
            <span style={{ color: '#F4C430' }}>journey today.</span>
          </h2>
          <p className="text-[#A3A3A3] text-sm xl:text-base leading-relaxed">
            Join Pakistan's premier academy platform. Access structured notes, live timetables, and automated testing with verified performance tracking.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-[#737373]">
          <p>© {new Date().getFullYear()} Scholario</p>
          <span className="flex items-center gap-1.5 text-[#A3A3A3]">
            <ShieldCheck size={14} className="text-[#F4C430]" />
            Secure Supabase Identity & Auth
          </span>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
