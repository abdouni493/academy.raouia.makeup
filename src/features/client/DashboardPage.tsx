import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PlayCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, CardGridSkeleton, EmptyState, Skeleton } from '@/components/ui';
import { CoverImage } from '@/components/CoverImage';
import { ProgressBar } from '@/components/Badges';
import { useAuth } from '@/features/auth/AuthProvider';
import { formatDuration } from '@/lib/utils';
import { FormationCard } from './FormationCard';
import { useCatalog, useMyProgress } from './queries';

export function DashboardPage() {
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
      <section className="relative overflow-hidden rounded-3xl bg-blush-gradient p-6 shadow-soft sm:p-10">
        <div className="absolute -end-10 -top-16 h-56 w-56 rounded-full bg-blush-200/70 blur-3xl" />
        <div className="absolute -bottom-20 end-1/3 h-48 w-48 rounded-full bg-champagne blur-3xl" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-rosegold">
            <Sparkles className="h-3.5 w-3.5" /> {t('nav.dashboard')}
          </div>
          <h1 className="text-3xl font-semibold sm:text-4xl">{t('client.hello', { name: firstName })}</h1>
          <p className="mt-2 text-muted">{t('client.welcome')}</p>
        </div>
      </section>

      {continueWatching.length > 0 && (
        <section>
          <h2 className="mb-5 text-2xl font-semibold">{t('client.continueWatching')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {continueWatching.map((p) => {
              const v = p.videos!;
              const pct = v.duration_seconds ? (p.last_position_seconds / v.duration_seconds) * 100 : 0;
              return (
                <Link
                  key={p.video_id}
                  to={`/formation/${v.formations!.slug}?v=${v.id}`}
                  className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-glow"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <CoverImage src={v.thumbnail_url || v.formations!.cover_url} alt={v.title} seed={v.id} />
                    <div className="absolute inset-0 flex items-center justify-center bg-plum/20 opacity-0 transition group-hover:opacity-100">
                      <PlayCircle className="h-12 w-12 text-white drop-shadow" />
                    </div>
                    <span className="absolute bottom-2 end-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] text-white" dir="ltr">
                      {formatDuration(p.last_position_seconds)} / {formatDuration(v.duration_seconds)}
                    </span>
                  </div>
                  <ProgressBar value={pct} className="rounded-none" />
                  <div className="p-4">
                    <div className="truncate text-xs text-rosegold">{v.formations!.title}</div>
                    <div className="mt-0.5 truncate font-medium text-plum">{v.title}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
      {progress.isLoading && <Skeleton className="h-40 w-full" />}

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold">{t('client.myFormations')}</h2>
          <Link to="/catalog" className="text-sm font-medium text-rosegold hover:text-blush-600">
            {t('nav.catalog')} →
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((f) => (
              <FormationCard
                key={f.id}
                entry={f}
                progress={f.video_count ? Math.min(100, Math.round(((completedByFormation[f.id] ?? 0) / f.video_count) * 100)) : 0}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
