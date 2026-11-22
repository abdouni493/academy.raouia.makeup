import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, ChevronLeft, Crown, KeyRound, Mail, MessageCircle, Pencil, Phone, Power, ShieldCheck, Trash2, Unlock, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge, Button, buttonClassName, Card, CardHeader, ConfirmDialog, EmptyState, Field, Input, PageLoader, Select } from '@/components/ui';
import { ProgressBar } from '@/components/Badges';
import { useAuth } from '@/features/auth/AuthProvider';
import { localeFor } from '@/i18n';
import { api } from '@/lib/functions';
import { supabase } from '@/lib/supabase';
import { errorMessage, formatDate, isExpired, whatsappLink } from '@/lib/utils';
import type { AccessGrant } from '@/types/database';
import { ClientFormModal, CredentialsModal, ResetPasswordModal } from './ClientFormModal';

type GrantRow = AccessGrant & { formations: { title: string } | null; packs: { title: string } | null };

export function ClientDetailPage() {
  const { id = '' } = useParams();
  const { t, i18n } = useTranslation();
  const { profile: me } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const locale = localeFor(i18n.language);

  const [type, setType] = useState<'pack' | 'formation'>('pack');
  const [target, setTarget] = useState('');
  const [expires, setExpires] = useState('');
  const [granting, setGranting] = useState(false);
  const [revoking, setRevoking] = useState<GrantRow | null>(null);
  const [editing, setEditing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creds, setCreds] = useState<{ name: string; email: string; password: string; phone?: string | null } | null>(null);

  const clientQ = useQuery({
    queryKey: ['admin', 'client', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const grantsQ = useQuery({
    queryKey: ['admin', 'client', id, 'grants'],
    queryFn: async (): Promise<GrantRow[]> => {
      const { data, error } = await supabase
        .from('access_grants')
        .select('*, formations(title), packs(title)')
        .eq('user_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as GrantRow[];
    },
  });

  const catalogQ = useQuery({
    queryKey: ['admin', 'catalog-light'],
    queryFn: async () => {
      const [f, p] = await Promise.all([
        supabase.from('formations').select('id, title, videos(id, status)').order('sort_order'),
        supabase.from('packs').select('id, title, pack_formations(formation_id)').order('sort_order'),
      ]);
      if (f.error) throw f.error;
      if (p.error) throw p.error;
      return {
        formations: (f.data ?? []) as unknown as { id: string; title: string; videos: { id: string; status: string }[] }[],
        packs: (p.data ?? []) as unknown as { id: string; title: string; pack_formations: { formation_id: string }[] }[],
      };
    },
  });

  const progressQ = useQuery({
    queryKey: ['admin', 'client', id, 'progress'],
    queryFn: async () => {
      const { data, error } = await supabase.from('video_progress').select('video_id, completed, updated_at, videos(formation_id)').eq('user_id', id);
      if (error) throw error;
      return (data ?? []) as unknown as { video_id: string; completed: boolean; updated_at: string; videos: { formation_id: string } | null }[];
    },
  });

  // Formations the client can access (direct + via packs, non-expired).
  const progressRows = useMemo(() => {
    const cat = catalogQ.data;
    if (!cat) return [];
    const ids = new Set<string>();
    for (const g of grantsQ.data ?? []) {
      if (isExpired(g.expires_at)) continue;
      if (g.formation_id) ids.add(g.formation_id);
      if (g.pack_id) cat.packs.find((p) => p.id === g.pack_id)?.pack_formations.forEach((pf) => ids.add(pf.formation_id));
    }
    return cat.formations
      .filter((f) => ids.has(f.id))
      .map((f) => {
        const ready = f.videos.filter((v) => v.status === 'ready');
        const rows = (progressQ.data ?? []).filter((p) => p.videos?.formation_id === f.id);
        const done = rows.filter((r) => r.completed).length;
        const last = rows.reduce<string | null>((m, r) => (!m || r.updated_at > m ? r.updated_at : m), null);
        return { id: f.id, title: f.title, total: ready.length, done, pct: ready.length ? Math.round((done / ready.length) * 100) : 0, last };
      });
  }, [catalogQ.data, grantsQ.data, progressQ.data]);

  const refreshGrants = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'client', id] });
    void qc.invalidateQueries({ queryKey: ['admin', 'clients'] });
  };

  const grant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setGranting(true);
    try {
      const expires_at = expires ? new Date(`${expires}T23:59:59`).toISOString() : null;
      const existing = (grantsQ.data ?? []).find((g) => (type === 'pack' ? g.pack_id === target : g.formation_id === target));
      if (existing) {
        const { error } = await supabase.from('access_grants').update({ expires_at, starts_at: new Date().toISOString(), granted_by: me?.id ?? null }).eq('id', existing.id);
        if (error) throw error;
        toast.success(t('clients.accessUpdated'));
      } else {
        const { error } = await supabase.from('access_grants').insert({
          user_id: id,
          pack_id: type === 'pack' ? target : null,
          formation_id: type === 'formation' ? target : null,
          expires_at,
          granted_by: me?.id ?? null,
        });
        if (error) throw error;
        toast.success(t('clients.accessGranted'));
      }
      setTarget('');
      setExpires('');
      refreshGrants();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setGranting(false);
    }
  };

  const revoke = async () => {
    if (!revoking) return;
    const { error } = await supabase.from('access_grants').delete().eq('id', revoking.id);
    if (error) toast.error(error.message);
    else toast.success(t('clients.accessRevoked'));
    setRevoking(null);
    refreshGrants();
  };

  const toggleActive = async () => {
    if (!clientQ.data) return;
    try {
      await api.clients.setActive(id, !clientQ.data.is_active);
      toast.success(clientQ.data.is_active ? t('clients.deactivated') : t('clients.activated'));
      refreshGrants();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const remove = async () => {
    try {
      await api.clients.remove(id);
      toast.success(t('common.deleted'));
      void qc.invalidateQueries({ queryKey: ['admin', 'clients'] });
      navigate('/admin/clients');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (clientQ.isLoading) return <PageLoader />;
  const client = clientQ.data;
  if (!client) return <EmptyState icon={<ShieldCheck />} title="404" action={<Link to="/admin/clients" className={buttonClassName('secondary', 'md')}>
              {t('common.back')}
            </Link>} />;

  const options = type === 'pack' ? catalogQ.data?.packs ?? [] : catalogQ.data?.formations ?? [];

  return (
    <div className="space-y-6">
      <Link to="/admin/clients" className="focus-ring inline-flex min-h-11 items-center gap-1 rounded-lg text-subhead text-accent hover:underline">
        <ChevronLeft className="rtl-flip h-4 w-4" /> {t('clients.title')}
      </Link>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 p-4 sm:p-6 xl:flex-row xl:flex-wrap xl:items-center">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent-soft text-title-1 text-accent">
            {(client.full_name || client.email || '?').slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-large-title">{client.full_name || '—'}</h1>
              {client.is_active ? <Badge tone="green">{t('common.active')}</Badge> : <Badge tone="red">{t('clients.suspended')}</Badge>}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-subhead text-label-secondary">
              <span className="flex min-w-0 items-center gap-2 [overflow-wrap:anywhere]" dir="ltr">
                <Mail className="h-4 w-4" /> {client.email}
              </span>
              {client.phone && (
                <span className="flex min-w-0 items-center gap-2 [overflow-wrap:anywhere]" dir="ltr">
                  <Phone className="h-4 w-4" /> {client.phone}
                </span>
              )}
              <span>
                {t('clients.joined')} {formatDate(client.created_at, locale)}
              </span>
            </div>
            {client.notes && <p className="mt-3 whitespace-pre-line rounded-xl bg-fill-tertiary p-4 text-sm text-label">{client.notes}</p>}
          </div>
          <div className="flex basis-full flex-wrap gap-2 border-t border-separator pt-4">
            {client.phone && (
              <a href={whatsappLink('', client.phone)} target="_blank" rel="noreferrer" className={buttonClassName('ghost', 'sm')}>
              <MessageCircle className="h-4 w-4" /> {t('clients.contact')}
            </a>
            )}
            <Button size="sm" variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(true)}>
              {t('common.edit')}
            </Button>
            <Button size="sm" variant="subtle" icon={<KeyRound className="h-4 w-4" />} onClick={() => setResetting(true)}>
              {t('clients.resetPassword')}
            </Button>
            <Button size="sm" variant="ghost" icon={<Power className="h-4 w-4" />} onClick={() => void toggleActive()}>
              {client.is_active ? t('clients.deactivate') : t('clients.activate')}
            </Button>
            <Button size="sm" variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleting(true)}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader icon={<Unlock className="h-5 w-5" />} title={t('clients.access')} />
          <form onSubmit={grant} className="grid gap-4 border-b border-separator p-4 sm:grid-cols-[minmax(8rem,1fr)_2fr] sm:p-6">
            <Field label={t('clients.type')}>
              <Select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as 'pack' | 'formation');
                  setTarget('');
                }}
              >
                <option value="pack">{t('clients.pack')}</option>
                <option value="formation">{t('clients.formation')}</option>
              </Select>
            </Field>
            <Field label={type === 'pack' ? t('clients.pack') : t('clients.formation')}>
              <Select value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">{t('clients.choose')}</option>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={`${t('clients.expiresAt')} (${t('common.optional')})`} className="sm:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input type="date" dir="ltr" value={expires} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setExpires(e.target.value)} />
                <Button type="submit" loading={granting} disabled={!target} icon={<Unlock className="h-4 w-4" />}>
                  {t('clients.grantAccess')}
                </Button>
              </div>
            </Field>
          </form>
          <div className="divide-y divide-separator px-4 sm:px-6">
            {(grantsQ.data ?? []).length === 0 && <p className="p-6 text-center text-sm text-label-secondary">{t('clients.noGrants')}</p>}
            {(grantsQ.data ?? []).map((g) => {
              const expired = isExpired(g.expires_at);
              return (
                <div key={g.id} className="flex flex-wrap items-center gap-2 py-4">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${g.pack_id ? 'bg-info-soft text-info' : 'bg-accent-soft text-accent'}`}>
                    {g.pack_id ? <Crown className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-label">{g.packs?.title ?? g.formations?.title ?? '—'}</div>
                    <div className="text-xs text-label-secondary">
                      {g.expires_at ? `${t('clients.expiresAt')} ${formatDate(g.expires_at, locale)}` : t('clients.noExpiry')}
                    </div>
                  </div>
                  {expired && <Badge tone="red">{t('clients.expired')}</Badge>}
                  <Button size="sm" variant="ghost" className="text-danger hover:bg-danger-soft" onClick={() => setRevoking(g)}>
                    {t('clients.revoke')}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader icon={<BarChart3 className="h-5 w-5" />} title={t('clients.progress')} />
          <div className="divide-y divide-separator px-4 sm:px-6">
            {progressRows.length === 0 && <p className="p-6 text-center text-sm text-label-secondary">{t('clients.noProgress')}</p>}
            {progressRows.map((r) => (
              <div key={r.id} className="py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-label">{r.title}</span>
                  <span className="shrink-0 text-xs tabular-nums text-label-secondary">
                    {r.done}/{r.total} · {r.pct}%
                  </span>
                </div>
                <ProgressBar value={r.pct} className="mt-2" />
                {r.last && <div className="mt-1.5 text-caption text-label-secondary">{formatDate(r.last, locale)}</div>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <ClientFormModal open={editing} client={client} onClose={() => setEditing(false)} />
      <ResetPasswordModal client={resetting ? client : null} onClose={() => setResetting(false)} onDone={setCreds} />
      <CredentialsModal data={creds} onClose={() => setCreds(null)} />
      <ConfirmDialog
        open={!!revoking}
        onClose={() => setRevoking(null)}
        onConfirm={() => void revoke()}
        title={t('clients.revokeConfirm')}
        description={revoking?.packs?.title ?? revoking?.formations?.title ?? ''}
        confirmLabel={t('clients.revoke')}
      />
      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={() => void remove()}
        title={t('clients.deleteConfirm')}
        description={`${client.email} — ${t('clients.deleteText')}`}
        confirmLabel={t('common.delete')}
      />
    </div>
  );
}
