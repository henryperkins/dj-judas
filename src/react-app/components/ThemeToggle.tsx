import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import * as Switch from '@radix-ui/react-switch';

const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDark(shouldBeDark);
    document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = (checked: boolean) => {
    setIsDark(checked);
    const theme = checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  };

  return (
    <div className="theme-toggle">
      <Sun size={18} className={!isDark ? 'active' : ''} />
      <Switch.Root
        className="theme-switch"
        checked={isDark}
        onCheckedChange={toggleTheme}
        aria-label="Toggle dark mode"
      >
        <Switch.Thumb className="theme-switch-thumb" />
      </Switch.Root>
      <Moon size={18} className={isDark ? 'active' : ''} />
    </div>
  );
};

export default ThemeToggle;
