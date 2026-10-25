import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import Logo from '../../components/ui/Logo';
import { normalizeEmail, mapAuthError } from '../../utils/authErrors';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPasswordForEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPasswordForEmail(cleanEmail);
      // Requirement: Always show the same generic message for security
      setSubmitted(true);
    } catch (err: any) {
      const mapped = mapAuthError(err);
      if (mapped.isRateLimited) {
        setErrorMessage(mapped.message);
      } else {
        // Uniform message regardless of whether user exists
        setSubmitted(true);
      }
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

      {/* Main Card */}
      <div className="w-full max-w-md my-auto py-8">
        {submitted ? (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#141416] border border-black/[0.08] dark:border-white/[0.08] shadow-sm text-center space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-[#D4A017] dark:text-[#F4C430] flex items-center justify-center mx-auto">
              <CheckCircle2 size={30} />
            </div>
            <h2 className="text-xl font-black text-[#111111] dark:text-white">
              Check your inbox
            </h2>
            <p className="text-xs sm:text-sm text-[#737373] dark:text-[#A3A3A3] leading-relaxed">
              If an account exists for <span className="font-semibold text-[#111111] dark:text-white">{email}</span>, a secure password reset link has been dispatched to your email.
            </p>
            <p className="text-[11px] text-[#888888]">
              Be sure to check your Spam or Promotions folder if you don't see it within a couple of minutes.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F4C430] text-[#111111] font-bold text-xs hover:bg-[#E5B520] transition-colors shadow-xs"
              >
                <span>Return to Sign In</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4C430]/10 text-[#D4A017] dark:text-[#F4C430] text-xs font-bold mb-3">
                <ShieldCheck size={14} />
                <span>Password Recovery</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#111111] dark:text-white tracking-tight mb-2">
                Forgot your password?
              </h1>
              <p className="text-xs sm:text-sm text-[#737373] dark:text-[#A3A3A3] leading-relaxed">
                Enter your registered email address and we'll send you a link to reset your password.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#525252] dark:text-[#A3A3A3] mb-1.5">
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
                    required
                    disabled={submitting}
                    className="w-full h-12 pl-10 pr-4 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-[#D4D4D4] dark:border-[#333333] text-sm text-[#111111] dark:text-white placeholder-[#A3A3A3] focus:outline-hidden focus:border-[#F4C430] focus:ring-2 focus:ring-[#F4C430]/20 transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !email.trim()}
                className="w-full min-h-[48px] flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#F4C430] hover:bg-[#E5B520] active:scale-[0.99] transition-all font-extrabold text-sm text-[#111111] shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F4C430]"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-[#111111]" />
                    <span>Sending reset link…</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white transition-colors"
              >
                Remember your password? <span className="text-[#D4A017] font-bold">Sign In</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full max-w-md pt-6 border-t border-[#F0F0F0] dark:border-[#1F1F1F] text-center">
        <p className="text-[11px] text-[#A3A3A3] dark:text-[#525252]">
          © {new Date().getFullYear()} Scholario · SHS Virtual Academy · Rawalpindi, Pakistan
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
