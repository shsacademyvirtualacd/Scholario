import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../features/auth/AuthContext';
import {
  evaluatePasswordStrength,
  mapAuthError,
  normalizeEmail,
} from '../../utils/authErrors';
import { toast } from 'sonner';

export const AccountSecurityCard: React.FC = () => {
  const { user, profile } = useAuth();

  // Local override when user sets a password during this session
  const [passwordSetLocally, setPasswordSetLocally] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Email verification resend state (60s cooldown)
  const [sendingVerify, setSendingVerify] = useState(false);
  const [verifyCooldown, setVerifyCooldown] = useState(0);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Password reset email state (60s cooldown)
  const [sendingReset, setSendingReset] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Cooldown timers
  useEffect(() => {
    if (verifyCooldown <= 0) return;
    const timer = setInterval(() => {
      setVerifyCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [verifyCooldown]);

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCooldown]);

  // Resolve account email
  const accountEmail = useMemo(() => {
    const raw =
      user?.email ||
      (profile as any)?.user?.email ||
      (profile as any)?.email ||
      '';
    return normalizeEmail(raw);
  }, [user, profile]);

  // Detect linked providers from user.identities and user.app_metadata.providers
  const { isGoogleConnected, hasPassword } = useMemo(() => {
    const identities: Array<{ provider?: string }> = Array.isArray(user?.identities)
      ? user!.identities!
      : [];
    const identityProviders = identities
      .map((id) => (id.provider || '').toLowerCase())
      .filter(Boolean);

    const metaProviders: string[] = Array.isArray(user?.app_metadata?.providers)
      ? user!.app_metadata.providers.map((p: string) => String(p).toLowerCase())
      : [];

    const primaryProvider = String(user?.app_metadata?.provider || '').toLowerCase();

    const allProviders = new Set<string>([
      ...identityProviders,
      ...metaProviders,
      ...(primaryProvider ? [primaryProvider] : []),
    ]);

    const googleLinked = allProviders.has('google');
    const emailIdentityLinked =
      allProviders.has('email') ||
      Boolean(user?.user_metadata?.has_password) ||
      passwordSetLocally;

    return {
      isGoogleConnected: googleLinked,
      hasPassword: emailIdentityLinked,
    };
  }, [user, passwordSetLocally]);

  // Determine whether email is verified based on email_confirmed_at (or Google OAuth verification)
  const isEmailVerified = useMemo(() => {
    if (!user) return false;
    if (user.email_confirmed_at || (user as any).confirmed_at) {
      return true;
    }
    if (isGoogleConnected && user.user_metadata?.email_verified !== false) {
      return true;
    }
    const googleIdentity = Array.isArray(user.identities)
      ? user.identities.find((id) => id.provider === 'google')
      : null;
    if (googleIdentity?.identity_data?.email_verified) {
      return true;
    }
    return false;
  }, [user, isGoogleConnected]);

  // Live password strength & matching validation
  const strength = useMemo(() => evaluatePasswordStrength(newPassword), [newPassword]);
  const passwordsMatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;
  const isSameAsCurrent =
    hasPassword &&
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    currentPassword === newPassword;

  // Verify email handler
  const handleResendVerification = async () => {
    if (!accountEmail || sendingVerify || verifyCooldown > 0) return;
    setSendingVerify(true);
    setVerifyError(null);
    setVerifyMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: accountEmail,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error('[AccountSecurityCard] resend verification error:', error);
        const mapped = mapAuthError(error);
        setVerifyError(mapped.message);
        toast.error(mapped.message);
        return;
      }

      setVerifyCooldown(60);
      const msg = `Verification link sent to ${accountEmail}. Please check your inbox and spam folder.`;
      setVerifyMessage(msg);
      toast.success('Verification email sent!');
    } catch (err: any) {
      console.error('[AccountSecurityCard] resend verification exception:', err);
      const mapped = mapAuthError(err);
      setVerifyError(mapped.message);
    } finally {
      setSendingVerify(false);
    }
  };

  // Send password reset email handler
  const handleSendResetEmail = async () => {
    if (!accountEmail || sendingReset || resetCooldown > 0) return;
    setSendingReset(true);
    setPasswordError(null);
    setResetMessage(null);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(accountEmail, {
        redirectTo,
      });

      if (error) {
        console.error('[AccountSecurityCard] resetPasswordForEmail error:', error);
        const mapped = mapAuthError(error);
        setPasswordError(mapped.message);
        toast.error(mapped.message);
        return;
      }

      setResetCooldown(60);
      const msg = `Password reset link sent to ${accountEmail}. Click the link in your email to set a new password.`;
      setResetMessage(msg);
      toast.success('Password reset email sent!');
    } catch (err: any) {
      console.error('[AccountSecurityCard] resetPasswordForEmail exception:', err);
      const mapped = mapAuthError(err);
      setPasswordError(mapped.message);
    } finally {
      setSendingReset(false);
    }
  };

  // Submit Set Password (Case A) or Change Password (Case B)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingPassword) return;

    setPasswordError(null);
    setPasswordSuccess(null);
    setResetMessage(null);

    if (!strength.hasMinLength) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Confirm password does not match your new password.');
      return;
    }

    if (hasPassword) {
      if (!currentPassword) {
        setPasswordError(
          'Please enter your current password to verify your identity, or use "Send password reset email" below.'
        );
        return;
      }
      if (currentPassword === newPassword) {
        setPasswordError('Your new password must be different from your current password.');
        return;
      }
    }

    setSubmittingPassword(true);
    try {
      // Case B: Re-authenticate with current password first so we verify it safely
      if (hasPassword && accountEmail) {
        const { error: verifyErr } = await supabase.auth.signInWithPassword({
          email: accountEmail,
          password: currentPassword,
        });

        if (verifyErr) {
          console.error('[AccountSecurityCard] Current password verification failed:', verifyErr);
          const rawMsg = (verifyErr.message || '').toLowerCase();
          if (
            verifyErr.code === 'invalid_credentials' ||
            rawMsg.includes('invalid login credentials') ||
            rawMsg.includes('invalid credentials')
          ) {
            setPasswordError(
              'Your current password is incorrect. Please try again or use "Send password reset email" below.'
            );
          } else {
            const mapped = mapAuthError(verifyErr);
            setPasswordError(mapped.message);
          }
          return;
        }
      }

      // Update password on the signed-in user (keeps the exact same user ID, email, and profile row)
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          has_password: true,
          password_updated_at: new Date().toISOString(),
        },
      });

      if (updateErr) {
        console.error('[AccountSecurityCard] updateUser password error:', updateErr);
        const mapped = mapAuthError(updateErr);
        setPasswordError(mapped.message);
        return;
      }

      const wasSettingFirstTime = !hasPassword;
      setPasswordSetLocally(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      const successText = wasSettingFirstTime
        ? 'Password set! Email & password sign-in is now enabled for your account alongside Google sign-in.'
        : 'Your password has been changed successfully.';
      setPasswordSuccess(successText);
      toast.success(wasSettingFirstTime ? 'Password set successfully!' : 'Password updated!');
    } catch (err: any) {
      console.error('[AccountSecurityCard] Password update exception:', err);
      const mapped = mapAuthError(err);
      setPasswordError(mapped.message);
    } finally {
      setSubmittingPassword(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#101726] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex items-start justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3.5">
        <div>
          <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#F2C230]" />
            <span>Sign-in &amp; Security</span>
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manage your verified email address, linked sign-in methods, and account password.
          </p>
        </div>
      </div>

      {/* 1. Email & Verification Status Row */}
      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#F2C230]/15 border border-[#F2C230]/30 text-[#B45309] dark:text-[#F2C230] flex items-center justify-center shrink-0">
              <Mail size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Account Email
                </span>
                {isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    <CheckCircle2 size={11} />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                    <AlertCircle size={11} />
                    <span>Not verified</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate mt-0.5">
                {accountEmail || 'No email address found'}
              </p>
            </div>
          </div>

          {!isEmailVerified && accountEmail && (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={sendingVerify || verifyCooldown > 0}
              className="px-3.5 py-2 rounded-xl bg-[#F2C230] hover:bg-[#e0b024] text-neutral-950 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 min-h-[38px]"
            >
              {sendingVerify ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Sending…</span>
                </>
              ) : verifyCooldown > 0 ? (
                <span>Verify email ({verifyCooldown}s)</span>
              ) : (
                <>
                  <Send size={13} />
                  <span>Verify email</span>
                </>
              )}
            </button>
          )}
        </div>

        {verifyMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{verifyMessage}</span>
          </div>
        )}

        {verifyError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{verifyError}</span>
          </div>
        )}
      </div>

      {/* 2. Linked Sign-in Methods */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
          Linked Sign-in Methods
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Google Method Tile */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-neutral-900 dark:text-white">Google</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  {isGoogleConnected ? 'Google OAuth sign-in' : 'Use Continue with Google on login'}
                </p>
              </div>
            </div>

            {isGoogleConnected ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                <CheckCircle2 size={11} />
                <span>Connected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200/70 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 shrink-0">
                <span>Available</span>
              </span>
            )}
          </div>

          {/* Email & Password Method Tile */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[#B45309] dark:text-[#F2C230] flex items-center justify-center shrink-0">
                <KeyRound size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-neutral-900 dark:text-white">
                  Email &amp; password
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  {hasPassword ? 'Direct email & password login' : 'No password configured yet'}
                </p>
              </div>
            </div>

            {hasPassword ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                <CheckCircle2 size={11} />
                <span>Enabled</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shrink-0">
                <span>Not set</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Password Card: Case A ("Set a password") or Case B ("Change password") */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/50 border border-neutral-200/80 dark:border-neutral-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <Lock size={15} className="text-[#F2C230]" />
              <span>{hasPassword ? 'Change password' : 'Set a password'}</span>
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {hasPassword
                ? 'Enter your current password to set a new password, or request a password reset email.'
                : 'Add a password so you can also sign in with your email.'}
            </p>
          </div>
        </div>

        {passwordError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{passwordSuccess}</span>
          </div>
        )}

        {resetMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{resetMessage}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
          {/* Current Password (only for Case B when user already has a password) */}
          {hasPassword && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                Current Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Lock size={15} />
                </div>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="Enter your current password"
                  disabled={submittingPassword}
                  autoComplete="current-password"
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-[#F2C230] focus:ring-2 focus:ring-[#F2C230]/20 transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                  aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                >
                  {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* New Password */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Lock size={15} />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="Minimum 8 characters"
                  disabled={submittingPassword}
                  autoComplete="new-password"
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-[#F2C230] focus:ring-2 focus:ring-[#F2C230]/20 transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                >
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Lock size={15} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="Re-enter new password"
                  disabled={submittingPassword}
                  autoComplete="new-password"
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-[#F2C230] focus:ring-2 focus:ring-[#F2C230]/20 transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {/* Live Validation & Password Strength Bar */}
          {(newPassword.length > 0 || confirmPassword.length > 0) && (
            <div className="space-y-1.5 pt-0.5">
              {newPassword.length > 0 && (
                <>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500 dark:text-neutral-400">
                      Password strength:{' '}
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
                    </span>
                    <span
                      className={`font-semibold ${
                        strength.hasMinLength
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {strength.hasMinLength
                        ? '✓ At least 8 characters'
                        : `${newPassword.length}/8 characters minimum`}
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

                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Use 8+ characters with a mix of letters, numbers, and symbols.
                  </p>
                </>
              )}

              {isSameAsCurrent && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  ✗ New password must be different from your current password
                </p>
              )}

              {confirmPassword.length > 0 && (
                <p
                  className={`text-[11px] font-semibold ${
                    passwordsMatch
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
            {hasPassword ? (
              <button
                type="button"
                onClick={handleSendResetEmail}
                disabled={sendingReset || resetCooldown > 0 || !accountEmail}
                className="text-xs font-bold text-[#B45309] dark:text-[#F2C230] hover:underline inline-flex items-center gap-1.5 disabled:opacity-50 disabled:no-underline cursor-pointer self-start sm:self-auto"
              >
                {sendingReset ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Sending reset email…</span>
                  </>
                ) : resetCooldown > 0 ? (
                  <span>Reset email sent (retry in {resetCooldown}s)</span>
                ) : (
                  <>
                    <RefreshCw size={13} />
                    <span>Send password reset email</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Google sign-in will continue to work after setting a password.
              </span>
            )}

            <button
              type="submit"
              disabled={
                submittingPassword ||
                !strength.hasMinLength ||
                !passwordsMatch ||
                isSameAsCurrent ||
                (hasPassword && !currentPassword)
              }
              className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#F2C230] hover:bg-[#e0b024] text-neutral-950 font-extrabold text-xs inline-flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer self-end sm:self-auto"
            >
              {submittingPassword ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>{hasPassword ? 'Updating password…' : 'Setting password…'}</span>
                </>
              ) : (
                <>
                  <KeyRound size={15} />
                  <span>{hasPassword ? 'Change password' : 'Set password'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountSecurityCard;
