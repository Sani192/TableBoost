'use client';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  /** 'icon' = compact bordered button (desktop). 'nav' = nav-item style with label (mobile bottom bar). */
  variant?: 'icon' | 'nav';
  className?: string;
}

export default function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Read initial state from document (set by inline script in layout.tsx)
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('tableboost-theme', next ? 'dark' : 'light');
    } catch {
      // localStorage may be unavailable
    }
  };

  if (variant === 'nav') {
    return (
      <button
        onClick={toggle}
        className="flex flex-col items-center justify-center space-y-1 px-3 py-1 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 sm:flex-row sm:space-x-2 sm:space-y-0 sm:px-4"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun className="h-5 w-5 sm:h-4 sm:w-4" /> : <Moon className="h-5 w-5 sm:h-4 sm:w-4" />}
        <span className="text-[10px] font-medium sm:text-sm">
          {isDark ? 'Light' : 'Dark'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center justify-center rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 shadow-soft transition-all hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-stone-700 dark:hover:text-stone-300 active:scale-95 ${className || 'h-9 w-9'}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
