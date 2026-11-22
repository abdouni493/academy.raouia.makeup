import { LoadingTransition } from '@/components/Motion';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Crown, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge, Button, TableSkeleton, ConfirmDialog, EmptyState, Field, Input, Modal, Select, Switch, Textarea } from '@/components/ui';
import { CoverImage } from '@/components/CoverImage';
import { CoverUpload } from '@/components/CoverUpload';
import { PageHeader } from '@/components/PageHeader';
import { SortableList } from '@/components/SortableList';
import { localeFor } from '@/i18n';
import { DEFAULT_CURRENCY } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import { errorMessage, formatPrice, slugify } from '@/lib/utils';
import type { Formation, Pack } from '@/types/database';
import { persistOrder } from './hooks';

type PackRow = Pack & { pack_formations: { formation_id: string; sort_order: number }[] };

function useAllFormations() {
  return useQuery({
    queryKey: ['admin', 'formations', 'light'],
    queryFn: async (): Promise<Pick<Formation, 'id' | 'title' | 'is_published'>[]> => {
      const { data, error } = await supabase.from('formations').select('id, title, is_published').order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function PacksPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<PackRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<PackRow | null>(null);
  const formations = useAllFormations();
  const titleOf = useMemo(() => Object.fromEntries((formations.data ?? []).map((f) => [f.id, f.title])), [formations.data]);

  const packs = useQuery({
    queryKey: ['admin', 'packs'],
    queryFn: async (): Promise<PackRow[]> => {
      const { data, error } = await supabase.from('packs').select('*, pack_formations(formation_id, sort_order)').order('sort_order').order('created_at');
      if (error) throw error;
      return (data ?? []) as unknown as PackRow[];
    },
  });

  const togglePublish = async (p: Pack, v: boolean) => {
    const { error } = await supabase.from('packs').update({ is_published: v }).eq('id', p.id);
    if (error) toast.error(error.message);
    void qc.invalidateQueries({ queryKey: ['admin', 'packs'] });
  };

  const remove = async () => {
    if (!deleting) return;
    const { error } = await supabase.from('packs').delete().eq('id', deleting.id);
    if (error) toast.error(error.message);
    else toast.success(t('common.deleted'));
    setDeleting(null);
    void qc.invalidateQueries({ queryKey: ['admin', 'packs'] });
  };

  const reorder = async (next: PackRow[]) => {
    qc.setQueryData(['admin', 'packs'], next);
    try {
      await persistOrder('packs', next);
      toast.success(t('common.orderSaved'));
    } catch (e) {
      toast.error(errorMessage(e));
    }
    void qc.invalidateQueries({ queryKey: ['admin', 'packs'] });
  };

  return (
    <div>
      <PageHeader
        title={t('packs.title')}
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            {t('packs.new')}
          </Button>
        }
      />
      <LoadingTransition loading={packs.isLoading} fallback={<div className="card"><TableSkeleton rows={3} /></div>}>
        {!packs.data?.length ? (
          <EmptyState icon={<Crown />} title={t('packs.empty')} text={t('packs.emptyText')} action={<Button onClick={() => setCreating(true)}>{t('packs.new')}</Button>} />
        ) : (
          <>
            <p className="mb-2 text-xs text-label-secondary">{t('common.dragToReorder')}</p>
            <SortableList
              items={packs.data}
              onReorder={(n) => void reorder(n)}
              className="grouped-list overflow-hidden px-4 sm:px-6"
              renderItem={(p, handle) => (
                <div className="flex flex-col gap-2 py-4 lg:flex-row lg:items-center lg:gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {handle}
                    <div className="group h-14 w-16 shrink-0 overflow-hidden rounded-xl sm:h-16 sm:w-24">
                      <CoverImage src={p.cover_url} alt={p.title} seed={p.id} pack />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-label">{p.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {p.price !== null && <Badge tone="gold">{formatPrice(p.price, p.currency, localeFor(i18n.language))}</Badge>}
                        <Badge tone="gray">{t('packs.includes', { count: p.pack_formations.length })}</Badge>
                      </div>
                      <div className="mt-1 truncate text-xs text-label-secondary">
                        {[...p.pack_formations]
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((pf) => titleOf[pf.formation_id])
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1 lg:justify-end">
                    <Switch checked={p.is_published} onChange={(v) => void togglePublish(p, v)} label={p.is_published ? t('common.published') : t('common.draft')} />
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(p)} title={t('common.edit')}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-danger hover:bg-danger-soft" onClick={() => setDeleting(p)} title={t('common.delete')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            />
          </>
        )}
      </LoadingTransition>

      <PackFormModal
        open={creating || !!editing}
        pack={editing}
        formations={formations.data ?? []}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void remove()}
        title={t('packs.deleteConfirm')}
        description={`${deleting?.title ?? ''} — ${t('packs.deleteText')}`}
        confirmLabel={t('common.delete')}
      />
    </div>
  );
}

function PackFormModal({
  open,
  pack,
  formations,
  onClose,
}: {
  open: boolean;
  pack: PackRow | null;
  formations: Pick<Formation, 'id' | 'title' | 'is_published'>[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [cover, setCover] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [selected, setSelected] = useState<{ id: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(pack?.title ?? '');
    setSlug(pack?.slug ?? '');
    setSlugTouched(!!pack);
    setDescription(pack?.description ?? '');
    setPrice(pack?.price != null ? String(pack.price) : '');
    setCurrency(pack?.currency ?? DEFAULT_CURRENCY);
    setCover(pack?.cover_url ?? null);
    setPublished(pack?.is_published ?? false);
    setSelected(
      [...(pack?.pack_formations ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((pf) => ({ id: pf.formation_id })),
    );
  }, [open, pack]);

  const titleOf = Object.fromEntries(formations.map((f) => [f.id, f.title]));
  const available = formations.filter((f) => !selected.some((s) => s.id === f.id));

  const save = async () => {
    if (title.trim().length < 2 || slug.trim().length < 2) return toast.error(t('common.required'));
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slugify(slug),
        description: description.trim() || null,
        price: price === '' ? null : Number(price),
        currency: currency.trim().toUpperCase() || DEFAULT_CURRENCY,
        cover_url: cover,
        is_published: published,
      };
      let packId = pack?.id;
      if (packId) {
        const { error } = await supabase.from('packs').update(payload).eq('id', packId);
        if (error) throw error;
      } else {
        const { data: last } = await supabase.from('packs').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
        const { data, error } = await supabase
          .from('packs')
          .insert({ ...payload, sort_order: (last?.sort_order ?? -1) + 1 })
          .select('id')
          .single();
        if (error) throw error;
        packId = data.id;
      }
      // Replace pack contents.
      const del = await supabase.from('pack_formations').delete().eq('pack_id', packId!);
      if (del.error) throw del.error;
      if (selected.length) {
        const ins = await supabase
          .from('pack_formations')
          .insert(selected.map((s, i) => ({ pack_id: packId!, formation_id: s.id, sort_order: i })));
        if (ins.error) throw ins.error;
      }
      toast.success(t('common.saved'));
      void qc.invalidateQueries({ queryKey: ['admin', 'packs'] });
      onClose();
    } catch (e) {
      const msg = errorMessage(e);
      toast.error(/duplicate|23505/.test(msg) ? t('formations.slugTaken') : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={pack ? t('packs.edit') : t('packs.new')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void save()} loading={saving}>
            {pack ? t('common.save') : t('common.create')}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        <div className="sm:col-span-2">
          <CoverUpload value={cover} onChange={setCover} folder="packs" />
        </div>
        <Field label={t('formations.fieldTitle')} className="sm:col-span-2">
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </Field>
        <Field label={t('formations.slug')} className="sm:col-span-2">
          <Input
            dir="ltr"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
          />
        </Field>
        <Field label={t('packs.price')}>
          <Input type="number" min={0} step="1" dir="ltr" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label={t('packs.currency')}>
          <Input dir="ltr" maxLength={5} value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </Field>
        <Field label={t('formations.description')} className="sm:col-span-2">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <div className="space-y-3 sm:col-span-2">
          <span className="block text-sm font-medium text-label">{t('packs.formations')}</span>
          {selected.length === 0 ? (
            <p className="rounded-xl bg-surface-tertiary p-3 text-sm text-label-secondary">{t('packs.noFormations')}</p>
          ) : (
            <SortableList
              items={selected}
              onReorder={setSelected}
              className="grouped-list px-2"
              renderItem={(s, handle, i) => (
                <div className="flex items-center gap-2 py-2">
                  {handle}
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-soft text-xs font-semibold text-accent">{i + 1}</span>
                  <span className="flex-1 truncate text-sm">{titleOf[s.id] ?? '—'}</span>
                  <button aria-label={t('common.delete')} className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-label-secondary hover:bg-danger-soft hover:text-danger" onClick={() => setSelected((p) => p.filter((x) => x.id !== s.id))}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            />
          )}
          {available.length > 0 && (
            <Select
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (id) setSelected((p) => [...p, { id }]);
              }}
            >
              <option value="">+ {t('packs.addFormation')}</option>
              {available.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title} {f.is_published ? '' : `(${t('common.draft')})`}
                </option>
              ))}
            </Select>
          )}
        </div>
        <div className="sm:col-span-2">
          <Switch checked={published} onChange={setPublished} label={t('common.published')} />
        </div>
      </div>
    </Modal>
  );
}
