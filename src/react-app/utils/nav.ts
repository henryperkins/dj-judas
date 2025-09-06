// Tiny client-side navigation helper using History API.
// Keeps the app SPA-like without pulling in a router.

export function navigate(path: string) {
  if (window.location.pathname === path) return;
  window.history.pushState({}, '', path);
  const ev = new Event('app:navigate');
  window.dispatchEvent(ev);
}

export function onNavigate(handler: () => void) {
  window.addEventListener('app:navigate', handler);
  window.addEventListener('popstate', handler);
  return () => {
    window.removeEventListener('app:navigate', handler);
    window.removeEventListener('popstate', handler);
  };
}

