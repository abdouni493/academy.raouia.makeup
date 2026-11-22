import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, Field, Input } from '@/components/ui';
import { api } from '@/lib/functions';
import { supabase } from '@/lib/supabase';
import { errorMessage } from '@/lib/utils';

/** One-time form shown on the login page while no admin account exists. */
export function AdminSetupForm({ onBack, onCreated }: { onBack: () => void; onCreated: () => void }) {
  const { t } = useTranslation();
  const schema = z
    .object({
      full_name: z.string().trim().min(2, t('common.required')),
      email: z.string().trim().email(t('common.invalidEmail')),
      password: z.string().min(8, t('auth.min8')),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, { message: t('auth.passwordsMismatch'), path: ['confirm'] });
  type Values = z.infer<typeof schema>;
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Values) => {
    try {
      await api.bootstrapAdmin({ email: v.email.trim(), password: v.password, full_name: v.full_name.trim() });
    } catch (e) {
      const msg = errorMessage(e);
      toast.error(/already exists/i.test(msg) ? t('auth.setupTaken') : msg);
      onCreated(); // re-check: hides the option if an admin now exists
      return;
    }
    toast.success(t('auth.setupDone'));
    onCreated();
    // Sign straight in; the login page then redirects to /admin.
    const { error } = await supabase.auth.signInWithPassword({ email: v.email.trim().toLowerCase(), password: v.password });
    if (error) {
      toast.error(error.message);
      onBack();
    }
  };

  return (
    <div>
      <button onClick={onBack} className="focus-ring mb-6 inline-flex min-h-11 items-center gap-2 rounded-xl text-subhead text-label-secondary hover:text-label">
        <ArrowLeft className="rtl-flip h-4 w-4" /> {t('auth.backToLogin')}
      </button>
      <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-accent-contrast shadow-soft">
        <ShieldCheck className="h-6 w-6" />
      </span>
      <h1 className="text-large-title">{t('auth.setupTitle')}</h1>
      <p className="mt-2 text-label-secondary">{t('auth.setupHelp')}</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <Field label={t('auth.fullName')} error={formState.errors.full_name?.message}>
          <Input autoComplete="name" {...register('full_name')} invalid={!!formState.errors.full_name} />
        </Field>
        <Field label={t('auth.email')} error={formState.errors.email?.message}>
          <Input type="email" dir="ltr" autoComplete="email" {...register('email')} invalid={!!formState.errors.email} />
        </Field>
        <Field label={t('auth.password')} error={formState.errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...register('password')} invalid={!!formState.errors.password} />
        </Field>
        <Field label={t('auth.confirmPassword')} error={formState.errors.confirm?.message}>
          <Input type="password" autoComplete="new-password" {...register('confirm')} invalid={!!formState.errors.confirm} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>
          {t('auth.setupCreate')}
        </Button>
      </form>
    </div>
  );
}
