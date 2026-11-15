import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Settings, Trash2, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge, Button, ConfirmDialog, EmptyState, Input, Switch, TableSkeleton } from '@/components/ui';
import { CoverImage } from '@/components/CoverImage';
import { LevelBadge } from '@/components/Badges';
import { PageHeader } from '@/components/PageHeader';
import { SortableList } from '@/components/SortableList';
import { api } from '@/lib/functions';
import { supabase } from '@/lib/supabase';
import { errorMessage } from '@/lib/utils';
import type { Formation } from '@/types/database';
import { FormationFormModal } from './FormationFormModal';
import { persistOrder } from './hooks';

type Row = Formation & { videos: { count: number }[] };

export function FormationsListPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Formation | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Formation | null>(null);
  const [busy, setBusy] = useState(false);

  const query = useQuery({
    queryKey: ['admin', 'formations'],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase.from('formations').select('*, videos(count)').order('sort_order').order('created_at');
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (query.data ?? []).filter((f) => !q || f.title.toLowerCase().includes(q) || f.slug.includes(q));
  }, [query.data, search]);

  const reorder = async (next: Row[]) => {
    qc.setQueryData(['admin', 'formations'], next);
    try {
      await persistOrder('formations', next);
      toast.success(t('common.orderSaved'));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      void qc.invalidateQueries({ queryKey: ['admin', 'formations'] });
    }
  };

  const togglePublish = async (f: Formation, v: boolean) => {
    const { error } = await supabase.from('formations').update({ is_published: v }).eq('id', f.id);
    if (error) toast.error(error.message);
    void qc.invalidateQueries({ queryKey: ['admin', 'formations'] });
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteFormation(deleting.id);
      toast.success(t('common.deleted'));
      setDeleting(null);
      void qc.invalidateQueries({ queryKey: ['admin'] });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const renderRow = (f: Row, handle?: React.ReactNode) => (
    <div className="card flex flex-col gap-4 p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {handle}
        <div className="group h-16 w-24 shrink-0 overflow-hidden rounded-xl">
          <CoverImage src={f.cover_url} alt={f.title} seed={f.id} />
        </div>
        <div className="min-w-0">
          <Link to={`/admin/formations/${f.id}`} className="block truncate font-semibold text-plum hover:text-blush-600">
            {f.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <LevelBadge level={f.level} />
            <Badge tone="gray" icon={<Video className="h-3 w-3" />}>
              {t('formations.videosCount', { count: f.videos?.[0]?.count ?? 0 })}
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Switch checked={f.is_published} onChange={(v) => void togglePublish(f, v)} label={f.is_published ? t('common.published') : t('common.draft')} />
        <div className="flex gap-1">
          <Link to={`/admin/formations/${f.id}`}>
            <Button size="sm" variant="subtle" icon={<Settings className="h-4 w-4" />}>
              <span className="hidden md:inline">{t('formations.manage')}</span>
            </Button>
          </Link>
          <Button size="icon" variant="ghost" onClick={() => setEditing(f)} title={t('common.edit')}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => setDeleting(f)} title={t('common.delete')}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={t('formations.title')}
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            {t('formations.new')}
          </Button>
        }
      />
      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input className="ps-11" placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {query.isLoading ? (
        <div className="card">
          <TableSkeleton />
        </div>
      ) : !query.data?.length ? (
        <EmptyState
          icon={<Video />}
          title={t('formations.empty')}
          text={t('formations.emptyText')}
          action={<Button onClick={() => setCreating(true)}>{t('formations.new')}</Button>}
        />
      ) : search ? (
        <div className="space-y-3">{rows.length ? rows.map((f) => <div key={f.id}>{renderRow(f)}</div>) : <p className="text-sm text-muted">{t('common.noResults')}</p>}</div>
      ) : (
        <>
          <p className="mb-2 text-xs text-muted">{t('common.dragToReorder')}</p>
          <SortableList items={rows} onReorder={(n) => void reorder(n)} className="space-y-3" renderItem={(f, handle) => renderRow(f, handle)} />
        </>
      )}

      <FormationFormModal open={creating || !!editing} formation={editing} onClose={() => (setCreating(false), setEditing(null))} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void remove()}
        loading={busy}
        title={t('formations.deleteConfirm')}
        description={`${deleting?.title ?? ''} — ${t('formations.deleteText')}`}
        confirmLabel={t('common.delete')}
      />
    </div>
  );
}
