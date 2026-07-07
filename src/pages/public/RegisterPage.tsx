import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ChevronDown, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Logo from '../../components/ui/Logo';

// ─── Academy course options ───────────────────
const BOARDS = [
  { value: 'local', label: 'Local Board' },
  { value: 'fbise', label: 'FBISE' },
  { value: 'o_level', label: 'O Level' },
  { value: 'a_level', label: 'A Level' },
] as const;

const GRADES_BY_BOARD: Record<string, { value: string; label: string }[]> = {
  local: [
    { value: '9', label: 'Grade 9' },
    { value: '10', label: 'Grade 10' },
    { value: '11', label: 'Grade 11' },
    { value: '12', label: 'Grade 12' },
  ],
  fbise: [
    { value: '9', label: 'Grade 9' },
    { value: '10', label: 'Grade 10' },
    { value: '11', label: 'Grade 11 (FSc Part 1)' },
    { value: '12', label: 'Grade 12 (FSc Part 2)' },
  ],
  o_level: [
    { value: 'o1', label: 'O Level — Year 1' },
    { value: 'o2', label: 'O Level — Year 2' },
  ],
  a_level: [
    { value: 'as', label: 'AS Level' },
    { value: 'a2', label: 'A2 Level' },
  ],
};

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Computer Science', 'English', 'Urdu', 'Islamiat',
  'Pakistan Studies', 'Economics', 'Accounting', 'Statistics',
];

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  board: string;
  grade: string;
  subject: string;
  stream: string;
}

