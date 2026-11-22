import { Link } from 'react-router-dom';
import { Clock, Lock, MessageCircle, PlayCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CoverImage } from '@/components/CoverImage';
import { LevelBadge, ProgressBar } from '@/components/Badges';
import { Button } from '@/components/ui';
import { formatHours, whatsappLink } from '@/lib/utils';
import type { CatalogEntry } from '@/types/database';

export function FormationCard({ entry, progress, requestMessage }: { entry: CatalogEntry; progress?: number; requestMessage?: string }) {
  const { t } = useTranslation();
  const locked = !entry.has_access;

  const body = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden">
        <CoverImage src={entry.cover_url} alt={entry.title} seed={entry.id} />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-inverse/80 via-transparent to-transparent" />
        <LevelBadge level={entry.level} className="absolute start-4 top-4 shadow-sm" />
        <span className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary/95 text-accent shadow-soft">
          {locked ? <Lock className="h-4 w-4" /> : <PlayCircle className="h-5 w-5" />}
        </span>
        <div className="absolute bottom-4 start-4 flex items-center gap-3 text-xs font-medium text-white">
          <span>{t('client.videosCount', { count: entry.video_count })}</span>
          {entry.total_seconds > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {formatHours(entry.total_seconds)}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-headline leading-snug group-hover:text-accent">{entry.title}</h3>
        {entry.short_description && <p className="mt-2 line-clamp-2 text-sm text-label-secondary">{entry.short_description}</p>}
        <div className="mt-auto pt-4">
          {progress !== undefined && !locked && (
            <>
              <ProgressBar value={progress} />
              <div className="mt-2 text-xs text-label-secondary">{t('client.completedPct', { pct: progress })}</div>
            </>
          )}
          {locked && requestMessage && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              icon={<MessageCircle className="h-4 w-4" />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(whatsappLink(requestMessage), '_blank', 'noopener');
              }}
            >
              {t('catalog.requestAccess')}
            </Button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <Link
      to={`/formation/${entry.slug}`}
      className="card group flex h-full flex-col overflow-hidden focus-ring transition-shadow duration-150 hover:shadow-elevated"
    >
      {body}
    </Link>
  );
}
