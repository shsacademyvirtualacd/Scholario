import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const isDev = import.meta.env.DEV;

const getMockProfile = (role: 'student' | 'admin'): Profile => ({
  id: 'mock-user-id',
  role,
  full_name: `Dev ${role.charAt(0).toUpperCase() + role.slice(1)}`,
  avatar_url: null,
  phone: '123-456-7890',
  created_at: new Date().toISOString(),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const defaultRole = (isDev && typeof window !== 'undefined' && (localStorage.getItem('mock_role') as 'student' | 'admin')) || 'admin';

  const [session, setSession] = useState<Session | null>(
    isDev ? ({ user: { id: 'mock-user-id', email: `${defaultRole}@example.com` } } as any) : null
  );
  const [user, setUser] = useState<User | null>(
    isDev ? ({ id: 'mock-user-id', email: `${defaultRole}@example.com` } as any) : null
  );
  const [profile, setProfile] = useState<Profile | null>(
    isDev ? getMockProfile(defaultRole) : null
  );
  const [loading, setLoading] = useState(isDev ? false : true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data ?? null);
  };

  useEffect(() => {
    if (isDev) return;

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
    if (isDev) {
      const role: 'student' | 'admin' = email.toLowerCase().includes('student') ? 'student' : 'admin';
      localStorage.setItem('mock_role', role);
      setSession({ user: { id: 'mock-user-id', email } } as any);
      setUser({ id: 'mock-user-id', email } as any);
      setProfile(getMockProfile(role));
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    if (isDev) {
      localStorage.removeItem('mock_role');
      setSession(null);
      setUser(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
