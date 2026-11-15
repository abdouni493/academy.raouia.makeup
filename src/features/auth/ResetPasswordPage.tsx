import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, Field, Input, PageLoader } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { AuthShell } from './AuthShell';
import { useAuth } from './AuthProvider';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [waited, setWaited] = useState(false);

  // Give supabase-js a moment to exchange the recovery token from the URL.
  useEffect(() => {
    const id = window.setTimeout(() => setWaited(true), 2500);
    return () => window.clearTimeout(id);
  }, []);

  const schema = z
    .object({ password: z.string().min(8, t('auth.min8')), confirm: z.string() })
    .refine((v) => v.password === v.confirm, { message: t('auth.passwordsMismatch'), path: ['confirm'] });
  type Values = z.infer<typeof schema>;
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Values) => {
    const { error } = await supabase.auth.updateUser({ password: v.password });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t('auth.passwordUpdated'));
    navigate('/', { replace: true });
  };

  const hasRecoveryHash = /type=recovery|access_token|code=/.test(window.location.href);

  return (
    <AuthShell>
      {loading || (!session && hasRecoveryHash && !waited) ? (
        <PageLoader />
      ) : !session ? (
        <div className="animate-fade-in text-center">
          <p className="text-muted">{t('auth.invalidLink')}</p>
          <Link to="/login" className="mt-6 inline-block">
            <Button variant="secondary">{t('auth.backToLogin')}</Button>
          </Link>
        </div>
      ) : (
        <div className="animate-fade-in">
          <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blush-100 text-blush-600">
            <KeyRound className="h-6 w-6" />
          </span>
          <h1 className="text-3xl font-semibold">{t('auth.resetTitle')}</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
            <Field label={t('auth.newPassword')} error={formState.errors.password?.message}>
              <Input type="password" autoComplete="new-password" {...register('password')} />
            </Field>
            <Field label={t('auth.confirmPassword')} error={formState.errors.confirm?.message}>
              <Input type="password" autoComplete="new-password" {...register('confirm')} />
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>
              {t('auth.updatePassword')}
            </Button>
          </form>
        </div>
      )}
    </AuthShell>
  );
}
