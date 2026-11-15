import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Mail, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, Card, CardHeader, Field, Input } from '@/components/ui';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/lib/supabase';

export function ProfilePage() {
  const { t } = useTranslation();
  const { profile, refreshProfile } = useAuth();

  const info = useForm<{ full_name: string; phone: string }>({ defaultValues: { full_name: '', phone: '' } });
  useEffect(() => {
    if (profile) info.reset({ full_name: profile.full_name ?? '', phone: profile.phone ?? '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const pwSchema = z
    .object({ password: z.string().min(8, t('auth.min8')), confirm: z.string() })
    .refine((v) => v.password === v.confirm, { message: t('auth.passwordsMismatch'), path: ['confirm'] });
  const pw = useForm<z.infer<typeof pwSchema>>({ resolver: zodResolver(pwSchema) });

  const saveInfo = info.handleSubmit(async (v) => {
    if (!profile) return;
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: v.full_name.trim() || null, phone: v.phone.trim() || null })
      .eq('id', profile.id);
    if (error) toast.error(error.message);
    else {
      toast.success(t('common.saved'));
      await refreshProfile();
    }
  });

  const savePassword = pw.handleSubmit(async (v) => {
    const { error } = await supabase.auth.updateUser({ password: v.password });
    if (error) toast.error(error.message);
    else {
      toast.success(t('profile.passwordChanged'));
      pw.reset({ password: '', confirm: '' });
    }
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t('profile.title')} />
      <div className="space-y-6">
        <Card>
          <CardHeader icon={<User className="h-5 w-5" />} title={t('profile.info')} />
          <form onSubmit={saveInfo} className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label={t('auth.email')} hint={t('profile.emailHint')} className="sm:col-span-2">
              <div className="relative">
                <Mail className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input value={profile?.email ?? ''} disabled className="ps-11" />
              </div>
            </Field>
            <Field label={t('profile.fullName')}>
              <Input {...info.register('full_name')} />
            </Field>
            <Field label={t('profile.phone')}>
              <Input type="tel" dir="ltr" {...info.register('phone')} />
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-4 sm:col-span-2">
              <div className="flex items-center gap-3 text-sm text-plum">
                {t('common.language')} <LanguageSwitcher />
              </div>
              <Button type="submit" loading={info.formState.isSubmitting}>
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader icon={<KeyRound className="h-5 w-5" />} title={t('profile.changePassword')} />
          <form onSubmit={savePassword} className="grid gap-5 p-5 sm:grid-cols-2" noValidate>
            <Field label={t('auth.newPassword')} error={pw.formState.errors.password?.message}>
              <Input type="password" autoComplete="new-password" {...pw.register('password')} />
            </Field>
            <Field label={t('auth.confirmPassword')} error={pw.formState.errors.confirm?.message}>
              <Input type="password" autoComplete="new-password" {...pw.register('confirm')} />
            </Field>
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" loading={pw.formState.isSubmitting}>
                {t('auth.updatePassword')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
