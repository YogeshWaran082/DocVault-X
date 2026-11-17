import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ThemeContextValue = {
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('theme');
    if (requested === 'light' || requested === 'dark') return requested === 'dark';
    const saved = localStorage.getItem('docvault_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    document.body.className = isDark
      ? 'bg-[#09090b] text-[#f5f5f7] font-sans antialiased min-h-screen overflow-x-hidden'
      : 'bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased min-h-screen overflow-x-hidden';
    localStorage.setItem('docvault_theme', isDark ? 'dark' : 'light');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#09090b' : '#f5f5f7');
  }, [isDark]);

  const value = useMemo(() => ({ isDark, toggleTheme: () => setIsDark(current => !current) }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
