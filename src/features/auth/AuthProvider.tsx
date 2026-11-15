import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import i18n from '@/i18n';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  profileError: boolean;
  loading: boolean;
  isAdmin: boolean;
  recovery: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);
  const qc = useQueryClient();
  const loadedFor = useRef<string | null>(null);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      loadedFor.current = null;
      return;
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfileError(!!error || !data);
    setProfile(data ?? null);
    // Apply the user's saved language once per login.
    if (data && loadedFor.current !== userId) {
      let local: string | null = null;
      try {
        local = localStorage.getItem('lang');
      } catch {
        /* ignore */
      }
      if (!local && data.language && data.language !== i18n.language) void i18n.changeLanguage(data.language);
    }
    loadedFor.current = userId;
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      if (mounted) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      setSession(newSession);
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        loadedFor.current = null;
        qc.clear();
        return;
      }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        // Defer DB call outside the auth callback (avoids supabase-js deadlock).
        setTimeout(() => {
          void loadProfile(newSession?.user.id).finally(() => setLoading(false));
        }, 0);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile, qc]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      profileError,
      loading,
      recovery,
      isAdmin: profile?.role === 'admin' && profile.is_active,
      refreshProfile: () => loadProfile(session?.user.id),
      signOut: async () => {
        await supabase.auth.signOut();
        setRecovery(false);
      },
    }),
    [session, profile, profileError, loading, recovery, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
