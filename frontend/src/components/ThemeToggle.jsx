import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 transition-all duration-200 shadow-2xs group focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {/* Sun icon for Dark Mode */}
        <Sun
          className={`w-4 h-4 text-amber-400 absolute transition-all duration-300 transform ${
            isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
          }`}
        />
        {/* Moon icon for Light Mode */}
        <Moon
          className={`w-4 h-4 text-slate-700 dark:text-slate-200 absolute transition-all duration-300 transform ${
            isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
