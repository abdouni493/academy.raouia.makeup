import { LoadingTransition } from '@/components/Motion';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, KeyRound, Pencil, Plus, Power, Search, Trash2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge, Button, buttonClassName, ConfirmDialog, EmptyState, Input, Table, TableSkeleton, Td, Th, THead, Tr } from '@/components/ui';
import { PageHeader } from '@/components/PageHeader';
import { localeFor } from '@/i18n';
import { api } from '@/lib/functions';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { spring, useReducedMotion } from '@/lib/motion';
import { cn, errorMessage, formatDate } from '@/lib/utils';
import type { Profile } from '@/types/database';
import { ClientFormModal, CredentialsModal, ResetPasswordModal } from './ClientFormModal';

type Filter = 'all' | 'active' | 'inactive';

export function ClientsPage() {
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-label-secondary" />
          <Input className="rounded-full ps-11" type="search" aria-label={t('common.search')} placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div role="group" aria-label={t('common.status')} className="glass inline-flex max-w-full flex-wrap rounded-xl p-1">
          {(['all', 'active', 'inactive'] as Filter[]).map((f) => (
            <button
              key={f}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn('focus-ring relative min-h-11 flex-1 rounded-lg px-3 py-2 text-subhead font-medium transition-colors', filter === f ? 'text-accent' : 'text-label-secondary hover:text-label')}
            >
              {filter === f && <motion.span aria-hidden="true" layoutId={reducedMotion ? undefined : "client-filter"} transition={reducedMotion ? { duration: 0 } : spring} className="absolute inset-0 rounded-lg bg-card shadow-soft" />}
              <span className="relative">{t(`common.${f}`)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <LoadingTransition loading={query.isLoading} fallback={<TableSkeleton />}>
          {!query.data?.length ? (
            <EmptyState
              className="m-6"
              icon={<Users />}
              title={t('clients.empty')}
              text={t('clients.emptyText')}
              action={<Button onClick={() => setCreating(true)}>{t('clients.new')}</Button>}
            />
          ) : (
            <Table className="max-lg:[&_table]:min-w-0 max-lg:[&_table]:table-fixed">
              <THead>
                <tr>
                  <Th>{t('clients.fullName')}</Th>
                  <Th className="hidden lg:table-cell">{t('clients.phone')}</Th>
                  <Th className="hidden lg:table-cell">{t('clients.access')}</Th>
                  <Th className="hidden lg:table-cell">{t('clients.joined')}</Th>
                  <Th className="hidden lg:table-cell">{t('common.status')}</Th>
                  <Th className="w-14 text-end lg:w-auto"><span className="sr-only lg:not-sr-only">{t('common.actions')}</span></Th>
                </tr>
              </THead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-sm text-label-secondary">
                      {t('common.noResults')}
                    </td>
                  </tr>
                )}
                {rows.map((c) => (
                  <Tr key={c.id}>
                    <Td>
                      <Link to={`/admin/clients/${c.id}`} className="focus-ring flex min-h-11 items-center gap-3 rounded-lg">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                          {(c.full_name || c.email || '?').slice(0, 1).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-label hover:text-accent">{c.full_name || '—'}</span>
                          <span className="block truncate text-xs text-label-secondary">{c.email}</span>
                          <span className="mt-1 block lg:hidden">{c.is_active ? <Badge tone="green">{t('common.active')}</Badge> : <Badge tone="red">{t('clients.suspended')}</Badge>}</span>
                        </span>
                      </Link>
                    </Td>
                    <Td className="hidden text-label-secondary lg:table-cell" dir="ltr">
                      {c.phone || '—'}
                    </Td>
                    <Td className="hidden lg:table-cell">
                      <Badge tone="rose">{c.access_grants?.[0]?.count ?? 0}</Badge>
                    </Td>
                    <Td className="hidden whitespace-nowrap text-label-secondary lg:table-cell">{formatDate(c.created_at, locale)}</Td>
                    <Td className="hidden lg:table-cell">{c.is_active ? <Badge tone="green">{t('common.active')}</Badge> : <Badge tone="red">{t('clients.suspended')}</Badge>}</Td>
                    <Td>
                      <div className="flex justify-end gap-0.5 max-lg:[&>button]:hidden">
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
                          className={c.is_active ? 'text-warning' : 'text-success'}
                          onClick={() => void toggleActive(c)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-danger hover:bg-danger-soft" title={t('common.delete')} onClick={() => setDeleting(c)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Link to={`/admin/clients/${c.id}`} className={buttonClassName('ghost', 'icon')} aria-label={t('common.view')}>
                          <ChevronRight className="rtl-flip h-4 w-4" />
                        </Link>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </LoadingTransition>
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
