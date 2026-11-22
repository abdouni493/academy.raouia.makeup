import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PlayCircle, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { StaggerGroup, StaggerItem } from '@/components/Motion';
import { ease } from '@/lib/motion';
import { Button, CardGridSkeleton, EmptyState, Skeleton } from '@/components/ui';
import { CoverImage } from '@/components/CoverImage';
import { ProgressBar } from '@/components/Badges';
import { useAuth } from '@/features/auth/AuthProvider';
import { formatDuration } from '@/lib/utils';
import { FormationCard } from './FormationCard';
import { useCatalog, useMyProgress } from './queries';

export function DashboardPage() {
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const catalog = useCatalog();
  const progress = useMyProgress();

  const mine = useMemo(() => (catalog.data ?? []).filter((c) => c.has_access), [catalog.data]);

  const completedByFormation = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of progress.data ?? []) if (p.completed && p.videos) map[p.videos.formation_id] = (map[p.videos.formation_id] ?? 0) + 1;
    return map;
  }, [progress.data]);

  const continueWatching = useMemo(
    () => (progress.data ?? []).filter((p) => !p.completed && p.videos?.formations && p.last_position_seconds > 5).slice(0, 4),
    [progress.data],
  );

  const firstName = (profile?.full_name || '').split(' ')[0] || '';

  return (
    <div className="space-y-12">
      <motion.section
        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.2, ease }}
        className="relative overflow-hidden rounded-3xl border border-separator/60 bg-blush-gradient p-6 sm:p-10"
      >
        <div className="relative max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 text-footnote font-semibold text-rosegold">
            <Sparkles className="h-3.5 w-3.5" /> {t('nav.dashboard')}
          </div>
          <h1 className="text-large-title">{t('client.hello', { name: firstName })}</h1>
          <p className="mt-2 text-label-secondary">{t('client.welcome')}</p>
        </div>
      </motion.section>

      {continueWatching.length > 0 && (
        <section>
          <h2 className="mb-6 text-title-2">{t('client.continueWatching')}</h2>
          <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {continueWatching.map((p) => {
              const v = p.videos!;
              const pct = v.duration_seconds ? (p.last_position_seconds / v.duration_seconds) * 100 : 0;
              return (
                <StaggerItem key={p.video_id}>
                <Link
                  to={`/formation/${v.formations!.slug}?v=${v.id}`}
                  className="card group block overflow-hidden transition-shadow hover:shadow-elevated"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <CoverImage src={v.thumbnail_url || v.formations!.cover_url} alt={v.title} seed={v.id} />
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-inverse/35 opacity-0 transition group-hover:opacity-100">
                      <PlayCircle className="h-12 w-12 text-white drop-shadow" />
                    </div>
                    <span className="absolute bottom-2 end-2 rounded-md bg-surface-inverse/85 px-2 py-1 text-caption text-white" dir="ltr">
                      {formatDuration(p.last_position_seconds)} / {formatDuration(v.duration_seconds)}
                    </span>
                  </div>
                  <ProgressBar value={pct} className="rounded-none" />
                  <div className="p-4">
                    <div className="truncate text-footnote text-label-secondary">{v.formations!.title}</div>
                    <div className="mt-0.5 truncate font-medium text-label">{v.title}</div>
                  </div>
                </Link>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </section>
      )}
      {progress.isLoading && <Skeleton className="h-40 w-full" />}

      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-title-2">{t('client.myFormations')}</h2>
          <Link to="/catalog" className="inline-flex min-h-11 items-center text-subhead font-semibold text-accent hover:text-accent-pressed">
            {t('nav.catalog')} <span className="ms-2 inline-block rtl-flip" aria-hidden>→</span>
          </Link>
        </div>
        {catalog.isLoading ? (
          <CardGridSkeleton count={3} />
        ) : catalog.isError ? (
          <EmptyState icon={<BookOpen />} title={t('common.error')} action={<Button onClick={() => void catalog.refetch()}>{t('common.retry')}</Button>} />
        ) : mine.length === 0 ? (
          <EmptyState
            icon={<BookOpen />}
            title={t('client.noFormations')}
            text={t('client.noFormationsText')}
            action={
              <Link to="/catalog">
                <Button>{t('client.exploreCatalog')}</Button>
              </Link>
            }
          />
        ) : (
          <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((f) => (
              <StaggerItem key={f.id}>
                <FormationCard
                  entry={f}
                  progress={f.video_count ? Math.min(100, Math.round(((completedByFormation[f.id] ?? 0) / f.video_count) * 100)) : 0}
                />
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </section>
    </div>
  );
}
