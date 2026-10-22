import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type Theme = 'light' | 'dark';
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const MODE_STORAGE_KEY = 'scholario_theme_mode';
const LEGACY_STORAGE_KEY = 'scholario_theme';

const getSystemTheme = (): Theme => {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const savedMode = localStorage.getItem(MODE_STORAGE_KEY) as ThemeMode | null;
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
        return savedMode;
      }
      const legacyTheme = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyTheme === 'light' || legacyTheme === 'dark') {
        return legacyTheme;
      }
    } catch {
      // ignore storage errors
    }
    return 'system';
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    if (themeMode === 'system') {
      return getSystemTheme();
    }
    return themeMode;
  });

  // Keep active theme synced with themeMode & system preference
  useEffect(() => {
    if (themeMode === 'system') {
      setThemeState(getSystemTheme());
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setThemeState(e.matches ? 'dark' : 'light');
      };
      if (mql.addEventListener) {
        mql.addEventListener('change', handleChange);
        return () => mql.removeEventListener('change', handleChange);
      } else {
        // legacy safari support
        mql.addListener(handleChange);
        return () => mql.removeListener(handleChange);
      }
    } else {
      setThemeState(themeMode);
    }
  }, [themeMode]);

  // Apply to DOM and persist
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    try {
      localStorage.setItem(LEGACY_STORAGE_KEY, theme);
      localStorage.setItem(MODE_STORAGE_KEY, themeMode);
    } catch {
      // ignore storage errors
    }
  }, [theme, themeMode]);

  // Synchronize across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MODE_STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark' || e.newValue === 'system')) {
        setThemeModeState(e.newValue as ThemeMode);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeModeState(nextTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeModeState(newTheme);
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const isDark = theme === 'dark';

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      isDark,
      toggleTheme,
      setTheme,
      setThemeMode,
    }),
    [theme, themeMode, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
