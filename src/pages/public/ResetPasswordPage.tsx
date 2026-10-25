import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Logo from '../../components/ui/Logo';
import { evaluatePasswordStrength, mapAuthError } from '../../utils/authErrors';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [checkingRecovery, setCheckingRecovery] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Strength evaluation
  const strength = evaluatePasswordStrength(password);
  const doPasswordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  // 1. Detect recovery session on mount (supports #access_token, ?code= PKCE, and ?token_hash= OTP)
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setIsRecoveryReady(true);
        setCheckingRecovery(false);
      }
    });

    const initializeRecoverySession = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

        const tokenHash =
          searchParams.get('token_hash') ||
          searchParams.get('token') ||
          hashParams.get('token_hash');
        const type = searchParams.get('type') || hashParams.get('type');
        const code = searchParams.get('code');

        // A. Direct token_hash / OTP verification if present in URL
        if (tokenHash && (type === 'recovery' || !type)) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          if (error) {
            console.error('[ResetPasswordPage] verifyOtp recovery error:', error);
          } else if (data?.session && mounted) {
            setIsRecoveryReady(true);
            setCheckingRecovery(false);
            return;
          }
        }

        // B. PKCE ?code= exchange if present and not yet exchanged by detectSessionInUrl
        if (code) {
          const { data: existing } = await supabase.auth.getSession();
          if (existing?.session && mounted) {
            setIsRecoveryReady(true);
            setCheckingRecovery(false);
            return;
          }
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            // detectSessionInUrl may have already consumed the code; re-check session
            const { data: retry } = await supabase.auth.getSession();
            if (retry?.session && mounted) {
              setIsRecoveryReady(true);
              setCheckingRecovery(false);
              return;
            }
            console.error('[ResetPasswordPage] exchangeCodeForSession error:', error);
          } else if (data?.session && mounted) {
            setIsRecoveryReady(true);
            setCheckingRecovery(false);
            return;
          }
        }

        // C. Check active session (including hash #access_token parsed by Supabase client)
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session) {
          setIsRecoveryReady(true);
          setCheckingRecovery(false);
          return;
        }

        // Give onAuthStateChange a brief window if hash contains recovery tokens
        if (window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery')) {
          setTimeout(async () => {
            if (!mounted) return;
            const { data: { session: delayedSession } } = await supabase.auth.getSession();
            if (delayedSession) {
              setIsRecoveryReady(true);
            }
            setCheckingRecovery(false);
          }, 800);
        } else {
          setCheckingRecovery(false);
        }
      } catch (err) {
        console.error('[ResetPasswordPage] Error checking recovery session:', err);
        if (mounted) setCheckingRecovery(false);
      }
    };

    initializeRecoverySession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!strength.hasMinLength) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        const mapped = mapAuthError(error);
        setErrorMessage(mapped.message);
        return;
      }

      setSuccess(true);
      // Clean up recovery session and navigate to login after brief display
      setTimeout(async () => {
        try {
          await supabase.auth.signOut();
        } catch {}
        navigate('/login', {
          replace: true,
          state: { message: 'Password updated successfully! Please sign in with your new password.' },
        });
      }, 2500);
    } catch (err: any) {
      const mapped = mapAuthError(err);
      setErrorMessage(mapped.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0D0D0D] text-[#111111] dark:text-[#E5E5E5] flex flex-col justify-between items-center px-4 sm:px-8 py-10 sm:py-12 page-transition">
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
          ← Back to Sign In
        </Link>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md my-auto py-8">
        {checkingRecovery ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#737373]">
            <Loader2 size={24} className="animate-spin text-[#F4C430]" />
            <span className="text-xs font-medium">Verifying password recovery session...</span>
          </div>
        ) : success ? (
          /* Success Screen */
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#141416] border border-black/[0.08] dark:border-white/[0.08] shadow-sm text-center space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-black text-[#111111] dark:text-white">
              Password Updated Successfully!
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#A3A3A3] leading-relaxed">
              Your password has been changed. Redirecting you to the sign-in page...
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F4C430] text-[#111111] font-bold text-xs hover:bg-[#E5B520] transition-colors shadow-xs"
              >
                <span>Sign In Now</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : !isRecoveryReady ? (
          /* Expired or Missing Link Notice */
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#141416] border border-black/[0.08] dark:border-white/[0.08] shadow-sm text-center space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-[#D4A017] dark:text-[#F4C430] flex items-center justify-center mx-auto">
              <KeyRound size={28} />
            </div>
            <h2 className="text-xl font-black text-[#111111] dark:text-white">
              Reset Link Required
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#A3A3A3] leading-relaxed">
              This recovery link is invalid, expired, or has already been used. Please request a fresh password reset link from the sign-in page.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                to="/login"
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#F4C430] text-[#111111] font-bold text-xs hover:bg-[#E5B520] transition-colors shadow-xs"
              >
                <span>Go to Sign In</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          /* Reset Password Form */
          <div className="space-y-6">
            <div className="text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4C430]/10 text-[#D4A017] dark:text-[#F4C430] text-xs font-bold mb-3">
                <ShieldCheck size={14} />
                <span>Account Security</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#111111] dark:text-white tracking-tight mb-2">
                Choose a new password
              </h1>
              <p className="text-xs sm:text-sm text-[#737373] dark:text-[#A3A3A3] leading-relaxed">
                Create a strong password with at least 8 characters to secure your Scholario LMS account.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#525252] dark:text-[#A3A3A3] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737373]">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    disabled={submitting}
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

                {/* Inline password strength indicator */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1.5 animate-fade-in">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#737373]">Password strength:</span>
                      <span
                        className={`font-bold ${
                          strength.score >= 3
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : strength.score === 2
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {strength.feedback}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`flex-1 h-full rounded-full transition-all duration-300 ${
                            strength.score >= step
                              ? strength.score >= 3
                                ? 'bg-emerald-500'
                                : strength.score === 2
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                              : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-[#737373]">
                      Must contain at least 8 characters with numbers or symbols.
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#525252] dark:text-[#A3A3A3] mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737373]">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    disabled={submitting}
                    className="w-full h-12 pl-10 pr-11 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-[#D4D4D4] dark:border-[#333333] text-sm text-[#111111] dark:text-white placeholder-[#A3A3A3] focus:outline-hidden focus:border-[#F4C430] focus:ring-2 focus:ring-[#F4C430]/20 transition-all font-medium"
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
                {confirmPassword.length > 0 && (
                  <p
                    className={`mt-1 text-[11px] font-medium ${
                      doPasswordsMatch
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {doPasswordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !strength.hasMinLength || !doPasswordsMatch}
                className="w-full min-h-[48px] mt-2 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#F4C430] hover:bg-[#E5B520] active:scale-[0.99] transition-all font-extrabold text-sm text-[#111111] shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F4C430]"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-[#111111]" />
                    <span>Updating password…</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="w-full max-w-md pt-6 border-t border-[#F0F0F0] dark:border-[#1F1F1F] text-center">
        <p className="text-[11px] text-[#A3A3A3] dark:text-[#525252]">
          © {new Date().getFullYear()} Scholario · SHS Virtual Academy · Rawalpindi, Pakistan
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
