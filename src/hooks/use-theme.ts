'use client';

import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark-plus';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');

  // Persist theme (localStorage)
  useEffect(() => {
    const stored = localStorage.getItem('navaflow-theme') as Theme | null;
    if (stored && (stored === 'light' || stored === 'dark-plus')) {
      setTheme(stored);
      document.documentElement.classList.toggle('theme-dark-plus', stored === 'dark-plus');
      document.documentElement.classList.toggle('theme-light', stored === 'light');
    } else {
      document.documentElement.classList.add('theme-light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark-plus' : 'light';
    setTheme(newTheme);
    localStorage.setItem('navaflow-theme', newTheme);
    document.documentElement.classList.toggle('theme-dark-plus', newTheme === 'dark-plus');
    document.documentElement.classList.toggle('theme-light', newTheme === 'light');
  };

  return { theme, toggleTheme };
}
