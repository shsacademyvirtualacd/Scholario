import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';
import { MOCK_TEACHERS } from '../../lib/mockData';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const useMock = (import.meta as any).env.VITE_USE_MOCK_AUTH !== 'false';

const getMockProfile = (
  role: 'student' | 'admin' | 'teacher',
  stream?: 'pre-engineering' | 'pre-medical' | 'ics',
  userId?: string
): Profile => {
  const id = userId || (role === 'student' ? 'mock-user-id' : role === 'teacher' ? 't1' : 'mock-admin-id');
  let full_name = `Dev ${role.charAt(0).toUpperCase() + role.slice(1)}`;

  if (role === 'teacher') {
    const t = MOCK_TEACHERS.find(x => x.id === id);
    if (t) {
      full_name = t.full_name;
    }
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const defaultRole = (useMock && typeof window !== 'undefined' && (localStorage.getItem('mock_role') as 'student' | 'admin' | 'teacher')) || 'admin';
  const defaultStream = (useMock && typeof window !== 'undefined' && (localStorage.getItem('student_stream') as 'pre-engineering' | 'pre-medical' | 'ics')) || 'pre-engineering';
  const defaultUserId = (useMock && typeof window !== 'undefined' && localStorage.getItem('mock_user_id')) || (defaultRole === 'student' ? 'mock-user-id' : defaultRole === 'teacher' ? 't1' : 'mock-admin-id');

  const [session, setSession] = useState<Session | null>(
    useMock ? ({ user: { id: defaultUserId, email: `${defaultRole}@example.com` } } as any) : null
  );
  const [user, setUser] = useState<User | null>(
    useMock ? ({ id: defaultUserId, email: `${defaultRole}@example.com` } as any) : null
  );
  const [profile, setProfile] = useState<Profile | null>(
    useMock ? getMockProfile(defaultRole, defaultStream, defaultUserId) : null
  );
  const [loading, setLoading] = useState(useMock ? false : true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data);
    } else {
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    const currentUserId = user?.id || session?.user?.id;
    if (currentUserId) {
      const { getProfile } = await import('../../lib/db');
      const updated = await getProfile(currentUserId);
      setProfile(updated);
    }
  };

  useEffect(() => {
    if (useMock) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (useMock) {
      const emailLower = email.toLowerCase().trim();
      
      // Import MOCK_ROSTER & MOCK_FEE_STATUSES dynamically or reference them
      const { MOCK_ROSTER: rosterMock, MOCK_FEE_STATUSES: feeStatusesMock } = await import('../../lib/mockData');
      
      const rosterEntry = rosterMock.find(r => r.email.toLowerCase() === emailLower);
      
      if (!rosterEntry) {
        // Create temporary session but no profile
        const mockUserId = `unregistered_${Date.now()}`;
        setSession({ user: { id: mockUserId, email } } as any);
        setUser({ id: mockUserId, email } as any);
        setProfile(null);
        return { error: null };
      }

      const role = rosterEntry.role;
      const mockUserId = rosterEntry.profile_id || `mock_user_${Date.now()}`;
      const stream = role === 'student' ? 'pre-engineering' : undefined;

      localStorage.setItem('mock_role', role);
      if (stream) localStorage.setItem('student_stream', stream);
      localStorage.setItem('mock_user_id', mockUserId);

      setSession({ user: { id: mockUserId, email } } as any);
      setUser({ id: mockUserId, email } as any);

      const matchedProfile = getMockProfile(role, stream, mockUserId);
      matchedProfile.full_name = rosterEntry.full_name;
      setProfile(matchedProfile);

      if (!rosterEntry.profile_id) {
        rosterEntry.profile_id = mockUserId;
        if (role === 'student') {
          const existsStatus = feeStatusesMock.find(fs => fs.student_id === mockUserId);
          if (!existsStatus) {
            feeStatusesMock.push({
              id: `fs_${Date.now()}`,
              student_id: mockUserId,
              status: 'unpaid',
              updated_at: new Date().toISOString()
            });
          }
        }
      }

      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    if (useMock) {
      localStorage.removeItem('mock_role');
      localStorage.removeItem('student_stream');
      localStorage.removeItem('mock_user_id');
      setSession(null);
      setUser(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
