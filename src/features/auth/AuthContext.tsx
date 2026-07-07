import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';
import { MOCK_TEACHERS, MOCK_ROSTER, MOCK_FEE_STATUSES } from '../../lib/mockData';

// ─── Context shape ────────────────────────────────────────────────────────────
interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  /** True when user signed in with Google but their email isn't in the roster */
  rosterRejected: boolean;
  /** Initiates Google OAuth flow (redirect-based). No-op params needed. */
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Mock mode flag ───────────────────────────────────────────────────────────
// useMock is ONLY true when explicitly set to 'true'.
// Absent/undefined defaults to real Supabase auth — safe for production.
const useMock = (import.meta as any).env.VITE_USE_MOCK_AUTH === 'true';

// ─── Mock profile helper ──────────────────────────────────────────────────────
const getMockProfile = (
  role: 'student' | 'admin' | 'teacher',
  stream?: 'pre-engineering' | 'pre-medical' | 'ics',
  userId?: string
): Profile => {
  const id = userId || (role === 'student' ? 'mock-user-id' : role === 'teacher' ? 't1' : 'mock-admin-id');
  let full_name = `Dev ${role.charAt(0).toUpperCase() + role.slice(1)}`;

  if (role === 'teacher') {
    const t = MOCK_TEACHERS.find(x => x.id === id);
    if (t) full_name = t.full_name;
  } else if (role === 'student' && id === 'mock-user-id') {
    full_name = 'Rayn Ahmad';
  }

  return {
    id,
    role,
    full_name,
    avatar_url: null,
    phone: '123-456-7890',
    created_at: new Date().toISOString(),
    stream: role === 'student' ? (stream || 'pre-engineering') : undefined,
  };
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mock defaults: only log in automatically if mock_role is explicitly set in localStorage
  const hasMockSession = useMock && typeof window !== 'undefined' && localStorage.getItem('mock_role') !== null;
  const defaultRole = (useMock && typeof window !== 'undefined' && (localStorage.getItem('mock_role') as 'student' | 'admin' | 'teacher')) || null;
  const defaultStream = (useMock && typeof window !== 'undefined' && (localStorage.getItem('student_stream') as 'pre-engineering' | 'pre-medical' | 'ics')) || 'pre-engineering';
  const defaultUserId = (useMock && typeof window !== 'undefined' && localStorage.getItem('mock_user_id')) || (defaultRole === 'student' ? 'mock-user-id' : defaultRole === 'teacher' ? 't1' : 'mock-admin-id');

  const [session, setSession] = useState<Session | null>(
    hasMockSession ? ({ user: { id: defaultUserId, email: `${defaultRole}@example.com` } } as any) : null
  );
  const [user, setUser] = useState<User | null>(
    hasMockSession ? ({ id: defaultUserId, email: `${defaultRole}@example.com` } as any) : null
  );
  const [profile, setProfile] = useState<Profile | null>(
    (hasMockSession && defaultRole) ? getMockProfile(defaultRole, defaultStream, defaultUserId) : null
  );
  const [loading, setLoading] = useState(useMock ? false : true);
  // Transient flag: set when a real Google sign-in is rejected due to missing roster entry.
  // Resets to false on explicit sign-out or page reload (no persistence needed — session
  // is also cleared, so reload naturally shows landing page).
  const [rosterRejected, setRosterRejected] = useState(false);

  // Guard against profile creation running twice for the same session
  const processingRef = useRef<Set<string>>(new Set());

  // ── Real Supabase: fetch profile by auth uid ──────────────────────────────
  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data ?? null);
  };

  // ── Real Supabase: roster-gated profile provisioning ─────────────────────
  //
  // Called after every SIGNED_IN event.
  //
  // Algorithm (deny-by-default):
  //   1. Look up user's email in the roster table.
  //   2. NOT found → sign them out, leave profile null → /unregistered.
  //   3. Found → check if profiles row already exists.
  //      a. No row yet → INSERT profile using roster.role (admin/teacher/student).
  //      b. Row exists → just load it.
  //   4. The roster.role is the single source of truth. There is no hardcoded
  //      email check and no "default to student" fallback anywhere.
  const provisionProfile = async (newSession: Session) => {
    const userId = newSession.user.id;
    const email  = newSession.user.email ?? '';

    // Prevent double-run for the same auth event
    if (processingRef.current.has(userId)) return;
    processingRef.current.add(userId);

    setLoading(true);
    console.log('[Auth] provisionProfile started for', email, '(uid:', userId, ')');

    try {
      // 1. Roster lookup — the gatekeeper
      console.log('[Auth] Step 1: Roster lookup for', email);
      const { data: rosterEntry, error: rosterError } = await (supabase as any)
        .from('roster')
        .select('role, full_name, class_ids, profile_id')
        .eq('email', email)
        .maybeSingle();

      if (rosterError) {
        console.error('[Auth] ❌ Roster lookup FAILED:', rosterError.message, rosterError);
        setRosterRejected(true);
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }

      // 2. Email not in roster → deny access, show unregistered page
      if (!rosterEntry) {
        console.warn('[Auth] ❌ Email NOT found in roster:', email);
        setRosterRejected(true);
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }

      console.log('[Auth] ✅ Roster entry found:', JSON.stringify(rosterEntry));

      // 3. Email is in roster — check for existing profile
      console.log('[Auth] Step 3: Checking for existing profile with id =', userId);
      const { data: existingProfile, error: profileFetchError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileFetchError) {
        console.error('[Auth] ❌ Profile fetch error:', profileFetchError.message, profileFetchError);
      }

      if (existingProfile) {
        console.log('[Auth] ✅ Existing profile found:', JSON.stringify(existingProfile));
        setProfile(existingProfile);
        return;
      }

      // 4. First login for this email: create the profile using roster.role
      //    No "default to student" — the role comes entirely from the roster.
      const role: 'admin' | 'teacher' | 'student' = rosterEntry.role;
      const fullName: string =
        rosterEntry.full_name ||
        newSession.user.user_metadata?.full_name ||
        email;

      console.log('[Auth] Step 4: Creating new profile — role:', role, ', name:', fullName);
      const { error: insertError } = await (supabase as any)
        .from('profiles')
        .insert({
          id: userId,
          role,
          full_name: fullName,
          avatar_url: newSession.user.user_metadata?.avatar_url ?? null,
          phone: null,
          stream: null, // Admin sets stream separately if needed for students
        });

      if (insertError) {
        console.error('[Auth] ❌ Profile INSERT FAILED (likely RLS policy):', insertError.message, insertError);
        // Don't leave user in limbo — sign out and show error
        setRosterRejected(true);
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }

      console.log('[Auth] ✅ Profile created successfully');

      // 5. Link the auth uid back to the roster entry so the admin can
      //    see this user as "active" in the Roster Manager
      console.log('[Auth] Step 5: Linking profile_id to roster entry');
      const { error: rosterUpdateError } = await (supabase as any)
        .from('roster')
        .update({ profile_id: userId })
        .eq('email', email);

      if (rosterUpdateError) {
        // Non-fatal: profile was created, roster link is cosmetic
        console.warn('[Auth] ⚠️ Roster link update failed (non-fatal):', rosterUpdateError.message);
      } else {
        console.log('[Auth] ✅ Roster entry linked');
      }

      // 6. Fetch and set the newly created profile
      console.log('[Auth] Step 6: Fetching newly created profile');
      await fetchProfile(userId);
      console.log('[Auth] ✅ provisionProfile complete');
    } finally {
      processingRef.current.delete(userId);
      setLoading(false);
    }
  };

  // ── Real Supabase: subscribe to auth state ────────────────────────────────
  useEffect(() => {
    if (useMock) return;

    let mounted = true;

    // Check for an existing session on mount
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
        provisionProfile(session);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── refreshProfile (used by profile pages after edits) ────────────────────
  const refreshProfile = async () => {
    const currentUserId = user?.id || session?.user?.id;
    if (!currentUserId) return;
    const { getProfile } = await import('../../lib/db');
    const updated = await getProfile(currentUserId);
    setProfile(updated);
  };

  // ── signInWithGoogle ──────────────────────────────────────────────────────
  //
  // For real Supabase: triggers the OAuth redirect. Supabase handles the
  // callback URL and fires onAuthStateChange('SIGNED_IN') automatically.
  //
  // For mock mode: simulates the Google OAuth result by looking up
  // mock_role in localStorage (set by developer / switcher), then does the
  // same roster-gated logic against MOCK_ROSTER.
  const signInWithGoogle = async (): Promise<void> => {
    if (useMock) {
      // ── Mock OAuth simulation ─────────────────────────────────────────────
      // In mock mode there's no real redirect; we simulate a sign-in by
      // reading the role from localStorage (same as before) but route it
      // through the roster-gating logic so the behavior is identical to prod.
      const mockEmail = localStorage.getItem('mock_email') || 'admin@example.com';

      const rosterEntry = MOCK_ROSTER.find(
        (r: any) => r.email.toLowerCase() === mockEmail.toLowerCase()
      );

      if (!rosterEntry) {
        // Not in roster → clear session, profile stays null
        setSession(null);
        setUser(null);
        setProfile(null);
        // The LoginPage useEffect will see no session → navigate('/unregistered')
        // We force the signal by briefly setting a mock session with no profile:
        const unregId = `unregistered_${Date.now()}`;
        setSession({ user: { id: unregId, email: mockEmail } } as any);
        setUser({ id: unregId, email: mockEmail } as any);
        return;
      }

      const role = rosterEntry.role as 'student' | 'admin' | 'teacher';
      const mockUserId = rosterEntry.profile_id || `mock_user_${Date.now()}`;
      const stream = role === 'student'
        ? ((localStorage.getItem('student_stream') as any) || 'pre-engineering')
        : undefined;

      localStorage.setItem('mock_role', role);
      if (stream) localStorage.setItem('student_stream', stream);
      localStorage.setItem('mock_user_id', mockUserId);

      const matchedProfile = getMockProfile(role, stream, mockUserId);
      matchedProfile.full_name = rosterEntry.full_name;

      // Provision fee status for new student mock sessions
      if (!rosterEntry.profile_id) {
        rosterEntry.profile_id = mockUserId;
        if (role === 'student') {
          const exists = MOCK_FEE_STATUSES.find((fs: any) => fs.student_id === mockUserId);
          if (!exists) {
            MOCK_FEE_STATUSES.push({
              id: `fs_${Date.now()}`,
              student_id: mockUserId,
              status: 'unpaid',
              updated_at: new Date().toISOString(),
            });
          }
        }
      }

      setSession({ user: { id: mockUserId, email: mockEmail } } as any);
      setUser({ id: mockUserId, email: mockEmail } as any);
      setProfile(matchedProfile);
      return;
    }

    // ── Real Google OAuth ─────────────────────────────────────────────────
    // Supabase redirects the browser to Google, then back to the app.
    // onAuthStateChange fires SIGNED_IN → provisionProfile() runs.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          // Force account chooser so shared devices always pick the right account
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      console.error('[Auth] Google OAuth error:', error.message);
      throw error;
    }
    // After this point the browser navigates away; nothing more to do here.
  };

  // ── signOut ───────────────────────────────────────────────────────────────
  const signOut = async () => {
    setRosterRejected(false);
    if (useMock) {
      localStorage.removeItem('mock_role');
      localStorage.removeItem('student_stream');
      localStorage.removeItem('mock_user_id');
      localStorage.removeItem('mock_email');
      setSession(null);
      setUser(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, rosterRejected, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
