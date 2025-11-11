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
  const [theme, setTheme] = useState<Theme>(() => {
    // Only check localStorage - ignore system preferences
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }

    // Default to light theme if no preference is saved
    console.log('🔧 ThemeContext: Using default light theme');
    return 'light';
  });

  const updateTheme = useCallback((newTheme: Theme) => {
    console.log('🔧 ThemeContext: Setting theme to:', newTheme);
    setTheme(newTheme);
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
    updateTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, updateTheme]);

  useEffect(() => {
    // Apply initial theme to document root
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // ✅ Memoize context value so it's stable
  const contextValue = useMemo(
    () => ({ theme, toggleTheme, setTheme: updateTheme }),
    [theme, toggleTheme, updateTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};