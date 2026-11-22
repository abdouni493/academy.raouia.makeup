import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, MessageCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, Field, Input, Modal, Textarea } from '@/components/ui';
import { BRAND_NAME } from '@/lib/config';
import { api } from '@/lib/functions';
import { errorMessage, generatePassword, whatsappLink } from '@/lib/utils';
import type { Profile } from '@/types/database';

export function credentialsText(t: (k: string, o?: Record<string, unknown>) => string, name: string, email: string, password: string) {
  return t('clients.credentialsMessage', { name, brand: BRAND_NAME, url: `${window.location.origin}/login`, email, password });
}

export function CredentialsModal({
  data,
  onClose,
}: {
  data: { name: string; email: string; password: string; phone?: string | null } | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  // Keep the last credentials while the modal animates out.
  const [last, setLast] = useState(data);
  useEffect(() => {
    if (data) setLast(data);
  }, [data]);
  const shown = data ?? last;
  if (!shown) return null;
  const text = credentialsText(t, shown.name, shown.email, shown.password);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    toast.success(t('common.copied'));
  };
  return (
    <Modal
      open={!!data}
      onClose={onClose}
      title={t('clients.credentialsTitle')}
      footer={
        <>
          <Button variant="secondary" icon={<Copy className="h-4 w-4" />} onClick={() => void copy()}>
            {t('common.copy')}
          </Button>
          <a href={whatsappLink(text, shown.phone || '')} target="_blank" rel="noreferrer">
            <Button icon={<MessageCircle className="h-4 w-4" />}>{t('clients.sendWhatsapp')}</Button>
          </a>
        </>
      }
    >
      <p className="mb-4 rounded-xl bg-champagne/70 p-3 text-sm text-label">{t('clients.credentialsHint')}</p>
      <pre className="whitespace-pre-wrap rounded-xl bg-surface-tertiary p-4 font-sans text-sm text-label" dir="auto">
        {text}
      </pre>
    </Modal>
  );
}

export function PasswordInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-2">
      <Input dir="ltr" className="font-mono" value={value} onChange={(e) => onChange(e.target.value)} />
      <Button variant="subtle" icon={<RefreshCw className="h-4 w-4" />} onClick={() => onChange(generatePassword())}>
        <span className="hidden sm:inline">{t('clients.generate')}</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11"
        title={t('common.copy')}
        onClick={() => void navigator.clipboard.writeText(value).then(() => toast.success(t('common.copied')))}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}

const schema = z.object({
  full_name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export function ClientFormModal({
  open,
  client,
  onClose,
  onCreated,
}: {
  open: boolean;
  client?: Profile | null;
  onClose: () => void;
  onCreated?: (c: { name: string; email: string; password: string; phone?: string | null }) => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [password, setPassword] = useState('');
  const { register, handleSubmit, reset, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    reset({ full_name: client?.full_name ?? '', email: client?.email ?? '', phone: client?.phone ?? '', notes: client?.notes ?? '' });
    setPassword(generatePassword());
  }, [open, client, reset]);

  const onSubmit = async (v: Values) => {
    try {
      if (client) {
        await api.clients.update({
          user_id: client.id,
          full_name: v.full_name.trim(),
          email: v.email.trim().toLowerCase(),
          phone: v.phone?.trim() || null,
          notes: v.notes?.trim() || null,
        });
        toast.success(t('common.saved'));
      } else {
        if (password.length < 8) return toast.error(t('auth.min8'));
        await api.clients.create({
          email: v.email.trim(),
          password,
          full_name: v.full_name.trim(),
          phone: v.phone?.trim() || undefined,
          notes: v.notes?.trim() || undefined,
        });
        toast.success(t('clients.created'));
        onCreated?.({ name: v.full_name.trim(), email: v.email.trim().toLowerCase(), password, phone: v.phone });
      }
      void qc.invalidateQueries({ queryKey: ['admin', 'clients'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'client'] });
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={client ? t('clients.edit') : t('clients.new')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={formState.isSubmitting}>
            {client ? t('common.save') : t('common.create')}
          </Button>
        </>
      }
    >
      <form className="grid gap-6 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <Field label={t('clients.fullName')} error={formState.errors.full_name && t('common.required')} className="sm:col-span-2">
          <Input {...register('full_name')} invalid={!!formState.errors.full_name} />
        </Field>
        <Field label={t('clients.email')} error={formState.errors.email && t('common.invalidEmail')}>
          <Input type="email" dir="ltr" {...register('email')} invalid={!!formState.errors.email} />
        </Field>
        <Field label={t('clients.phone')}>
          <Input type="tel" dir="ltr" placeholder="+213…" {...register('phone')} />
        </Field>
        {!client && (
          <Field label={t('clients.password')} className="sm:col-span-2">
            <PasswordInput value={password} onChange={setPassword} />
          </Field>
        )}
        <Field label={t('clients.notes')} className="sm:col-span-2">
          <Textarea rows={3} {...register('notes')} />
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

export function ResetPasswordModal({
  client,
  onClose,
  onDone,
}: {
  client: Profile | null;
  onClose: () => void;
  onDone: (c: { name: string; email: string; password: string; phone?: string | null }) => void;
}) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (client) setPassword(generatePassword());
  }, [client]);

  const submit = async () => {
    if (!client) return;
    if (password.length < 8) return toast.error(t('auth.min8'));
    setBusy(true);
    try {
      await api.clients.resetPassword(client.id, password);
      toast.success(t('clients.passwordReset'));
      onDone({ name: client.full_name ?? '', email: client.email ?? '', password, phone: client.phone });
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!client}
      onClose={onClose}
      title={t('clients.resetPassword')}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void submit()} loading={busy}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-label-secondary">{client?.email}</p>
      <PasswordInput value={password} onChange={setPassword} />
    </Modal>
  );
}
