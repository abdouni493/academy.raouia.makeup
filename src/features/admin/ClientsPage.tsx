import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, KeyRound, Pencil, Plus, Power, Search, Trash2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge, Button, ConfirmDialog, EmptyState, Input, Table, TableSkeleton, Td, Th, THead, Tr } from '@/components/ui';
import { PageHeader } from '@/components/PageHeader';
import { localeFor } from '@/i18n';
import { api } from '@/lib/functions';
import { supabase } from '@/lib/supabase';
import { cn, errorMessage, formatDate } from '@/lib/utils';
import type { Profile } from '@/types/database';
import { ClientFormModal, CredentialsModal, ResetPasswordModal } from './ClientFormModal';

type Filter = 'all' | 'active' | 'inactive';

export function ClientsPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [resetting, setResetting] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState<Profile | null>(null);
  const [creds, setCreds] = useState<{ name: string; email: string; password: string; phone?: string | null } | null>(null);
  const [busy, setBusy] = useState(false);

  const query = useQuery({
    queryKey: ['admin', 'clients'],
    queryFn: async (): Promise<(Profile & { access_grants: { count: number }[] })[]> => {
      const { data, error } = await supabase.from('profiles').select('*, access_grants!access_grants_user_id_fkey(count)').eq('role', 'client').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as (Profile & { access_grants: { count: number }[] })[];
    },
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (query.data ?? []).filter(
      (c) =>
        (filter === 'all' || (filter === 'active' ? c.is_active : !c.is_active)) &&
        (!q || [c.full_name, c.email, c.phone].some((x) => x?.toLowerCase().includes(q))),
    );
  }, [query.data, search, filter]);

  const toggleActive = async (c: Profile) => {
    try {
      await api.clients.setActive(c.id, !c.is_active);
      toast.success(c.is_active ? t('clients.deactivated') : t('clients.activated'));
      void qc.invalidateQueries({ queryKey: ['admin', 'clients'] });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.clients.remove(deleting.id);
      toast.success(t('common.deleted'));
      setDeleting(null);
      void qc.invalidateQueries({ queryKey: ['admin', 'clients'] });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const locale = localeFor(i18n.language);

  return (
    <div>
      <PageHeader
        title={t('clients.title')}
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            {t('clients.new')}
          </Button>
        }
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input className="ps-11" placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-blush-100">
          {(['all', 'active', 'inactive'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn('rounded-lg px-4 py-2 text-sm font-medium transition', filter === f ? 'bg-brand-gradient text-white shadow' : 'text-muted hover:text-plum')}
            >
              {t(`common.${f}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {query.isLoading ? (
          <TableSkeleton />
        ) : !query.data?.length ? (
          <EmptyState
            className="m-5"
            icon={<Users />}
            title={t('clients.empty')}
            text={t('clients.emptyText')}
            action={<Button onClick={() => setCreating(true)}>{t('clients.new')}</Button>}
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>{t('clients.fullName')}</Th>
                <Th>{t('clients.phone')}</Th>
                <Th>{t('clients.access')}</Th>
                <Th>{t('clients.joined')}</Th>
                <Th>{t('common.status')}</Th>
                <Th className="text-end">{t('common.actions')}</Th>
              </tr>
            </THead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-sm text-muted">
                    {t('common.noResults')}
                  </td>
                </tr>
              )}
              {rows.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <Link to={`/admin/clients/${c.id}`} className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blush-100 text-sm font-semibold text-blush-700">
                        {(c.full_name || c.email || '?').slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-plum hover:text-blush-600">{c.full_name || '—'}</span>
                        <span className="block truncate text-xs text-muted">{c.email}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td className="text-muted" dir="ltr">
                    {c.phone || '—'}
                  </Td>
                  <Td>
                    <Badge tone="rose">{c.access_grants?.[0]?.count ?? 0}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{formatDate(c.created_at, locale)}</Td>
                  <Td>{c.is_active ? <Badge tone="green">{t('common.active')}</Badge> : <Badge tone="red">{t('clients.suspended')}</Badge>}</Td>
                  <Td>
                    <div className="flex justify-end gap-0.5">
                      <Button size="icon" variant="ghost" title={t('common.edit')} onClick={() => setEditing(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title={t('clients.resetPassword')} onClick={() => setResetting(c)}>
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title={c.is_active ? t('clients.deactivate') : t('clients.activate')}
                        className={c.is_active ? 'text-amber-600' : 'text-emerald-600'}
                        onClick={() => void toggleActive(c)}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" title={t('common.delete')} onClick={() => setDeleting(c)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Link to={`/admin/clients/${c.id}`}>
                        <Button size="icon" variant="ghost" title={t('common.view')}>
                          <ChevronRight className="rtl-flip h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <ClientFormModal open={creating || !!editing} client={editing} onClose={() => (setCreating(false), setEditing(null))} onCreated={setCreds} />
      <ResetPasswordModal client={resetting} onClose={() => setResetting(null)} onDone={setCreds} />
      <CredentialsModal data={creds} onClose={() => setCreds(null)} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void remove()}
        loading={busy}
        title={t('clients.deleteConfirm')}
        description={`${deleting?.email ?? ''} — ${t('clients.deleteText')}`}
        confirmLabel={t('common.delete')}
      />
    </div>
  );
}
