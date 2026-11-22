import { useSyncExternalStore } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

// Keep this key and the initial appearance resolution in sync with index.html.
const storageKey = 'raouia.theme';
const systemAppearance = window.matchMedia('(prefers-color-scheme: dark)');
const subscribers = new Set<() => void>();

function readPreference(): ThemeMode {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Browsers with storage disabled can still switch appearance for this session.
  }
  return 'system';
}

let mode = readPreference();

function applyAppearance() {
  const dark = mode === 'dark' || (mode === 'system' && systemAppearance.matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1A1218' : '#FFFBFC');
}

function updateMode(next: ThemeMode) {
  mode = next;
  applyAppearance();
  subscribers.forEach((notify) => notify());
}

export function setThemeMode(next: ThemeMode) {
  try {
    localStorage.setItem(storageKey, next);
  } catch {
    // Keep the in-memory choice when persistence isn't available.
  }
  updateMode(next);
}

function subscribe(notify: () => void) {
  subscribers.add(notify);
  return () => { subscribers.delete(notify); };
}

export function useThemeMode() {
  return useSyncExternalStore(subscribe, () => mode);
}

function syncStorage(event: StorageEvent) {
  if (event.key === storageKey || event.key === null) updateMode(readPreference());
}

applyAppearance();
systemAppearance.addEventListener('change', applyAppearance);
window.addEventListener('storage', syncStorage);
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    systemAppearance.removeEventListener('change', applyAppearance);
    window.removeEventListener('storage', syncStorage);
  });
}
