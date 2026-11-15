import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Field, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { AdminSetupForm } from './AdminSetupForm';
import { AuthShell } from './AuthShell';
import { useAuth } from './AuthProvider';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
type Values = z.infer<typeof schema>;

/** Turns a Supabase auth error into a message the user can act on. */
function loginErrorMessage(message: string, t: (k: string) => string): string {
  if (/invalid login credentials|invalid_grant|invalid credentials/i.test(message)) return t('auth.invalidCredentials');
  if (/banned/i.test(message)) return t('auth.suspendedText');
  if (/email not confirmed/i.test(message)) return t('auth.emailNotConfirmed');
  if (/failed to fetch|network|load failed/i.test(message)) return t('auth.networkError');
  return message;
}

export function LoginPage() {
  const { t } = useTranslation();
  const { session, profile, loading } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'setup'>('login');
  const [authError, setAuthError] = useState<string | null>(null);

  // The "Create admin account" button stays visible until the database confirms
  // an admin exists. The bootstrap-admin function enforces the one-admin rule
  // server-side, so showing it while the check is unavailable is safe.
  const adminExists = useQuery({
    queryKey: ['admin-exists'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_exists');
      if (error) throw error;
      return data === true;
    },
    staleTime: 0,
    retry: false,
  });
  const showSetup = !adminExists.isLoading && adminExists.data !== true;

  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  if (!loading && session && profile) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from !== '/login' ? from : profile.role === 'admin' ? '/admin' : '/'} replace />;
  }

  const onSubmit = async (v: Values) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: v.email.trim().toLowerCase(), password: v.password });
    if (error) setAuthError(loginErrorMessage(error.message, t));
  };

  return (
    <AuthShell>
      {mode === 'setup' && showSetup ? (
        <AdminSetupForm
          onBack={() => setMode('login')}
          onCreated={() => {
            void adminExists.refetch();
          }}
        />
      ) : (
        <div className="animate-fade-in">
          <h1 className="text-3xl font-semibold sm:text-4xl">{t('auth.welcomeBack')}</h1>
          <p className="mt-2 text-muted">{t('auth.subtitle')}</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
            <Field label={t('auth.email')} error={formState.errors.email && t('common.invalidEmail')}>
              <div className="relative">
                <Mail className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input type="email" autoComplete="email" className="ps-11" invalid={!!formState.errors.email} {...register('email')} />
              </div>
            </Field>
            <Field label={t('auth.password')} error={formState.errors.password && t('common.required')}>
              <div className="relative">
                <Lock className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  type="password"
                  autoComplete="current-password"
                  className="ps-11"
                  invalid={!!formState.errors.password}
                  {...register('password')}
                />
              </div>
            </Field>
            {authError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{authError}</div>}
            <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>
              {t('auth.signIn')}
            </Button>
          </form>

          {showSetup && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted">
                <span className="h-px flex-1 bg-blush-100" />
                {t('auth.or')}
                <span className="h-px flex-1 bg-blush-100" />
              </div>
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                icon={<ShieldCheck className="h-4 w-4" />}
                onClick={() => setMode('setup')}
              >
                {t('auth.setupButton')}
              </Button>
            </>
          )}
        </div>
      )}
    </AuthShell>
  );
}
