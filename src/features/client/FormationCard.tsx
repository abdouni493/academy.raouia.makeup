import { Link } from 'react-router-dom';
import { Clock, Lock, MessageCircle, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CoverImage } from '@/components/CoverImage';
import { LevelBadge, ProgressBar } from '@/components/Badges';
import { buttonClassName } from '@/components/ui';
import { spring, useReducedMotion } from '@/lib/motion';
import { formatHours, whatsappLink } from '@/lib/utils';
import type { CatalogEntry } from '@/types/database';

export function FormationCard({ entry, progress, requestMessage }: { entry: CatalogEntry; progress?: number; requestMessage?: string }) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const locked = !entry.has_access;

  return (
    <article className="card group relative flex h-full flex-col overflow-hidden">
      <motion.div
        layoutId={reducedMotion ? undefined : `formation-media-${entry.slug}`}
        transition={spring}
        className="relative aspect-[16/10] overflow-hidden bg-fill-secondary"
      >
        <CoverImage src={entry.cover_url} alt="" seed={entry.id} />
        <span className="glass absolute bottom-3 end-3 grid h-10 w-10 place-items-center rounded-full text-accent shadow-glass">
          {locked ? <Lock className="h-4 w-4" /> : <PlayCircle className="h-5 w-5" />}
        </span>
      </motion.div>
      <div className="flex flex-1 flex-col items-start p-4 sm:p-6">
        <LevelBadge level={entry.level} />
        <h3 className="mt-3 text-title-3 leading-snug">
          <Link
            to={`/formation/${entry.slug}`}
            className="after:absolute after:inset-0 after:rounded-2xl hover:text-accent focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-accent"
          >
            {entry.title}
          </Link>
        </h3>
        {entry.short_description && <p className="mt-2 line-clamp-2 text-subhead text-label-secondary">{entry.short_description}</p>}
        <div className="mt-auto w-full pt-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-footnote text-label-secondary">
            <span>{t('client.videosCount', { count: entry.video_count })}</span>
            {entry.total_seconds > 0 && (
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatHours(entry.total_seconds)}</span>
            )}
          </div>
          {progress !== undefined && !locked && (
            <div className="mt-4 border-t border-separator pt-4">
              <ProgressBar value={progress} />
              <div className="mt-2 text-footnote text-label-secondary">{t('client.completedPct', { pct: progress })}</div>
            </div>
          )}
          {locked && requestMessage && (
            <a href={whatsappLink(requestMessage)} target="_blank" rel="noopener noreferrer" className={`relative mt-4 w-full ${buttonClassName('secondary', 'sm')}`}>
              <MessageCircle className="h-4 w-4" /> {t('catalog.requestAccess')}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
