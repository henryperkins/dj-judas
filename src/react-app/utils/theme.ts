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

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const useDark = mode === 'dark' || (mode === 'system' && systemPrefersDark());
  root.classList.toggle('dark', useDark);
  root.style.colorScheme = useDark ? 'dark' : 'light';
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

