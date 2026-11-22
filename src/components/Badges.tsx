import { useReducedMotion } from '@/lib/motion';
import { AlertCircle, CheckCircle2, Loader2, UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui';
import type { Level, VideoStatus } from '@/types/database';

export function StatusBadge({ status }: { status: VideoStatus }) {
  const { t } = useTranslation();
  const map = {
    uploading: { tone: 'blue', icon: <UploadCloud className="h-3 w-3" /> },
    processing: { tone: 'gold', icon: <Loader2 className="h-3 w-3 motion-safe:animate-spin" /> },
    ready: { tone: 'green', icon: <CheckCircle2 className="h-3 w-3" /> },
    failed: { tone: 'red', icon: <AlertCircle className="h-3 w-3" /> },
  } as const;
  return (
    <Badge tone={map[status].tone} icon={map[status].icon}>
      {t(`status.${status}`)}
    </Badge>
  );
}

export function LevelBadge({ level, className }: { level: Level; className?: string }) {
  const { t } = useTranslation();
  const tone = level === 'pro' ? 'plum' : level === 'intermediate' ? 'gold' : 'rose';
  return (
    <Badge tone={tone} className={className}>
      {t(`levels.${level}`)}
    </Badge>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation();
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div role="progressbar" aria-label={t('clients.progress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} className={`h-1.5 w-full overflow-hidden rounded-full bg-fill-secondary ${className ?? ''}`}>
      <motion.div
        className="h-full w-full origin-left rounded-full bg-accent rtl:origin-right"
        initial={reducedMotion ? false : { scaleX: 0 }}
        animate={{ scaleX: pct / 100 }}
        transition={{ duration: reducedMotion ? 0 : 0.2 }}
      />
    </div>
  );
}
