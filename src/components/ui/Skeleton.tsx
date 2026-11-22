import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-fill-secondary motion-reduce:animate-none', className)} />;
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  const { t } = useTranslation();
  return (
    <div role="status" aria-label={t('common.loading')} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <Skeleton className="aspect-[16/10] rounded-none" />
          <div className="space-y-4 p-6">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  const { t } = useTranslation();
  return (
    <div role="status" aria-label={t('common.loading')} className="space-y-4 p-6">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function PageLoader() {
  const { t } = useTranslation();
  return (
    <div role="status" className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-footnote text-label-secondary">
      <div aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-fill border-t-accent motion-reduce:animate-none" />
      <span>{t('common.loading')}</span>
    </div>
  );
}
