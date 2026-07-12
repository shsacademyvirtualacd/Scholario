import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import Logo from '../../components/ui/Logo';

export const RegisterPage: React.FC = () => {
  const { signInWithGoogle, profile, session, loading: authLoading, needsOnboarding } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Redirect once authenticated ────────────────────────────────────────────
  React.useEffect(() => {
    if (authLoading) return;

    if (session) {
      if (!profile) {
        // New user goes to unregistered page to fill the student registration form
        navigate('/unregistered', { replace: true });
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
  }, [session, profile, from, navigate, authLoading, needsOnboarding]);

  // ── Google sign-up handler ─────────────────────────────────────────────────
  const handleGoogleSignUp = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-up failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex page-transition">
      {/* ─── Left panel — signup ─── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <Link to="/" className="inline-block mb-10">
            <Logo size="md" variant="full" />
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight mb-2">
              Create Student Account
            </h1>
            <p className="text-sm text-[#737373]">
              Sign up using your Google account to get started with Scholario LMS.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-[#FEF2F2] border border-[#ef444433] text-sm text-[#991b1b]">
              {error}
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            id="google-sign-up"
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading || authLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#FAFAFA] hover:border-[#D4D4D4] hover:shadow-md active:scale-[0.98] transition-all duration-200 font-semibold text-sm text-[#262626] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed interactive"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin text-[#737373]" />
                Signing up…
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
                  <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
                  <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
                  <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
                </svg>
                Sign Up with Google
              </>
            )}
          </button>

          {/* Quick Notice */}
          <div className="mt-6 p-4 rounded-xl bg-blue-50/50 border border-blue-100/50 text-left">
            <p className="text-xs text-blue-900 leading-relaxed">
              <strong>Registration is free.</strong> Once signed up, you can select your courses, retrieve tuition payment details, and complete activation proof via WhatsApp.
            </p>
          </div>

          {/* Switch to login */}
          <div className="mt-6 text-center text-xs text-[#737373]">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#F4C430] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Right panel — branding (desktop only) ─── */}
      <div
        className="hidden lg:flex flex-1 flex-col justify-between p-12"
        style={{
          background: 'linear-gradient(135deg, #111111 0%, #1a1a1a 60%, #0d0d0d 100%)',
        }}
      >
        <div />

        {/* Center content */}
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
            style={{ background: 'rgba(244,196,48,0.12)', border: '1px solid rgba(244,196,48,0.2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#F4C430]" />
            <span className="text-xs font-semibold text-[#F4C430]">SHS Academy — Scholario</span>
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-5">
            Start your learning<br />
            <span style={{ color: '#F4C430' }}>journey today.</span>
          </h2>
          <p className="text-[#737373] text-base leading-relaxed max-w-xs">
            Join Pakistan's most focused academy platform. Access premium notes, live class schedules, and smart tracking.
          </p>
        </div>

        <p className="text-xs text-[#404040]">© 2025 Scholario · Made in Pakistan 🇵🇰</p>
      </div>
    </div>
  );
};

export default RegisterPage;
