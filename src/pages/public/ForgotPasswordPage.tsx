import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, MailCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Logo from '../../components/ui/Logo';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-8">
          <Link to="/"><Logo size="md" variant="full" /></Link>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F0FDF4] flex items-center justify-center mx-auto mb-5">
                <MailCheck size={28} className="text-[#22c55e]" />
              </div>
              <h2 className="text-xl font-extrabold text-[#111111] mb-2">Check your inbox</h2>
              <p className="text-sm text-[#737373] mb-6 leading-relaxed">
                We've sent a password reset link to <strong className="text-[#262626]">{email}</strong>. Check your email and follow the link.
              </p>
              <Link to="/login" className="btn btn-ghost btn-md w-full">
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-extrabold text-[#111111] mb-1">Forgot your password?</h2>
              <p className="text-sm text-[#737373] mb-6">Enter your email and we'll send you a reset link.</p>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-lg bg-[#FEF2F2] border border-[#ef444433] text-sm text-[#991b1b]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#262626] mb-1.5">Email address</label>
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary btn-md w-full disabled:opacity-60">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                    : <>Send Reset Link <ArrowRight size={16} /></>
                  }
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-[#737373]">
                <Link to="/login" className="font-semibold text-[#111111] hover:underline underline-offset-2">
                  ← Back to Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
