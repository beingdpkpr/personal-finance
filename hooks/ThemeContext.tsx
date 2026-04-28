import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, Colors } from '../constants/theme';

interface ThemeCtx {
  colors: Colors;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  colors: lightColors,
  darkMode: false,
  toggleDarkMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('pf_dark_mode').then(v => {
      if (v === 'true') setDarkMode(true);
    });
  }, []);

  function toggleDarkMode() {
    setDarkMode(prev => {
      const next = !prev;
      AsyncStorage.setItem('pf_dark_mode', String(next));
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ colors: darkMode ? darkColors : lightColors, darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useColors(): Colors {
  return useContext(ThemeContext).colors;
}

export function useTheme() {
  return useContext(ThemeContext);
}
