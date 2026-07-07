import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import Logo from '../../components/ui/Logo';

const LoginPage: React.FC = () => {
  const { signIn, profile, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (session && profile) {
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        if (profile.role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (profile.role === 'teacher') {
          navigate('/teacher', { replace: true });
        } else {
          navigate('/student', { replace: true });
        }
      }
    }
  }, [session, profile, from, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError);
      setLoading(false);
      return;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* ─── Left panel — form ─── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <Link to="/" className="inline-block mb-10">
            <Logo size="md" variant="full" />
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-sm text-[#737373]">
              Sign in to your Scholario account
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-[#FEF2F2] border border-[#ef444433] text-sm text-[#991b1b]">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#262626] mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-[#262626]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#737373] hover:text-[#111111] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#525252] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-md w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Google OAuth Button disabled for now
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E5E5E5]" />
            <span className="text-xs text-[#A3A3A3] font-medium">or continue with</span>
            <div className="flex-1 h-px bg-[#E5E5E5]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleOAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#FAFAFA] hover:border-[#D4D4D4] transition-all duration-200 font-semibold text-sm text-[#262626] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
              <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
              <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
              <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
              <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
            </svg>
            Continue with Google
          </button>
          */ }

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-[#737373]">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#111111] hover:underline underline-offset-2">
              Sign up
            </Link>
          </p>

          {/* Admin shortcut */}
          <div className="mt-6 pt-5 border-t border-[#F0F0F0]">
            <p className="flex items-center gap-1.5 text-xs text-[#A3A3A3] justify-center">
              <ShieldCheck size={12} className="text-[#F4C430]" />
              Admin access uses the same login — you'll be redirected automatically.
            </p>
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
        {/* Top quote */}
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
            Learn smarter,<br />
            <span style={{ color: '#F4C430' }}>achieve more.</span>
          </h2>
          <p className="text-[#737373] text-base leading-relaxed max-w-xs">
            Pakistan's most focused academy platform — built for students who are serious about their results.
          </p>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { val: '9–12', label: 'All Grades' },
              { val: '4 Boards', label: 'Local · FBISE · O · A Level' },
              { val: '100%', label: 'Focused Learning' },
              { val: 'Live', label: 'Class Schedule' },
            ].map(({ val, label }) => (
              <div key={label} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-lg font-extrabold text-white tracking-tight">{val}</div>
                <div className="text-xs text-[#525252] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="text-xs text-[#404040]">© 2025 Scholario · Made in Pakistan 🇵🇰</p>
      </div>
    </div>
  );
};

export default LoginPage;
