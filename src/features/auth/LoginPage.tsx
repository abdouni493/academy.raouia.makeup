import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Lock, Mail, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, Field, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { whatsappLink } from '@/lib/utils';
import { AuthShell } from './AuthShell';
import { useAuth } from './AuthProvider';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
type Values = z.infer<typeof schema>;

export function LoginPage() {
  const { t } = useTranslation();
  const { session, profile, loading } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  if (!loading && session && profile) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from !== '/login' ? from : profile.role === 'admin' ? '/admin' : '/'} replace />;
  }

  const onSubmit = async (v: Values) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: v.email.trim(), password: v.password });
    if (error) {
      const banned = /banned/i.test(error.message);
      setAuthError(banned ? t('auth.suspendedText') : t('auth.invalidCredentials'));
    }
  };

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!z.string().email().safeParse(resetEmail.trim()).success) {
      toast.error(t('common.invalidEmail'));
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSending(false);
    if (error && !/rate/i.test(error.message)) toast.error(error.message);
    else toast.success(t('auth.resetSent'));
  };

  return (
    <AuthShell>
      {mode === 'login' ? (
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
                <Input type="password" autoComplete="current-password" className="ps-11" invalid={!!formState.errors.password} {...register('password')} />
              </div>
            </Field>
            {authError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{authError}</div>}
            <div className="flex justify-end">
              <button type="button" onClick={() => setMode('forgot')} className="text-sm font-medium text-rosegold hover:text-blush-600">
                {t('auth.forgot')}
              </button>
            </div>
            <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>
              {t('auth.signIn')}
            </Button>
          </form>
          <a
            href={whatsappLink('')}
            target="_blank"
            rel="noreferrer"
            className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-blush-50 px-4 py-3 text-center text-sm text-muted transition hover:text-plum"
          >
            <MessageCircle className="h-4 w-4 text-rosegold" />
            {t('auth.noAccount')}
          </a>
        </div>
      ) : (
        <div className="animate-fade-in">
          <button onClick={() => setMode('login')} className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-plum">
            <ArrowLeft className="rtl-flip h-4 w-4" /> {t('auth.backToLogin')}
          </button>
          <h1 className="text-3xl font-semibold">{t('auth.forgotTitle')}</h1>
          <p className="mt-2 text-muted">{t('auth.forgotHelp')}</p>
          <form onSubmit={sendReset} className="mt-8 space-y-5">
            <Field label={t('auth.email')}>
              <Input type="email" autoComplete="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={sending}>
              {t('auth.sendReset')}
            </Button>
          </form>
        </div>
      )}
    </AuthShell>
  );
}
