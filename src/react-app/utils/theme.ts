export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

function systemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function getStoredTheme(): ThemeMode | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return v === 'light' || v === 'dark' || v === 'system' ? v : null;
  } catch {
    return null;
  }
}

/**
 * Sync the browser UI color (mobile address bar) with current theme.
 * Uses brand-aligned colors approximating tokens:
 * - Light: #9d174d (≈ --accent light)
 * - Dark:  #d7427d (≈ --accent dark)
 */
function updateThemeMeta(useDark: boolean) {
  if (typeof document === 'undefined') return;
  const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (meta) {
    meta.setAttribute('content', useDark ? '#d7427d' : '#9d174d');
  }
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const useDark = mode === 'dark' || (mode === 'system' && systemPrefersDark());
  root.classList.toggle('dark', useDark);
  root.style.colorScheme = useDark ? 'dark' : 'light';
  // Keep meta theme-color in sync to avoid jarring UI in mobile browsers
  updateThemeMeta(useDark);
}

export function setTheme(mode: ThemeMode) {
  try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* empty */ }
  applyTheme(mode);
}

export function initTheme() {
  const stored = getStoredTheme() || 'system';
  applyTheme(stored);
  // React to system changes when in system mode
  if (stored === 'system' && window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener?.('change', handler);
  }
}

// Handy React hook
import { useEffect, useState } from 'react';
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => getStoredTheme() || 'system');
  useEffect(() => { applyTheme(mode); }, [mode]);
  return {
    mode,
    setMode: (m: ThemeMode) => { setMode(m); setTheme(m); },
    isDark: document.documentElement.classList.contains('dark'),
  };
}
