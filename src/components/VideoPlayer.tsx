import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Maximize2, Minimize2, PlayCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/functions';
import { loadPlayerJs, type PlayerJsPlayer } from '@/lib/playerjs';
import { cn, errorMessage } from '@/lib/utils';
import { Button } from '@/components/ui';

interface Props {
  videoId: string;
  watermark: string;
  startAt?: number;
  /** Called periodically (every 15 s) and on pause/unmount with the current position. */
  onProgress?: (seconds: number, duration: number) => void;
  onEnded?: () => void;
}

const SAVE_EVERY_MS = 15_000;
/** Refresh the signed URL 10 minutes before it expires. */
const REFRESH_MARGIN_MS = 10 * 60_000;

export function VideoPlayer({ videoId, watermark, startAt = 0, onProgress, onEnded }: Props) {
  const { t } = useTranslation();
  const wrapper = useRef<HTMLDivElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const player = useRef<PlayerJsPlayer | null>(null);
  const position = useRef(startAt);
  const duration = useRef(0);
  const lastSaved = useRef(0);
  const cbs = useRef({ onProgress, onEnded });
  cbs.current = { onProgress, onEnded };

  const [embed, setEmbed] = useState<{ url: string; expiresAt: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [pseudoFs, setPseudoFs] = useState(false);

  const fetchUrl = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getPlayback(videoId);
      setEmbed({ url: res.embedUrl, expiresAt: new Date(res.expiresAt).getTime() });
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [videoId]);

  // Load signed URL for this video.
  useEffect(() => {
    position.current = startAt;
    duration.current = 0;
    setEmbed(null);
    void fetchUrl();
    // startAt intentionally read only when the video changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, fetchUrl]);

  // Auto-refresh the signed URL before expiry (resumes at the current position).
  useEffect(() => {
    if (!embed) return;
    const delay = Math.max(30_000, embed.expiresAt - Date.now() - REFRESH_MARGIN_MS);
    const timer = window.setTimeout(() => void fetchUrl(), delay);
    return () => window.clearTimeout(timer);
  }, [embed, fetchUrl]);

  const flush = useCallback(() => {
    if (position.current > 0) cbs.current.onProgress?.(Math.floor(position.current), Math.floor(duration.current));
    lastSaved.current = Date.now();
  }, []);

  // Wire player.js events every time the iframe (re)loads.
  const onIframeLoad = useCallback(async () => {
    try {
      await loadPlayerJs();
      if (!iframe.current || !window.playerjs) return;
      const p = new window.playerjs.Player(iframe.current);
      player.current = p;
      p.on('ready', () => {
        if (position.current > 3) p.setCurrentTime(position.current);
        p.getDuration((d) => (duration.current = d || duration.current));
      });
      p.on('timeupdate', ({ seconds, duration: d }) => {
        position.current = seconds;
        if (d) duration.current = d;
        if (Date.now() - lastSaved.current >= SAVE_EVERY_MS) flush();
      });
      p.on('pause', flush);
      p.on('ended', () => {
        flush();
        cbs.current.onEnded?.();
      });
    } catch {
      /* progress tracking is best effort */
    }
  }, [flush]);

  // Save on unmount / video change / tab hide.
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && flush();
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      flush();
      player.current = null;
    };
  }, [videoId, flush]);

  // Fullscreen on OUR wrapper so the watermark stays visible.
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === wrapper.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = async () => {
    const el = wrapper.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    if (pseudoFs) {
      setPseudoFs(false);
      return;
    }
    if (document.fullscreenEnabled && el.requestFullscreen) {
      try {
        await el.requestFullscreen();
        await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock?.('landscape').catch(() => {});
        return;
      } catch {
        /* fall back below */
      }
    }
    setPseudoFs(true); // iOS Safari: CSS fullscreen fallback
  };

  return (
    <div
      ref={wrapper}
      className={cn(
        'relative w-full overflow-hidden bg-plum-dark shadow-soft',
        pseudoFs ? 'fixed inset-0 z-[60] flex items-center' : fullscreen ? 'flex items-center' : 'aspect-video rounded-2xl',
      )}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className={cn('relative w-full', (fullscreen || pseudoFs) ? 'aspect-video max-h-full' : 'h-full')}>
        {embed ? (
          <iframe
            key={embed.url}
            ref={iframe}
            src={embed.url}
            onLoad={() => void onIframeLoad()}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            title="video"
          />
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white/90">
            <AlertCircle className="h-8 w-8 text-blush-300" />
            <p className="text-sm">{t('formation.playerError')}</p>
            <p className="text-xs text-white/60">{error}</p>
            <Button size="sm" variant="secondary" onClick={() => void fetchUrl()}>
              {t('common.retry')}
            </Button>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <PlayCircle className="h-14 w-14 animate-pulse text-blush-300/70" strokeWidth={1.25} />
          </div>
        )}

        {/* Moving watermark (deterrent against screen recording). */}
        {embed && (
          <div className="pointer-events-none absolute inset-0 select-none overflow-hidden" aria-hidden>
            <span className="absolute animate-watermark whitespace-nowrap text-[11px] font-medium tracking-wide text-white/25 [text-shadow:0_1px_2px_rgba(0,0,0,0.35)] sm:text-sm" dir="ltr">
              {watermark}
            </span>
          </div>
        )}
      </div>

      {embed && (
        <button
          onClick={() => void toggleFullscreen()}
          className="absolute end-2 top-2 z-10 rounded-lg bg-black/35 p-2 text-white/90 backdrop-blur transition hover:bg-black/55"
          aria-label="Fullscreen"
        >
          {fullscreen || pseudoFs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
