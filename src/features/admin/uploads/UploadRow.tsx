import { CheckCircle2, Loader2, Video, X, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProgressBar } from '@/components/Badges';
import { formatBytes } from '@/lib/utils';
import { useUploads, type UploadItem } from './UploadProvider';

export function UploadRow({ item }: { item: UploadItem }) {
  const { t } = useTranslation();
  const { cancel, dismiss } = useUploads();
  const pct = item.bytesTotal ? Math.round((item.bytesUploaded / item.bytesTotal) * 100) : 0;
  const running = item.state === 'queued' || item.state === 'preparing' || item.state === 'uploading';

  return (
    <div className="flex items-center gap-3 rounded-xl bg-fill-tertiary p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-tertiary text-accent">
        {item.state === 'done' ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : item.state === 'error' || item.state === 'cancelled' ? (
          <XCircle className="h-5 w-5 text-danger" />
        ) : item.state === 'uploading' ? (
          <Video className="h-5 w-5" />
        ) : (
          <Loader2 className="h-5 w-5 motion-safe:animate-spin" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-label">{item.title}</span>
          <span className="shrink-0 text-xs tabular-nums text-label-secondary">
            {item.state === 'uploading' && `${pct}%`}
            {item.state === 'queued' && t('videos.queued')}
            {item.state === 'preparing' && t('videos.preparing')}
            {item.state === 'done' && t('videos.uploadDone')}
            {item.state === 'cancelled' && t('videos.uploadCancelled')}
            {item.state === 'error' && t('videos.uploadFailed')}
          </span>
        </div>
        {running && <ProgressBar value={pct} className="mt-2" />}
        <div className="mt-1 flex justify-between gap-2 text-caption text-label-secondary" dir="ltr">
          <span>
            {formatBytes(item.bytesUploaded)} / {formatBytes(item.bytesTotal)}
          </span>
          {item.state === 'uploading' && item.speed > 0 && <span>{t('videos.speed', { speed: formatBytes(item.speed) })}</span>}
          {item.state === 'error' && <span className="truncate text-danger">{item.error}</span>}
        </div>
      </div>
      <button
        onClick={() => (running ? cancel(item.id) : dismiss(item.id))}
        title={running ? t('videos.cancelUpload') : t('common.close')}
        aria-label={running ? t('videos.cancelUpload') : t('common.close')}
        className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-label-secondary transition-colors hover:bg-danger-soft hover:text-danger"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
