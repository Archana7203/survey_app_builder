import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      console.log('🔧 ThemeContext: Loading saved theme from localStorage:', savedTheme);
      return savedTheme;
    }

    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      console.log('🔧 ThemeContext: Using system dark theme preference');
      return 'dark';
    }

    console.log('🔧 ThemeContext: Using default light theme');
    return 'light';
  });

  const setTheme = useCallback((newTheme: Theme) => {
    console.log('🔧 ThemeContext: Setting theme to:', newTheme);
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    // Apply dark class to document root for Tailwind dark mode
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('🔧 ThemeContext: Added dark class to HTML element');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('🔧 ThemeContext: Removed dark class from HTML element');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    console.log('🔧 ThemeContext: Toggling theme from', theme, 'to', theme === 'light' ? 'dark' : 'light');
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  useEffect(() => {
    // Apply initial theme to document root
    console.log('🔧 ThemeContext: Applying initial theme:', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('🔧 ThemeContext: Initial dark class added');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('🔧 ThemeContext: Initial dark class removed');
    }
  }, [theme]);

  // ✅ Memoize context value so it’s stable
  const contextValue = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
