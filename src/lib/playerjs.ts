// Minimal typing + loader for Bunny's player.js bridge.
export interface PlayerJsPlayer {
  on(event: 'ready' | 'play' | 'pause' | 'ended', cb: () => void): void;
  on(event: 'timeupdate', cb: (data: { seconds: number; duration: number }) => void): void;
  off(event: string): void;
  getCurrentTime(cb: (seconds: number) => void): void;
  getDuration(cb: (seconds: number) => void): void;
  setCurrentTime(seconds: number): void;
  play(): void;
  pause(): void;
}

declare global {
  interface Window {
    playerjs?: { Player: new (el: HTMLIFrameElement) => PlayerJsPlayer };
  }
}

const SRC = 'https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js';
let loading: Promise<void> | null = null;

export function loadPlayerJs(): Promise<void> {
  if (window.playerjs) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error('player.js failed to load'));
    };
    document.head.appendChild(s);
  });
  return loading;
}
