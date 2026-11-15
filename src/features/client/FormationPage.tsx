import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Clock,
  Lock,
  MessageCircle,
  PlayCircle,
} from 'lucide-react';
import { AnimatePresence, motion, useIsPresent } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ease, spring } from '@/lib/motion';
import { toast } from 'sonner';
import { Badge, Button, EmptyState, Skeleton } from '@/components/ui';
import { LevelBadge, ProgressBar } from '@/components/Badges';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { cn, errorMessage, formatDuration, formatHours, whatsappLink } from '@/lib/utils';
import type { VideoProgress } from '@/types/database';
import { useFormationBySlug, type FormationData } from './queries';

interface Item {
  id: string;
  title: string;
  description: string | null;
  section_id: string | null;
  duration_seconds: number | null;
  is_free_preview: boolean;
  playable: boolean;
}

export function FormationPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { profile, session } = useAuth();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const query = useFormationBySlug(slug);
  const data = query.data;
  const queryKey = useMemo(() => ['formation', slug, session?.user.id], [slug, session?.user.id]);
  const [tab, setTab] = useState<'description' | 'content'>('description');

  // Build the ordered list of lessons (sections order, then unsectioned).
  const { groups, flat } = useMemo(() => {
    if (!data) return { groups: [], flat: [] as Item[] };
    const descById = Object.fromEntries(data.videos.map((v) => [v.id, v.description]));
    const playableIds = new Set(data.videos.map((v) => v.id));
    const items: Item[] = data.outline.map((o) => ({
      id: o.id,
      title: o.title,
      description: descById[o.id] ?? null,
      section_id: o.section_id,
      duration_seconds: o.duration_seconds,
      is_free_preview: o.is_free_preview,
      playable: playableIds.has(o.id) && (data.hasAccess || o.is_free_preview),
    }));
    const sectionIds = new Set(data.sections.map((s) => s.id));
    const groups = [
      ...data.sections.map((s) => ({ id: s.id, title: s.title, items: items.filter((i) => i.section_id === s.id) })),
      { id: 'none', title: t('formation.unsectioned'), items: items.filter((i) => !i.section_id || !sectionIds.has(i.section_id)) },
    ].filter((g) => g.items.length > 0);
    return { groups, flat: groups.flatMap((g) => g.items) };
  }, [data, t]);

  const playable = flat.filter((i) => i.playable);
  // While this page animates out (after navigating away) the URL no longer has
  // ?v=…; keep showing the lesson that was open so nothing re-animates mid-exit.
  const isPresent = useIsPresent();
  const lastRequested = useRef<string | null>(null);
  if (isPresent) lastRequested.current = params.get('v');
  const requested = lastRequested.current;
  const current =
    playable.find((i) => i.id === requested) ??
    playable.find((i) => !data?.progress[i.id]?.completed) ??
    playable[0];
  const currentIndex = current ? playable.findIndex((i) => i.id === current.id) : -1;
  const prev = currentIndex > 0 ? playable[currentIndex - 1] : undefined;
  const next = currentIndex >= 0 && currentIndex < playable.length - 1 ? playable[currentIndex + 1] : undefined;

  const select = (id: string) => {
    setParams({ v: id }, { replace: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => setTab('description'), [current?.id]);

  const setLocalProgress = useCallback(
    (row: VideoProgress) => {
      qc.setQueryData<FormationData | null>(queryKey, (old) => (old ? { ...old, progress: { ...old.progress, [row.video_id]: row } } : old));
    },
    [qc, queryKey],
  );

  const saveProgress = useCallback(
    async (videoId: string, seconds: number, completed?: boolean) => {
      if (!session) return;
      const existing = qc.getQueryData<FormationData | null>(queryKey)?.progress[videoId];
      const row = {
        user_id: session.user.id,
        video_id: videoId,
        last_position_seconds: Math.max(0, Math.floor(seconds)),
        completed: completed ?? existing?.completed ?? false,
      };
      const { data: saved, error } = await supabase.from('video_progress').upsert(row).select('*').single();
      if (!error && saved) {
        setLocalProgress(saved);
        void qc.invalidateQueries({ queryKey: ['progress'] });
      }
      return error;
    },
    [session, qc, queryKey, setLocalProgress],
  );

  const onProgress = useCallback(
    (seconds: number, duration: number) => {
      if (!current) return;
      const autoComplete = duration > 0 && seconds / duration >= 0.95 ? true : undefined;
      void saveProgress(current.id, seconds, autoComplete);
    },
    [current, saveProgress],
  );

  const toggleCompleted = async () => {
    if (!current) return;
    const p = data?.progress[current.id];
    const error = await saveProgress(current.id, p?.last_position_seconds ?? 0, !p?.completed);
    if (error) toast.error(errorMessage(error));
    else if (!p?.completed) {
      toast.success(t('formation.completed'));
      if (next) select(next.id);
    }
  };

  if (query.isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (query.isError) {
    return <EmptyState icon={<BookOpen />} title={t('common.error')} action={<Button onClick={() => void query.refetch()}>{t('common.retry')}</Button>} />;
  }
  if (!data) {
    return (
      <EmptyState
        icon={<BookOpen />}
        title={t('formation.notFound')}
        action={
          <Link to="/catalog">
            <Button variant="secondary">{t('nav.catalog')}</Button>
          </Link>
        }
      />
    );
  }

  const { formation, hasAccess, progress } = data;
  const completedCount = flat.filter((i) => progress[i.id]?.completed).length;
  const pct = flat.length ? Math.round((completedCount / flat.length) * 100) : 0;
  const totalSeconds = flat.reduce((s, i) => s + (i.duration_seconds ?? 0), 0);
  const isDone = current ? !!progress[current.id]?.completed : false;

  const renderLessonList = (scope: string) => (
    <div className="card overflow-hidden">
      <div className="border-b border-blush-100 p-5">
        <h2 className="text-lg font-semibold">{t('formation.content')}</h2>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted">
          <span>{t('formation.lessons', { count: flat.length })}</span>
          {totalSeconds > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {formatHours(totalSeconds)}
            </span>
          )}
        </div>
        {hasAccess && flat.length > 0 && (
          <div className="mt-3">
            <ProgressBar value={pct} />
            <div className="mt-1.5 text-xs text-muted">{t('client.completedPct', { pct })}</div>
          </div>
        )}
      </div>
      {flat.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted">{t('formation.noVideos')}</p>
      ) : (
        <div className="scrollbar-thin max-h-[70vh] overflow-y-auto">
          {groups.map((g, gi) => (
            <div key={g.id}>
              <div className="sticky top-0 z-[1] bg-blush-50/95 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-rosegold backdrop-blur">
                {gi + 1}. {g.title}
              </div>
              {g.items.map((item) => {
                const active = item.id === current?.id;
                const done = progress[item.id]?.completed;
                return (
                  <motion.button
                    key={item.id}
                    disabled={!item.playable}
                    onClick={() => select(item.id)}
                    whileTap={item.playable ? { scale: 0.98 } : undefined}
                    className={cn(
                      'relative flex w-full items-center gap-3 px-5 py-3 text-start transition-colors',
                      !active && 'hover:bg-blush-50/60',
                      !item.playable && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId={`lesson-active-${scope}`}
                        className="absolute inset-0 border-s-[3px] border-blush-500 bg-blush-50"
                        transition={spring}
                      />
                    )}
                    <span className="relative flex shrink-0">
                    {!item.playable ? (
                      <Lock className="h-4 w-4 shrink-0 text-muted" />
                    ) : done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : active ? (
                      <PlayCircle className="h-4 w-4 shrink-0 text-blush-500" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-blush-200" />
                    )}
                    </span>
                    <span className={cn('relative min-w-0 flex-1 text-sm', active ? 'font-semibold text-plum' : 'text-ink')}>
                      <span className="line-clamp-2">{item.title}</span>
                      {item.is_free_preview && !hasAccess && <span className="mt-0.5 block text-[11px] text-rosegold">{t('formation.freePreview')}</span>}
                    </span>
                    <span className="relative shrink-0 text-xs tabular-nums text-muted" dir="ltr">
                      {formatDuration(item.duration_seconds)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <Link to={hasAccess ? '/' : '/catalog'} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-plum">
        <ChevronLeft className="rtl-flip h-4 w-4" /> {t('common.back')}
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold sm:text-3xl">{formation.title}</h1>
        <LevelBadge level={formation.level} />
      </div>

      {!hasAccess && (
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-rosegold-light bg-champagne/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-rosegold">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <div className="font-semibold text-plum">{t('formation.lockedTitle')}</div>
              <div className="text-sm text-muted">{t('formation.lockedText')}</div>
            </div>
          </div>
          <a href={whatsappLink(t('catalog.waFormation', { name: formation.title, email: profile?.email ?? '' }))} target="_blank" rel="noreferrer">
            <Button icon={<MessageCircle className="h-4 w-4" />}>{t('catalog.requestAccess')}</Button>
          </a>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-5">
          {current ? (
            <AnimatePresence mode="wait" initial={true}>
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.97, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.985, filter: 'blur(6px)' }}
                transition={{ duration: 0.45, ease }}
              >
                <VideoPlayer
                  videoId={current.id}
                  watermark={profile?.email ?? ''}
                  startAt={progress[current.id]?.completed ? 0 : progress[current.id]?.last_position_seconds ?? 0}
                  onProgress={onProgress}
                  onEnded={() => void saveProgress(current.id, 0, true)}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-blush-gradient">
              <div className="text-center">
                <Lock className="mx-auto h-10 w-10 text-rosegold" />
                <p className="mt-3 text-sm text-muted">{flat.length ? t('formation.lockedText') : t('formation.noVideos')}</p>
              </div>
            </div>
          )}

          {current && (
            <div className="card overflow-hidden p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  className="min-w-0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.1, ease } }}
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                >
                  <h2 className="text-xl font-semibold">{current.title}</h2>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted">
                    <Clock className="h-4 w-4" /> <span dir="ltr">{formatDuration(current.duration_seconds)}</span>
                    {current.is_free_preview && <Badge tone="gold">{t('formation.freePreview')}</Badge>}
                  </div>
                </motion.div>
                </AnimatePresence>
                {hasAccess && (
                  <Button
                    variant={isDone ? 'subtle' : 'secondary'}
                    size="sm"
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    onClick={() => void toggleCompleted()}
                  >
                    {isDone ? t('formation.completed') : t('formation.markCompleted')}
                  </Button>
                )}
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-blush-100 pt-4">
                <Button variant="ghost" size="sm" disabled={!prev} onClick={() => prev && select(prev.id)} icon={<ArrowLeft className="rtl-flip h-4 w-4" />}>
                  {t('formation.previous')}
                </Button>
                <Button variant="ghost" size="sm" disabled={!next} onClick={() => next && select(next.id)}>
                  {t('formation.next')} <ArrowRight className="rtl-flip h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="flex border-b border-blush-100">
              {(['description', 'content'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={cn(
                    'relative px-5 py-3 text-sm font-medium transition-colors',
                    k === 'content' && 'lg:hidden',
                    tab === k ? 'text-plum' : 'text-muted hover:text-plum',
                  )}
                >
                  {t(`formation.${k}`)}
                  {tab === k && (
                    <motion.span layoutId="formation-tab-underline" className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-gradient" transition={spring} />
                  )}
                </button>
              ))}
            </div>
            <div className={cn('space-y-4 whitespace-pre-line p-5 text-sm leading-relaxed text-ink/90', tab !== 'description' && 'hidden lg:block')}>
              {current?.description && <p>{current.description}</p>}
              {formation.description ? <p>{formation.description}</p> : !current?.description && <p className="text-muted">{t('formation.noDescription')}</p>}
            </div>
            {tab === 'content' && <div className="lg:hidden [&>.card]:rounded-none [&>.card]:border-0 [&>.card]:shadow-none">{renderLessonList('mobile')}</div>}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">{renderLessonList('desktop')}</div>
        </aside>
      </div>
    </div>
  );
}
