import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { toast } from 'sonner';

// ─── Context shape ────────────────────────────────────────────────────────────
interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  /** True when user signed in with Google but their email isn't in the roster */
  rosterRejected: boolean;
  /** True if the user's roster entry has been suspended */
  suspended: boolean;
  /** True if the user's roster entry is suspended specifically for unpaid monthly fees */
  isBillingSuspended?: boolean;
  /** True for a student whose profile exists but onboarding (stream) is not done */
  needsOnboarding: boolean;
  /** Active fee status for students ('unpaid', 'pending', 'paid') */
  feeStatus: 'unpaid' | 'pending' | 'paid' | null;
  /** Human readable auth error */
  authError: string | null;
  /** Initiates Google OAuth flow (redirect-based). */
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Bypasses billing suspension lock to allow user into checkout */
  proceedToPaymentCheckout?: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [feeStatus, setFeeStatus] = useState<'unpaid' | 'pending' | 'paid' | null>(null);

  // Transient flag: set when a real Google sign-in is rejected due to missing roster entry.
  const [rosterRejected, setRosterRejected] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const [isBillingSuspended, setIsBillingSuspended] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Guard against provisionProfile running twice for the same user ID
  const processingRef = useRef<Set<string>>(new Set());
  const profileRef = useRef<Profile | null>(null);
  const cachedProfileRef = useRef<Profile | null>(null);

  const proceedToPaymentCheckout = () => {
    if (cachedProfileRef.current) {
      setProfile(cachedProfileRef.current);
      setFeeStatus('unpaid'); // Trap them at checkout
      setIsBillingSuspended(false);
    }
  };

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // ── Compute onboarding state ──────────────────────────────────────────────
  // A student needs onboarding if they have a profile but stream is not set
  // or onboarding_complete is false.
  const needsOnboarding =
    profile?.role === 'student' &&
    (!profile?.stream || !(profile as any).onboarding_complete);

  // ── Fetch profile by auth UID ─────────────────────────────────────────────
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, class:classes(*, board:boards(*)), stream_obj:streams(*)')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Auth] fetchProfile error:', error.message, error.code);
      setAuthError('Unable to load your profile data. Please try again later.');
      return null;
    }
    return data ?? null;
  };

  // ── Real Supabase: roster-gated profile provisioning ─────────────────────
  const provisionProfile = async (newSession: Session) => {
    const userId = newSession.user.id;
    const email  = newSession.user.email ?? '';

    // Prevent double-run for the same auth event
    if (processingRef.current.has(userId)) {
      console.log('[Auth] provisionProfile already running for', userId, '— skipping duplicate');
      return;
    }
    processingRef.current.add(userId);

    setLoading(true);
    console.log('[Auth] provisionProfile started for', email, '(uid:', userId, ')');

    try {
      // ── Step 1: Check if profile already exists ──────────────────────────
      // Do this FIRST — the DB trigger may have already created it, or this
      // is a returning user. If profile exists, we're done.
      console.log('[Auth] Step 1: Checking for existing profile...');
      const existing = await fetchProfile(userId);

      if (existing) {
        // Admin users bypass the roster existence check
        if (existing.role === 'admin') {
          console.log('[Auth] ✅ Admin user bypassing roster check:', email);
          setProfile(existing);
          setFeeStatus('paid');
          return;
        }

        // Check roster verification + ensure profile_id is linked to real auth.uid
        const { data: rosterEntry } = await (supabase as any)
          .from('roster')
          .select('id, suspended, fee_suspended, profile_id')
          .eq('email', email)
          .maybeSingle();

        if (!rosterEntry) {
          console.warn('[Auth] ❌ User profile exists, but email is NOT in roster:', email);
          setRosterRejected(true);
          setProfile(null);
          setFeeStatus(null);
          setLoading(false);
          return;
        }

        if (rosterEntry.fee_suspended) {
          console.warn('[Auth] ❌ Billing access suspended for:', email);
          setIsBillingSuspended(true);
          cachedProfileRef.current = existing;
          setRosterRejected(true);
          setProfile(null);
          setFeeStatus(null);
          setLoading(false);
          return;
        }

        if (rosterEntry.suspended) {
          console.warn('[Auth] ❌ Access has been suspended for:', email);
          setSuspended(true);
          setRosterRejected(true);
          setProfile(null);
          setFeeStatus(null);
          setLoading(false);
          return;
        }

        // ── Defense-in-depth: Re-link roster.profile_id if it is stale ───
        // Handles the case where a placeholder profile was created during
        // pre-provisioning (via add_to_roster) but the teacher/student has
        // now logged in with their real auth.uid(). We must update roster so
        // handle_roster_profile_link() (or equivalent queries) resolve correctly.
        if (rosterEntry.profile_id !== userId) {
          console.warn('[Auth] ⚠️ roster.profile_id mismatch — relinking to real uid:', userId);
          const { error: relinkError } = await (supabase as any)
            .from('roster')
            .update({ profile_id: userId })
            .eq('id', rosterEntry.id);
          if (relinkError) {
            console.warn('[Auth] ⚠️ Roster relink failed (non-fatal):', relinkError.message);
          } else {
            console.log('[Auth] ✅ Roster relinked to real auth.uid');
          }
        }

        console.log('[Auth] ✅ Existing profile found — role:', existing.role);
        setSuspended(false);
        setIsBillingSuspended(false);
        setRosterRejected(false);
        setProfile(existing);
        if (existing.role === 'student') {
          const { data: feeData } = await (supabase as any)
            .from('fee_statuses')
            .select('status')
            .eq('student_id', userId)
            .maybeSingle();
          setFeeStatus((feeData?.status as any) ?? 'unpaid');
        } else {
          setFeeStatus('paid');
        }
        return;
      }

      // ── Step 2: No profile yet — check roster ────────────────────────────
      console.log('[Auth] Step 2: No profile found. Roster lookup for', email);
      const { data: rosterEntry, error: rosterError } = await (supabase as any)
        .from('roster')
        .select('role, full_name, class_ids, profile_id, suspended, fee_suspended')
        .eq('email', email)
        .maybeSingle();

      if (rosterError) {
        console.error('[Auth] ❌ Roster lookup FAILED:', rosterError.message, rosterError);
        setAuthError('Failed to verify institutional roster. Please contact support.');
        // Treat as rejected — safer to show unregistered than crash
        setRosterRejected(true);
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }

      // ── Step 3: Email not in roster → deny ──────────────────────────────
      if (!rosterEntry) {
        console.warn('[Auth] ❌ Email NOT found in roster:', email);
        setAuthError('Your email is not listed on the institutional roster. Contact administration.');
        setRosterRejected(true);
        // Do NOT call signOut here so the user can fill the registration form
        setProfile(null);
        setFeeStatus(null);
        setLoading(false);
        return;
      }

      if (rosterEntry.fee_suspended) {
        console.warn('[Auth] ❌ Billing access suspended (first login) for:', email);
        setAuthError('Your access is temporarily restricted due to pending fees.');
        setIsBillingSuspended(true);
        setRosterRejected(true);
        setProfile(null);
        setFeeStatus(null);
        setLoading(false);
        return;
      }

      if (rosterEntry.suspended) {
        console.warn('[Auth] ❌ Access has been suspended (first login) for:', email);
        setAuthError('Your account has been suspended. Please contact administration.');
        setSuspended(true);
        setRosterRejected(true);
        setProfile(null);
        setFeeStatus(null);
        setLoading(false);
        return;
      }

      console.log('[Auth] ✅ Roster entry found:', JSON.stringify(rosterEntry));
      setSuspended(false);
      setIsBillingSuspended(false);
      setRosterRejected(false);

      // ── Step 4: First login — create/claim profile ───────────────────────
      const role: 'admin' | 'teacher' | 'student' = rosterEntry.role;
      const fullName: string =
        rosterEntry.full_name ||
        newSession.user.user_metadata?.full_name ||
        email;

      if (role !== 'student') {
        console.log('[Auth] Step 4: Claiming/promoting pre-provisioned roster profile for role:', role);
        const { data: claimedProfile, error: claimError } = await (supabase as any)
          .rpc('claim_my_roster_profile');

        if (claimError) {
          console.error('[Auth] ❌ claim_my_roster_profile RPC FAILED:', claimError.message, claimError);
          setAuthError('Failed to link institutional account. Please contact support.');
          toast.error('Failed to claim pre-provisioned roster profile.');
          setRosterRejected(true);
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          return;
        }

        console.log('[Auth] ✅ Profile claimed/promoted successfully via RPC:', JSON.stringify(claimedProfile));
        toast.success(`Account claimed successfully as ${role}!`);
      } else {
        console.log('[Auth] Step 4: Creating new student profile — name:', fullName);

        // For students: onboarding_complete = false (they must pick grade/board/stream)
        const profilePayload: Record<string, unknown> = {
          id: userId,
          role,
          full_name: fullName,
          avatar_url: newSession.user.user_metadata?.avatar_url ?? null,
          phone: null,
          onboarding_complete: false,
        };

        const { error: insertError } = await (supabase as any)
          .from('profiles')
          .insert(profilePayload);

        if (insertError) {
          // If it's a duplicate key error, the DB trigger already created the profile.
          // Try to fetch it instead of giving up.
          if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
            console.warn('[Auth] ⚠️ Profile INSERT duplicate — DB trigger already created it. Fetching...');
            const retried = await fetchProfile(userId);
            if (retried) {
              setProfile(retried);
              // Still link roster below
            } else {
              console.error('[Auth] ❌ Could not fetch profile after duplicate error');
              setAuthError('Error loading created profile. Please sign in again.');
              setRosterRejected(true);
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setProfile(null);
              return;
            }
          } else {
            console.error('[Auth] ❌ Profile INSERT FAILED:', insertError.message, insertError);
            setAuthError('Failed to create your profile. Please contact support.');
            setRosterRejected(true);
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setProfile(null);
            return;
          }
        } else {
          console.log('[Auth] ✅ Student profile created successfully');
        }

        // ── Step 5: Link auth uid → roster entry ────────────────────────────
        console.log('[Auth] Step 5: Linking profile_id to roster entry');
        const { error: rosterLinkError } = await (supabase as any)
          .from('roster')
          .update({ profile_id: userId })
          .eq('email', email);

        if (rosterLinkError) {
          console.warn('[Auth] ⚠️ Roster link update failed (non-fatal):', rosterLinkError.message);
        } else {
          console.log('[Auth] ✅ Roster entry linked');
        }
      }

      // ── Step 6: Fetch the final profile ─────────────────────────────────
      console.log('[Auth] Step 6: Fetching final profile...');
      const finalProfile = await fetchProfile(userId);
      setProfile(finalProfile);
      if (finalProfile) {
        if (finalProfile.role === 'student') {
          const { data: feeData } = await (supabase as any)
            .from('fee_statuses')
            .select('status')
            .eq('student_id', userId)
            .maybeSingle();
          setFeeStatus((feeData?.status as any) ?? 'unpaid');
        } else {
          setFeeStatus('paid');
        }
      }
      console.log('[Auth] ✅ provisionProfile complete — profile:', JSON.stringify(finalProfile));

    } finally {
      processingRef.current.delete(userId);
      setLoading(false);
    }
  };

  // ── Subscribe to auth state ───────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    // Check for an existing session on mount (e.g. after OAuth redirect)
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      if (!mounted) return;
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        provisionProfile(existing);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      console.log('[Auth] onAuthStateChange:', event, session?.user?.email ?? '(no session)');
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session) {
        const currentProfile = profileRef.current;
        if (currentProfile && currentProfile.id === session.user.id) {
          console.log('[Auth] Redundant SIGNED_IN for already provisioned user:', session.user.email, '— skipping re-provision');
        } else {
          provisionProfile(session);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        // NOTE: do NOT reset rosterRejected here.
        // provisionProfile sets rosterRejected=true THEN calls auth.signOut(),
        // which fires this SIGNED_OUT event. Clearing it here would wipe the
        // rejection and show the landing page instead of /unregistered.
        // rosterRejected is only reset in: signOut() and signInWithGoogle().
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Token refresh — don't re-provision, just update session
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── refreshProfile ────────────────────────────────────────────────────────
  const refreshProfile = async () => {
    const currentUserId = user?.id || session?.user?.id;
    const emailAddress  = user?.email || session?.user?.email || '';
    if (!currentUserId) return;

    const updated = await fetchProfile(currentUserId);
    if (updated) {
      // Admins bypass the roster check
      if (updated.role === 'admin') {
        setProfile(updated);
        setFeeStatus('paid');
        setSuspended(false);
        setRosterRejected(false);
        return;
      }

      // Check roster status
      const { data: rosterEntry } = await (supabase as any)
        .from('roster')
        .select('suspended, fee_suspended')
        .eq('email', emailAddress)
        .maybeSingle();

      if (!rosterEntry || rosterEntry.suspended || rosterEntry.fee_suspended) {
        console.warn('[Auth] refreshProfile — User not in roster or suspended.');
        if (rosterEntry?.suspended) {
          setSuspended(true);
        }
        if (rosterEntry?.fee_suspended) {
          setIsBillingSuspended(true);
          cachedProfileRef.current = updated;
        }
        setProfile(null);
        setFeeStatus(null);
        setRosterRejected(true);
        return;
      }

      setSuspended(false);
      setIsBillingSuspended(false);
      setRosterRejected(false);
      setProfile(updated);
      if (updated.role === 'student') {
        const { data: feeData } = await (supabase as any)
          .from('fee_statuses')
          .select('status')
          .eq('student_id', currentUserId)
          .maybeSingle();
        setFeeStatus((feeData?.status as any) ?? 'unpaid');
      } else {
        setFeeStatus('paid');
      }
    }
  };

  // ── signInWithGoogle ──────────────────────────────────────────────────────
  const signInWithGoogle = async (): Promise<void> => {
    setRosterRejected(false);
    setSuspended(false);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      console.error('[Auth] Google OAuth error:', error.message);
      setAuthError('Google sign-in failed. Please try again.');
      throw error;
    }
  };

  // ── signOut ───────────────────────────────────────────────────────────────
  const signOut = async () => {
    setRosterRejected(false);
    setSuspended(false);
    await supabase.auth.signOut();
  };

  // ── Realtime global roster watch for suspensions AND deletions ──────────────
  useRealtimeTable({
    table: 'roster',
    filter: user?.email ? `email=eq.${user.email}` : undefined,
    onUpdate: (payload) => {
      const newRoster = payload.new as any;
      if (newRoster.suspended) {
        console.warn('[Auth] Realtime: user suspended by admin.');
        setSuspended(true);
        setRosterRejected(true);
        setProfile(null);
        setFeeStatus(null);
      } else if (newRoster.fee_suspended) {
        console.warn('[Auth] Realtime: user fee suspended by admin.');
        setIsBillingSuspended(true);
        setRosterRejected(true);
        cachedProfileRef.current = profileRef.current;
        setProfile(null);
        setFeeStatus(null);
      } else {
        console.log('[Auth] Realtime: user restored by admin.');
        setSuspended(false);
        setIsBillingSuspended(false);
        setRosterRejected(false);
        refreshProfile();
      }
    },
    onDelete: (_payload) => {
      // Admin has deleted this user's roster entry — eject them immediately.
      console.warn('[Auth] Realtime: roster row deleted by admin. Signing out immediately.');
      setSuspended(false);
      setIsBillingSuspended(false);
      setRosterRejected(true);
      setProfile(null);
      setFeeStatus(null);
      supabase.auth.signOut();
    }
  });

  // ── Realtime fee_statuses watch — admin approval pushes to student live ──────
  useRealtimeTable({
    table: 'fee_statuses',
    filter: user?.id ? `student_id=eq.${user.id}` : undefined,
    onUpdate: (payload) => {
      const newStatus = (payload.new as any)?.status as 'unpaid' | 'pending' | 'paid' | undefined;
      if (!newStatus) return;
      console.log('[Auth] Realtime: fee_statuses updated →', newStatus);
      setFeeStatus(newStatus);
      // If just approved (paid), unblock any billing suspension and refresh profile
      if (newStatus === 'paid') {
        setIsBillingSuspended(false);
        setRosterRejected(false);
        refreshProfile();
      }
    }
  });

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      loading,
      rosterRejected,
      suspended,
      isBillingSuspended,
      needsOnboarding,
      feeStatus,
      authError,
      signInWithGoogle,
      signOut,
      refreshProfile,
      proceedToPaymentCheckout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
