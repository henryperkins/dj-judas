import { Moon, Sun, Laptop } from 'lucide-react';
import { useTheme, ThemeMode } from '../utils/theme';

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const nextMode: Record<ThemeMode, ThemeMode> = { light: 'dark', dark: 'system', system: 'light' };
  const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Laptop;
  const label = mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System';

  return (
    <button
      className="theme-toggle"
      aria-label={`Theme: ${label}. Click to switch`}
      title={`Theme: ${label}`}
      onClick={() => setMode(nextMode[mode])}
    >
      <Icon size={16} />
      <span className="sr-only">Switch theme</span>
    </button>
  );
}
