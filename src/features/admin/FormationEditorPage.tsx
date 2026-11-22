import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Eye, FolderOpen, Gift, Layers, Pencil, RefreshCw, Trash2, UploadCloud, Video as VideoIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, Modal, PageLoader, Switch } from '@/components/ui';
import { CoverImage } from '@/components/CoverImage';
import { LevelBadge, StatusBadge } from '@/components/Badges';
import { SortableList } from '@/components/SortableList';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useAuth } from '@/features/auth/AuthProvider';
import { api } from '@/lib/functions';
import { supabase } from '@/lib/supabase';
import { errorMessage, formatDuration } from '@/lib/utils';
import type { Section, Video } from '@/types/database';
import { FormationFormModal } from './FormationFormModal';
import { SectionsManager } from './SectionsManager';
import { UploadZone } from './UploadZone';
import { VideoEditModal } from './VideoEditModal';
import { persistOrder, useVideosRealtime } from './hooks';

export function FormationEditorPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [editInfo, setEditInfo] = useState(false);
  const [editVideo, setEditVideo] = useState<Video | null>(null);
  const [preview, setPreview] = useState<Video | null>(null);
  const [deleting, setDeleting] = useState<Video | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  useVideosRealtime(id);

  const formationQ = useQuery({
    queryKey: ['admin', 'formation', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('formations').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const sectionsQ = useQuery({
    queryKey: ['admin', 'sections', id],
    queryFn: async (): Promise<Section[]> => {
      const { data, error } = await supabase.from('sections').select('*').eq('formation_id', id).order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
  const videosQ = useQuery({
    queryKey: ['admin', 'videos', id],
    queryFn: async (): Promise<Video[]> => {
      const { data, error } = await supabase.from('videos').select('*').eq('formation_id', id).order('sort_order').order('created_at');
      if (error) throw error;
      return data ?? [];
    },
    // Fallback polling while something is still encoding (in case realtime is off).
    refetchInterval: (q) => ((q.state.data ?? []).some((v) => v.status === 'processing' || v.status === 'uploading') ? 20_000 : false),
  });

  const sections = useMemo(() => sectionsQ.data ?? [], [sectionsQ.data]);
  const videos = useMemo(() => videosQ.data ?? [], [videosQ.data]);

  const groups = useMemo(() => {
    const ids = new Set(sections.map((s) => s.id));
    return [
      ...sections.map((s) => ({ id: s.id, title: s.title, items: videos.filter((v) => v.section_id === s.id) })),
      { id: '__none', title: t('sections.noSection'), items: videos.filter((v) => !v.section_id || !ids.has(v.section_id)) },
    ];
  }, [sections, videos, t]);

  const reorderGroup = async (groupId: string, next: Video[]) => {
    // Rebuild the global order from all groups in display order.
    const all = groups.flatMap((g) => (g.id === groupId ? next : g.items));
    qc.setQueryData(['admin', 'videos', id], all);
    try {
      await persistOrder('videos', all);
    } catch (e) {
      toast.error(errorMessage(e));
    }
    void qc.invalidateQueries({ queryKey: ['admin', 'videos', id] });
  };

  const togglePublish = async (v: boolean) => {
    const { error } = await supabase.from('formations').update({ is_published: v }).eq('id', id);
    if (error) toast.error(error.message);
    void qc.invalidateQueries({ queryKey: ['admin', 'formation', id] });
    void qc.invalidateQueries({ queryKey: ['admin', 'formations'] });
  };

  const toggleFree = async (v: Video) => {
    const { error } = await supabase.from('videos').update({ is_free_preview: !v.is_free_preview }).eq('id', v.id);
    if (error) toast.error(error.message);
    void qc.invalidateQueries({ queryKey: ['admin', 'videos', id] });
  };

  const refresh = async (v: Video) => {
    setRefreshing(v.id);
    try {
      await api.refreshVideo(v.id);
      toast.success(t('videos.refreshed'));
      void qc.invalidateQueries({ queryKey: ['admin', 'videos', id] });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setRefreshing(null);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteVideo(deleting.id);
      toast.success(t('common.deleted'));
      setDeleting(null);
      void qc.invalidateQueries({ queryKey: ['admin', 'videos', id] });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (formationQ.isLoading) return <PageLoader />;
  const formation = formationQ.data;
  if (!formation) return <EmptyState icon={<VideoIcon />} title={t('formation.notFound')} action={<Link to="/admin/formations"><Button variant="secondary">{t('common.back')}</Button></Link>} />;

  const totalSeconds = videos.reduce((s, v) => s + (v.duration_seconds ?? 0), 0);

  return (
    <div className="space-y-6">
      <Link to="/admin/formations" className="inline-flex items-center gap-1 text-sm text-label-secondary hover:text-label">
        <ChevronLeft className="rtl-flip h-4 w-4" /> {t('formations.title')}
      </Link>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <div className="group aspect-video w-full shrink-0 overflow-hidden rounded-xl sm:w-48">
            <CoverImage src={formation.cover_url} alt={formation.title} seed={formation.id} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-title-2 sm:text-3xl">{formation.title}</h1>
              <LevelBadge level={formation.level} />
            </div>
            {formation.short_description && <p className="mt-1 text-sm text-label-secondary">{formation.short_description}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-label-secondary">
              <Badge tone="gray" icon={<VideoIcon className="h-3 w-3" />}>
                {t('formations.videosCount', { count: videos.length })}
              </Badge>
              <Badge tone="gray">{formatDuration(totalSeconds)}</Badge>
              <span dir="ltr">/formation/{formation.slug}</span>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <Switch checked={formation.is_published} onChange={(v) => void togglePublish(v)} label={formation.is_published ? t('common.published') : t('common.draft')} />
            <div className="flex gap-2">
              <Link to={`/formation/${formation.slug}`}>
                <Button size="sm" variant="ghost" icon={<Eye className="h-4 w-4" />}>
                  {t('common.view')}
                </Button>
              </Link>
              <Button size="sm" variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditInfo(true)}>
                {t('formations.details')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader icon={<Layers className="h-5 w-5" />} title={t('sections.title')} />
            <div className="p-6">
              <SectionsManager formationId={id} sections={sections} />
            </div>
          </Card>
          <Card>
            <CardHeader icon={<UploadCloud className="h-5 w-5" />} title={t('videos.upload')} />
            <div className="p-6">
              <UploadZone formationId={id} sections={sections} />
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader icon={<VideoIcon className="h-5 w-5" />} title={t('videos.title')} subtitle={videos.length ? t('common.dragToReorder') : undefined} />
          <div className="space-y-6 p-6">
            {videosQ.isLoading ? (
              <PageLoader />
            ) : videos.length === 0 ? (
              <EmptyState icon={<VideoIcon />} title={t('videos.empty')} className="border-0 py-10" />
            ) : (
              groups
                .filter((g) => g.items.length > 0 || g.id !== '__none')
                .map((g) => (
                  <div key={g.id}>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rosegold">
                      <FolderOpen className="h-4 w-4" /> {g.title}
                      <span className="text-label-secondary">({g.items.length})</span>
                    </div>
                    {g.items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-separator/60 p-3 text-center text-xs text-label-secondary">—</div>
                    ) : (
                      <SortableList
                        items={g.items}
                        onReorder={(n) => void reorderGroup(g.id, n)}
                        className="space-y-2"
                        renderItem={(v, handle) => (
                          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-separator/60 bg-surface-secondary p-2 sm:flex-nowrap">
                            {handle}
                            <div className="group relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-tertiary">
                              <CoverImage src={v.thumbnail_url} alt={v.title} seed={v.id} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-label">{v.title}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <StatusBadge status={v.status} />
                                {v.duration_seconds ? <Badge tone="gray">{formatDuration(v.duration_seconds)}</Badge> : null}
                                {v.is_free_preview && (
                                  <Badge tone="gold" icon={<Gift className="h-3 w-3" />}>
                                    {t('common.free')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-0.5">
                              <Button size="icon" variant="ghost" title={t('videos.preview')} disabled={v.status !== 'ready'} onClick={() => setPreview(v)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title={t('videos.freePreview')}
                                className={v.is_free_preview ? 'text-rosegold' : ''}
                                onClick={() => void toggleFree(v)}
                              >
                                <Gift className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" title={t('videos.refresh')} onClick={() => void refresh(v)}>
                                <RefreshCw className={`h-4 w-4 ${refreshing === v.id ? 'animate-spin' : ''}`} />
                              </Button>
                              <Button size="icon" variant="ghost" title={t('common.edit')} onClick={() => setEditVideo(v)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="text-danger hover:bg-danger-soft" title={t('common.delete')} onClick={() => setDeleting(v)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      />
                    )}
                  </div>
                ))
            )}
          </div>
        </Card>
      </div>

      <FormationFormModal open={editInfo} formation={formation} onClose={() => setEditInfo(false)} />
      <VideoEditModal video={editVideo} sections={sections} onClose={() => setEditVideo(null)} />
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.title} size="xl">
        {preview && <VideoPlayer videoId={preview.id} watermark={profile?.email ?? ''} />}
      </Modal>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void remove()}
        loading={busy}
        title={t('videos.deleteConfirm')}
        description={`${deleting?.title ?? ''} — ${t('videos.deleteText')}`}
        confirmLabel={t('common.delete')}
      />
    </div>
  );
}
