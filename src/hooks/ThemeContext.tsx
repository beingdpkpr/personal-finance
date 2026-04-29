import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeName = 'violet' | 'slate' | 'rose';

interface ThemeCtx {
  darkMode:       boolean;
  themeName:      ThemeName;
  toggleDarkMode: () => void;
  setTheme:       (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  darkMode: true,
  themeName: 'violet',
  toggleDarkMode: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode]   = useState(true);
  const [themeName, setThemeName] = useState<ThemeName>('violet');

  useEffect(() => {
    const dm = localStorage.getItem('pf_dark_mode');
    const tn = localStorage.getItem('pf_theme_name') as ThemeName | null;
    if (dm !== null) setDarkMode(dm !== 'false');
    if (tn) setThemeName(tn);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeName);
    document.documentElement.setAttribute('data-light', String(!darkMode));
    document.documentElement.style.background = 'var(--bg)';
  }, [darkMode, themeName]);

  function toggleDarkMode() {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('pf_dark_mode', String(next));
      return next;
    });
  }

  function setTheme(t: ThemeName) {
    setThemeName(t);
    localStorage.setItem('pf_theme_name', t);
  }

  return (
    <ThemeContext.Provider value={{ darkMode, themeName, toggleDarkMode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }
