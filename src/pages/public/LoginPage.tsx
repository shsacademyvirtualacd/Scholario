import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  MessageCircle,
  Bot,
  BookOpen,
  Calendar,
  CheckCircle2,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import Logo from '../../components/ui/Logo';
import { isRedesignEnabled } from '../../lib/featureFlags';
import { LoginPageOld } from './LoginPageOld';
import { normalizeEmail, mapAuthError } from '../../utils/authErrors';

const LoginPage: React.FC = () => {
  if (!isRedesignEnabled()) {
    return <LoginPageOld />;
  }

  const {
    signInWithGoogle,
    signInWithEmail,
    resendVerificationEmail,
    signOut,
    profile,
    session,
    user,
    loading: authLoading,
    needsOnboarding,
    authError,
    rosterRejected,
    suspended,
    isBillingSuspended
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const [signingIn, setSigningIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submittingEmail, setSubmittingEmail] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [localError, setLocalError] = useState<{
    type: 'roster' | 'network' | 'popup' | 'cancelled' | 'generic';
    message: string;
    email?: string;
  } | null>(null);

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ── Redirect once authenticated ────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;

    if (session) {
      if (!profile) {
        // If profile doesn't exist, stay on login or route to unregistered
        // But if rosterRejected, we stay on login page to show friendly card!
        if (rosterRejected) {
          setLocalError({
            type: 'roster',
            message: 'Email not found on institutional roster',
            email: user?.email || session?.user?.email || ''
          });
          return;
        }
        navigate('/unregistered', { replace: true });
        return;
      }

      // Determine destination
      let dest = from && from !== '/login' ? from : '/';
      if (!from || from === '/login') {
        if (profile.role === 'admin')        dest = '/admin';
        else if (profile.role === 'teacher') dest = '/teacher';
        else if (needsOnboarding)            dest = '/student/onboarding';
        else                                 dest = '/student';
      }
      navigate(dest, { replace: true });
    }
  }, [session, profile, from, navigate, authLoading, needsOnboarding, rosterRejected, user]);

  // Sync authError / rosterRejected when updated from context
  useEffect(() => {
    if (rosterRejected) {
      setLocalError({
        type: 'roster',
        message: 'Your Google email is not yet registered on the SHS institutional roster.',
        email: user?.email || session?.user?.email || ''
      });
      setSigningIn(false);
    } else if (authError) {
      const lower = authError.toLowerCase();
      if (lower.includes('roster') || lower.includes('not listed') || lower.includes('unregistered')) {
        setLocalError({
          type: 'roster',
          message: authError,
          email: user?.email || session?.user?.email || ''
        });
      } else if (lower.includes('network') || lower.includes('connection') || lower.includes('offline')) {
        setLocalError({
          type: 'network',
          message: 'Network connection issue. Please check your internet connection and try again.'
        });
      } else if (lower.includes('popup') || lower.includes('blocked')) {
        setLocalError({
          type: 'popup',
          message: 'The Google sign-in popup was blocked by your browser. Please allow popups for this site.'
        });
      } else if (lower.includes('cancel') || lower.includes('closed')) {
        setLocalError({
          type: 'cancelled',
          message: 'Sign-in was cancelled. Please try again when ready.'
        });
      } else {
        setLocalError({
          type: 'generic',
          message: authError
        });
      }
      setSigningIn(false);
    }
  }, [rosterRejected, authError, user, session]);

  // ── Google sign-in handler ─────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setSigningIn(true);
    try {
      await signInWithGoogle();
      // For real OAuth redirect: browser navigates away.
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err || '');
      const lower = msg.toLowerCase();
      if (lower.includes('popup') || lower.includes('blocked')) {
        setLocalError({
          type: 'popup',
          message: 'The Google sign-in window was blocked by your browser. Please enable popups and retry.'
        });
      } else if (lower.includes('network') || lower.includes('fetch') || lower.includes('offline')) {
        setLocalError({
          type: 'network',
          message: 'Could not connect to authentication services. Check your connection.'
        });
      } else if (lower.includes('cancel') || lower.includes('closed') || lower.includes('aborted')) {
        setLocalError({
          type: 'cancelled',
          message: 'Sign-in cancelled before completing.'
        });
      } else {
        setLocalError({
          type: 'generic',
          message: msg || 'Sign-in failed. Please try again.'
        });
      }
      setSigningIn(false);
    }
  };

  const handleTryDifferentAccount = async () => {
    setLocalError(null);
    setSigningIn(false);
    try {
      await signOut();
    } catch (e) {
      console.warn('Sign out cleanup notice:', e);
    }
    // Automatically trigger sign-in with account chooser
    handleGoogleSignIn();
  };

  // ── Email sign-in handler ──────────────────────────────────────────────────
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setUnconfirmedEmail(null);
    setResendNotice(null);

    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLocalError({
        type: 'generic',
        message: 'Please enter a valid email address.'
      });
      return;
    }

    if (!password) {
      setLocalError({
        type: 'generic',
        message: 'Please enter your password.'
      });
      return;
    }

    setSubmittingEmail(true);
    try {
      await signInWithEmail(cleanEmail, password);
    } catch (err: any) {
      const mapped = mapAuthError(err);
      if (mapped.isUnconfirmedEmail) {
        setUnconfirmedEmail(cleanEmail);
      } else {
        setLocalError({
          type: 'generic',
          message: mapped.message
        });
      }
    } finally {
      setSubmittingEmail(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unconfirmedEmail || resendCooldown > 0) return;
    setResending(true);
    setResendNotice(null);
    try {
      await resendVerificationEmail(unconfirmedEmail);
      setResendNotice('Verification email sent! Check your inbox.');
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
      {/* ─── Left panel: Sign-in Card (Responsive centered 360px - 1024px+) ─── */}
      <div className="flex-1 flex flex-col justify-between items-center px-4 sm:px-8 py-10 sm:py-12 min-h-screen">
        {/* Top bar with logo and back to home */}
        <div className="w-full max-w-md flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#F4C430] rounded-lg p-1 transition-transform active:scale-95"
            aria-label="Scholario Home"
          >
            <Logo size="md" variant="full" />
          </Link>
          <Link
            to="/"
            className="text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Center content container */}
        <div className="w-full max-w-md my-auto py-6">
          {/* Header block */}
          <div className="mb-7 text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-[#111111] dark:text-white tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-sm text-[#737373] dark:text-[#A3A3A3] leading-relaxed">
              Sign in to your Scholario account using your institutional Google address.
            </p>
          </div>

          {/* ── Error State 1: Email NOT on the roster ── */}
          {localError?.type === 'roster' ? (
            <div
              id="login-roster-error-card"
              className="mb-6 p-5 rounded-2xl bg-[#FFFDF5] dark:bg-[#1A1813] border border-[#F4C430]/40 shadow-sm space-y-4 animate-fade-in"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-[#111111] dark:text-white leading-tight">
                    Email not found on institutional roster
                  </h3>
                  {localError.email && (
                    <p className="text-xs font-mono font-medium text-[#737373] dark:text-[#A3A3A3] mt-1 bg-white/70 dark:bg-black/30 px-2 py-1 rounded border border-[#E5E5E5] dark:border-[#333333] truncate">
                      {localError.email}
                    </p>
                  )}
                  <p className="text-xs text-[#525252] dark:text-[#B3B3B3] mt-2 leading-relaxed">
                    Existing members can switch to their registered Google account. If you are a new student, submit your registration and apply below.
                  </p>
                </div>
              </div>

              {/* Action buttons with minimum 44px touch targets */}
              <div className="pt-2 border-t border-[#F4C430]/20 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleTryDifferentAccount}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#262626] border border-[#D4D4D4] dark:border-[#404040] text-xs font-bold text-[#111111] dark:text-white hover:bg-[#FAFAFA] dark:hover:bg-[#333333] transition-colors shadow-xs active:scale-[0.99] cursor-pointer"
                >
                  <RefreshCw size={14} className="text-[#F4C430]" />
                  <span>Try a different Google account</span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Link
                    to="/register"
                    className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] text-xs font-extrabold transition-colors shadow-xs active:scale-[0.99]"
                  >
                    <UserPlus size={14} />
                    <span>Register & Apply</span>
                  </Link>

                  <a
                    href="https://wa.me/9230586969050?text=Hi%2C%20I%20would%20like%20assistance%20with%20SHS%20Virtual%20Academy%20admissions%20and%20roster%20access."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] dark:text-[#25D366] text-xs font-bold transition-colors"
                  >
                    <MessageCircle size={14} />
                    <span>Admissions Support</span>
                  </a>
                </div>
              </div>
            </div>
          ) : localError ? (
            /* ── Error State 2: Network / Popup / Cancelled / Generic ── */
            <div
              className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-left space-y-3 animate-fade-in"
              role="alert"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-red-900 dark:text-red-200">
                    {localError.type === 'network'
                      ? 'Connection Error'
                      : localError.type === 'popup'
                      ? 'Popup Blocked'
                      : localError.type === 'cancelled'
                      ? 'Sign-in Cancelled'
                      : 'Authentication Error'}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-0.5 leading-relaxed">
                    {localError.message}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="min-h-[44px] w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#1E1E1E] border border-red-200 dark:border-red-800 text-xs font-bold text-red-700 dark:text-red-300 hover:bg-red-100/50 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Retry Sign-In</span>
              </button>
            </div>
          ) : null}

          {/* Primary Google Sign-In Button (48px high target) */}
          <button
            id="google-sign-in"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signingIn || submittingEmail || authLoading}
            className="w-full min-h-[48px] flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl border border-[#D4D4D4] dark:border-[#333333] bg-white dark:bg-[#1A1A1A] hover:bg-[#F5F5F5] dark:hover:bg-[#262626] hover:border-[#A3A3A3] dark:hover:border-[#525252] active:scale-[0.99] transition-all font-bold text-sm text-[#262626] dark:text-white shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
            aria-label="Continue with Google account"
          >
            {signingIn ? (
              <>
                <Loader2 size={18} className="animate-spin text-[#737373] dark:text-[#A3A3A3]" />
                <span>Signing in with Google…</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none" aria-hidden="true" className="shrink-0">
                  <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
                  <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
                  <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
                  <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
                </svg>
                <span>Continue with Google</span>
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
                or sign in with email
              </span>
            </div>
          </div>

          {/* Unconfirmed Email Notice / Resend Option */}
          {unconfirmedEmail && (
            <div
              className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 text-left space-y-3 animate-fade-in"
              role="alert"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Please verify your email
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                    A confirmation link was sent to <strong className="font-semibold text-amber-950 dark:text-amber-100">{unconfirmedEmail}</strong>. Please check your inbox and verify before signing in.
                  </p>
                </div>
              </div>

              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending || resendCooldown > 0}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] text-xs font-extrabold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {resending ? <Loader2 size={13} className="animate-spin text-[#111111]" /> : <RefreshCw size={13} />}
                  <span>{resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend verification email'}</span>
                </button>
              </div>

              {resendNotice && (
                <p className="text-[11px] font-medium text-amber-950 dark:text-amber-200">
                  {resendNotice}
                </p>
              )}
            </div>
          )}

          {/* Email + Password Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4 text-left">
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
                  disabled={submittingEmail || signingIn || authLoading}
                  className="w-full h-12 pl-10 pr-4 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-[#D4D4D4] dark:border-[#333333] text-sm text-[#111111] dark:text-white placeholder-[#A3A3A3] focus:outline-hidden focus:border-[#F4C430] focus:ring-2 focus:ring-[#F4C430]/20 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#525252] dark:text-[#A3A3A3] uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#D4A017] dark:text-[#F4C430] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737373]">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={submittingEmail || signingIn || authLoading}
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
            </div>

            <button
              id="email-sign-in"
              type="submit"
              disabled={submittingEmail || signingIn || authLoading || !email.trim() || !password}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#F4C430] hover:bg-[#E5B520] active:scale-[0.99] transition-all font-extrabold text-sm text-[#111111] shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F4C430]"
            >
              {submittingEmail ? (
                <>
                  <Loader2 size={18} className="animate-spin text-[#111111]" />
                  <span>Signing in…</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Sign in vs Register & Apply explicit helper block */}
          <div className="mt-6 pt-5 border-t border-[#E5E5E5] dark:border-[#262626] text-center space-y-3">
            <p className="text-xs text-[#737373] dark:text-[#A3A3A3]">
              Existing members sign in above. New students{' '}
              <Link
                to="/register"
                className="font-bold text-[#D4A017] hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4A017] rounded"
              >
                register and apply
              </Link>
              .
            </p>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#A3A3A3] dark:text-[#737373]">
              <ShieldCheck size={13} className="text-[#F4C430]" />
              <span>Admins, Teachers, and Students use institutional Google sign-in.</span>
            </div>
          </div>

          {/* Terms & Privacy */}
          <p className="mt-6 text-center text-[11px] text-[#737373] dark:text-[#A3A3A3] leading-relaxed">
            By continuing, you agree to Scholario's{' '}
            <Link
              id="login-terms-link"
              to="/terms"
              className="font-medium text-[#111111] dark:text-white underline hover:text-[#D4A017]"
            >
              Terms of Service
            </Link>
            ,{' '}
            <Link
              id="login-privacy-link"
              to="/privacy"
              className="font-medium text-[#111111] dark:text-white underline hover:text-[#D4A017]"
            >
              Privacy Policy
            </Link>
            , and{' '}
            <Link
              id="login-refund-link"
              to="/refund"
              className="font-medium text-[#111111] dark:text-white underline hover:text-[#D4A017]"
            >
              Refund Policy
            </Link>
            .
          </p>
        </div>

        {/* Footer info */}
        <div className="w-full max-w-md pt-6 border-t border-[#F0F0F0] dark:border-[#1F1F1F] text-center">
          <p className="text-[11px] text-[#A3A3A3] dark:text-[#525252]">
            © {new Date().getFullYear()} Scholario · SHS Virtual Academy · Rawalpindi, Pakistan
          </p>
        </div>
      </div>

      {/* ─── Right panel: Desktop Split-Screen Brand & Benefits Panel (1024px+) ─── */}
      <div
        className="hidden lg:flex flex-1 flex-col justify-between p-12 xl:p-16 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #111111 0%, #1A1A1A 50%, #0D0D0D 100%)',
        }}
      >
        {/* Ambient subtle glow */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 pointer-events-none rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(244,196,48,0.12) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-96 h-96 pointer-events-none rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(244,196,48,0.06) 0%, transparent 70%)',
          }}
        />

        {/* Brand Kicker */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F4C430]/10 border border-[#F4C430]/20">
            <span className="text-xs font-bold text-[#F4C430] uppercase tracking-wider">
              SHS Virtual Academy Portal
            </span>
          </div>
        </div>

        {/* Center benefits copy */}
        <div className="relative z-10 max-w-lg space-y-8 my-auto">
          <div>
            <h2 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
              A private learning hub for serious academic success.
            </h2>
            <p className="text-sm xl:text-base text-[#A3A3A3] mt-3 leading-relaxed">
              Every class, lecture note, auto-evaluated test assessment, and attendance token is verified in real time.
            </p>
          </div>

          {/* Clean benefit rows */}
          <div className="space-y-4">
            {[
              {
                icon: Calendar,
                title: 'Live Structured Timetables',
                desc: 'FBISE, Punjab Board, Cambridge O/A Levels, and IELTS live classroom links.'
              },
              {
                icon: BookOpen,
                title: 'Curated Notes Vault',
                desc: 'Comprehensive derivations, past paper topical solutions, and syllabus-aligned PDFs.'
              },
              {
                icon: CheckCircle2,
                title: 'Rigorous Testing Center',
                desc: 'Automated MCQ grading with instant solutions and parent-monitored performance.'
              },
              {
                icon: Bot,
                title: 'Sage AI Academic Companion',
                desc: '24/7 syllabus-grounded concept explanations and step-by-step problem solver.'
              }
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-[#F4C430]/15 text-[#F4C430] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">{title}</h4>
                  <p className="text-[11px] text-[#8C8C8C] mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom trust row */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-[#737373]">
          <span>© {new Date().getFullYear()} Scholario</span>
          <span className="flex items-center gap-1.5 text-[#A3A3A3]">
            <ShieldCheck size={14} className="text-[#F4C430]" />
            Enterprise Google Identity Security
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