const STEPS = ['Account', 'Course'] as const;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState<FormData>({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
    board: '', grade: '', subject: '', stream: 'pre-engineering',
  });

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value;
    setForm((f) => {
      const next = { ...f, [field]: val };
      if (field === 'board') {
        next.stream = (val === 'o_level' || val === 'a_level')
          ? 'cambridge-pre-engineering'
          : 'pre-engineering';
      }
      return next;
    });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Create Supabase auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.fullName },
        },
      });

      if (signUpError) throw new Error(signUpError.message);
      if (!authData.user) throw new Error('Registration failed. Please try again.');

      // 2. Pre-provisioning check: see if email matches a teacher record
      let role: 'student' | 'teacher' = 'student';
      let phone = form.phone || null;

      const { data: teacherData } = await (supabase as any)
        .from('teachers')
        .select('*')
        .eq('email', form.email)
        .maybeSingle();

      if (teacherData) {
        role = 'teacher';
        phone = teacherData.phone || phone;
        await (supabase as any)
          .from('teachers')
          .update({ id: authData.user.id } as any)
          .eq('email', form.email);
      }

      // 3. Insert profile row
      const { error: profileError } = await (supabase as any).from('profiles').insert({
        id: authData.user.id,
        role,
        full_name: form.fullName,
        phone,
        stream: role === 'student' ? form.stream : undefined,
      });
      if (profileError) throw new Error(profileError.message);

      // Store stream and role locally for localhost bypass
      localStorage.setItem('student_stream', form.stream);
      localStorage.setItem('mock_role', role);

      // Navigate to correct dashboard based on role
      navigate(role === 'teacher' ? '/teacher' : '/student', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  };

  const gradesForBoard = form.board ? GRADES_BY_BOARD[form.board] ?? [] : [];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[480px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/"><Logo size="md" variant="full" /></Link>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-8 shadow-sm">
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                    style={{
                      background: i < step ? '#22c55e' : i === step ? '#111111' : '#F5F5F5',
                      color: i <= step ? '#fff' : '#A3A3A3',
                    }}
                  >
                    {i < step ? <Check size={12} /> : i + 1}
                  </div>
                  <span className={`text-sm font-medium ${i === step ? 'text-[#111111]' : 'text-[#A3A3A3]'}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px bg-[#E5E5E5]" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-[#FEF2F2] border border-[#ef444433] text-sm text-[#991b1b]">
              {error}
            </div>
          )}

          {/* ── Step 0: Account ── */}
          {step === 0 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#111111] tracking-tight mb-0.5">Create your account</h2>
                <p className="text-sm text-[#737373]">Fill in your basic details to get started.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#262626] mb-1.5">Full Name</label>
                <input type="text" required value={form.fullName} onChange={set('fullName')} placeholder="e.g. Ali Hassan" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#262626] mb-1.5">Email Address</label>
                <input type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#262626] mb-1.5">Phone Number <span className="text-[#A3A3A3] font-normal">(optional)</span></label>
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+92 300 0000000" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#262626] mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Min. 8 characters"
                    className="input pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#525252]">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#262626] mb-1.5">Confirm Password</label>
                <input type="password" required value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter password" className="input" />
              </div>

              <button type="submit" className="btn btn-primary btn-md w-full mt-2">
                Next Step <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* ── Step 1: Course ── */}
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#111111] tracking-tight mb-0.5">Select your class</h2>
                <p className="text-sm text-[#737373]">Pick the board, grade, and subject you're enrolling in.</p>
              </div>

              {/* Board */}
              <div>
                <label className="block text-sm font-medium text-[#262626] mb-1.5">Board</label>
                <div className="relative">
                  <select required value={form.board} onChange={set('board')} className="input appearance-none pr-9">
                    <option value="" disabled>Select board…</option>
                    {BOARDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] pointer-events-none" />
                </div>
              </div>

              {/* Grade */}
              <div>
                <label className="block text-sm font-medium text-[#262626] mb-1.5">Grade / Year</label>
                <div className="relative">
                  <select required value={form.grade} onChange={set('grade')} disabled={!form.board} className="input appearance-none pr-9 disabled:opacity-50 disabled:cursor-not-allowed">
                    <option value="" disabled>{form.board ? 'Select grade…' : 'Select board first'}</option>
                    {gradesForBoard.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] pointer-events-none" />
                </div>
              </div>

              {/* Academic Stream */}
              <div>
                <label className="block text-sm font-medium text-[#262626] mb-1.5">Academic Stream / Group</label>
                <div className="relative">
                  <select required value={form.stream} onChange={set('stream')} className="input appearance-none pr-9">
                    {(form.board === 'o_level' || form.board === 'a_level') ? (
                      <>
                        <option value="cambridge-pre-engineering">Cambridge Science (Pre-Engineering)</option>
                        <option value="cambridge-pre-medical">Cambridge Science (Pre-Medical)</option>
                        <option value="cambridge-computer-science">Cambridge Computer Science (ICS)</option>
                        <option value="cambridge-commerce">Cambridge Commerce (Accounts, Econ, Stats)</option>
                      </>
                    ) : (
                      <>
                        <option value="pre-engineering">Pre-Engineering (Physics, Chemistry, Maths)</option>
                        <option value="pre-medical">Pre-Medical (Physics, Chemistry, Biology)</option>
                        <option value="ics">ICS (Physics, Maths, Computer Science)</option>
                      </>
                    )}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] pointer-events-none" />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-[#262626] mb-1.5">Subject</label>
                <div className="relative">
                  <select required value={form.subject} onChange={set('subject')} className="input appearance-none pr-9">
                    <option value="" disabled>Select subject…</option>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] pointer-events-none" />
                </div>
              </div>

              {/* Note */}
              <div className="p-3.5 rounded-lg bg-[#FFFBF0] border border-[#F4C43033]">
                <p className="text-xs text-[#92700A] leading-relaxed">
                  ℹ️ Your enrollment will be confirmed once payment is verified. You'll receive access to your class schedule and notes shortly after.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(0)} className="btn btn-ghost btn-md flex-1">
                  Back
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary btn-md flex-2 flex-1 disabled:opacity-60">
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
                  ) : (
                    <>Create Account <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sign in link */}
        <p className="mt-5 text-center text-sm text-[#737373]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#111111] hover:underline underline-offset-2">
            Sign in
          </Link>
        </p>

        {/* Google OAuth */}
        {/* <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#E5E5E5]" />
          <span className="text-xs text-[#A3A3A3] font-medium">or sign up with</span>
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
        </button> */}
      </div>
    </div>
  );
};

export default RegisterPage;
