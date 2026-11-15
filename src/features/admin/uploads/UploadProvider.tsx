import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as tus from 'tus-js-client';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/lib/functions';
import { supabase } from '@/lib/supabase';
import { errorMessage } from '@/lib/utils';

export type UploadState = 'queued' | 'preparing' | 'uploading' | 'done' | 'error' | 'cancelled';

export interface UploadItem {
  id: string;
  file: File;
  title: string;
  formationId: string;
  sectionId: string | null;
  state: UploadState;
  bytesUploaded: number;
  bytesTotal: number;
  speed: number; // bytes / second
  error?: string;
  videoRowId?: string;
}

interface UploadCtx {
  items: UploadItem[];
  active: number;
  enqueue: (files: File[], formationId: string, sectionId: string | null) => void;
  cancel: (id: string) => void;
  dismiss: (id: string) => void;
  clearFinished: () => void;
}

const Ctx = createContext<UploadCtx | null>(null);
const CONCURRENCY = 2;
const CHUNK_SIZE = 50 * 1024 * 1024;

function titleFromFile(name: string) {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || name;
}

export function UploadProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [items, setItems] = useState<UploadItem[]>([]);
  const itemsRef = useRef<UploadItem[]>([]);
  itemsRef.current = items;
  const uploads = useRef(new Map<string, { upload: tus.Upload; reject: (e: Error) => void }>());
  const cancelled = useRef(new Set<string>());
  const started = useRef(new Set<string>());

  const patch = useCallback((id: string, p: Partial<UploadItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)));
  }, []);

  const invalidate = useCallback(
    (formationId: string) => {
      void qc.invalidateQueries({ queryKey: ['admin', 'videos', formationId] });
      void qc.invalidateQueries({ queryKey: ['admin', 'formations'] });
    },
    [qc],
  );

  const run = useCallback(
    async (item: UploadItem) => {
      patch(item.id, { state: 'preparing' });
      let videoRowId: string | undefined;
      try {
        const { video_row, tus: info } = await api.createUpload({
          formation_id: item.formationId,
          section_id: item.sectionId,
          title: item.title,
        });
        videoRowId = video_row.id;
        patch(item.id, { videoRowId, state: 'uploading' });
        invalidate(item.formationId);

        if (cancelled.current.has(item.id)) throw new Error('cancelled');

        await new Promise<void>((resolve, reject) => {
          let lastBytes = 0;
          let lastTime = performance.now();
          let speed = 0;
          const upload = new tus.Upload(item.file, {
            endpoint: info.endpoint,
            chunkSize: CHUNK_SIZE,
            retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
            storeFingerprintForResuming: false,
            headers: {
              AuthorizationSignature: info.signature,
              AuthorizationExpire: String(info.expire),
              VideoId: info.videoId,
              LibraryId: String(info.libraryId),
            },
            metadata: { filetype: item.file.type || 'video/mp4', title: item.title },
            onProgress: (bytesUploaded, bytesTotal) => {
              const now = performance.now();
              const dt = (now - lastTime) / 1000;
              if (dt >= 0.5) {
                const instant = (bytesUploaded - lastBytes) / dt;
                speed = speed ? speed * 0.7 + instant * 0.3 : instant;
                lastBytes = bytesUploaded;
                lastTime = now;
              }
              patch(item.id, { bytesUploaded, bytesTotal, speed });
            },
            onSuccess: () => resolve(),
            onError: (err) => reject(err),
          });
          uploads.current.set(item.id, { upload, reject });
          upload.start();
        });

        uploads.current.delete(item.id);
        // Bunny's webhook will move it to processing/ready; do it now in case the webhook is late.
        await supabase.from('videos').update({ status: 'processing' }).eq('id', videoRowId).eq('status', 'uploading');
        patch(item.id, { state: 'done', bytesUploaded: item.file.size, speed: 0 });
        toast.success(`${t('videos.uploadDone')} — ${item.title}`);
      } catch (err) {
        uploads.current.delete(item.id);
        const wasCancelled = cancelled.current.has(item.id);
        // Clean up the Bunny object + DB row so nothing is left half-uploaded.
        if (videoRowId) await api.deleteVideo(videoRowId).catch(() => {});
        if (wasCancelled) {
          patch(item.id, { state: 'cancelled', speed: 0 });
        } else {
          patch(item.id, { state: 'error', error: errorMessage(err), speed: 0 });
          toast.error(`${t('videos.uploadFailed')} — ${item.title}`);
        }
      } finally {
        invalidate(item.formationId);
      }
    },
    [patch, invalidate, t],
  );

  // Simple queue: keep CONCURRENCY uploads running.
  useEffect(() => {
    const running = items.filter((i) => i.state === 'preparing' || i.state === 'uploading').length;
    const slots = CONCURRENCY - running;
    if (slots <= 0) return;
    const next = items.filter((i) => i.state === 'queued' && !started.current.has(i.id)).slice(0, slots);
    for (const item of next) {
      started.current.add(item.id);
      void run(item);
    }
  }, [items, run]);

  const active = items.filter((i) => ['queued', 'preparing', 'uploading'].includes(i.state)).length;

  // Warn before closing / reloading the tab while uploads are running.
  useEffect(() => {
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = t('videos.leaveWarning');
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [active, t]);

  const enqueue = useCallback(
    (files: File[], formationId: string, sectionId: string | null) => {
      const accepted: UploadItem[] = [];
      for (const file of files) {
        const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|mkv|avi|webm|m4v|wmv|flv|mpe?g)$/i.test(file.name);
        if (!isVideo) {
          toast.error(t('videos.notVideo', { name: file.name }));
          continue;
        }
        accepted.push({
          id: crypto.randomUUID(),
          file,
          title: titleFromFile(file.name),
          formationId,
          sectionId,
          state: 'queued',
          bytesUploaded: 0,
          bytesTotal: file.size,
          speed: 0,
        });
      }
      if (accepted.length) setItems((prev) => [...prev, ...accepted]);
    },
    [t],
  );

  const cancel = useCallback(
    (id: string) => {
      cancelled.current.add(id);
      const running = uploads.current.get(id);
      if (running) {
        // Stop the transfer; run() then deletes the Bunny object + DB row and marks it cancelled.
        void running.upload.abort(true).catch(() => {});
        running.reject(new Error('cancelled'));
        return;
      }
      // Queued items just stop; "preparing" items are cleaned up by run() once createUpload returns.
      const item = itemsRef.current.find((i) => i.id === id);
      if (item && (item.state === 'queued' || item.state === 'preparing')) patch(id, { state: 'cancelled' });
    },
    [patch],
  );

  const dismiss = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clearFinished = useCallback(
    () => setItems((prev) => prev.filter((i) => ['queued', 'preparing', 'uploading'].includes(i.state))),
    [],
  );

  const value = useMemo(() => ({ items, active, enqueue, cancel, dismiss, clearFinished }), [items, active, enqueue, cancel, dismiss, clearFinished]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUploads(): UploadCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useUploads must be used inside UploadProvider');
  return ctx;
}
