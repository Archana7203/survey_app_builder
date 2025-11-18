import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

// Inline ThemePreset and presets — ThemePicker removed, single Ocean Blue theme retained
export interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  description: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'Ocean Blue',
    primary: '#2563eb',
    secondary: '#dbeafe',
    accent: '#3b82f6',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    description: 'Clean and professional blue theme',
  },
];

interface SurveyThemeContextType {
  currentTheme: ThemePreset;
  setSurveyTheme: (themeId: string) => void;
  applyThemeToSurvey: (survey: any) => void;
}

const SurveyThemeContext = createContext<SurveyThemeContextType | undefined>(undefined);

export const useSurveyTheme = () => {
  const context = useContext(SurveyThemeContext);
  if (context === undefined) {
    throw new Error('useSurveyTheme must be used within a SurveyThemeProvider');
  }
  return context;
};

interface SurveyThemeProviderProps {
  children: React.ReactNode;
  surveyTheme?: string;
}

export const SurveyThemeProvider: React.FC<SurveyThemeProviderProps> = ({ 
  children, 
  surveyTheme = 'default' 
}) => {
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(() => {
    return THEME_PRESETS.find(t => t.id === surveyTheme) || THEME_PRESETS[0];
  });

  const applyThemeToCSS = useCallback((theme: ThemePreset) => {
    const root = document.documentElement;
    root.style.setProperty('--survey-primary', theme.primary);
    root.style.setProperty('--survey-secondary', theme.secondary);
    root.style.setProperty('--survey-accent', theme.accent);
    root.style.setProperty('--survey-background', theme.background);
    root.style.setProperty('--survey-surface', theme.surface);
    root.style.setProperty('--survey-text', theme.text);
  }, []);

  const setSurveyTheme = useCallback((themeId: string) => {
    const theme = THEME_PRESETS.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      applyThemeToCSS(theme);
    }
  }, [applyThemeToCSS]);

  const applyThemeToSurvey = useCallback((survey: any) => {
    if (survey.theme) {
      const theme = THEME_PRESETS.find(t => t.id === survey.theme);
      if (theme) {
        setCurrentTheme(theme);
        applyThemeToCSS(theme);
      }
    }
  }, [applyThemeToCSS]);

  useEffect(() => {
    // Apply initial theme
    applyThemeToCSS(currentTheme);
  }, []);

  useEffect(() => {
    // Update theme when surveyTheme prop changes
    if (surveyTheme) {
      setSurveyTheme(surveyTheme);
    }
  }, [surveyTheme, setSurveyTheme]);

  // ✅ Memoize the context value so it’s stable
  const contextValue = useMemo(
    () => ({ currentTheme, setSurveyTheme, applyThemeToSurvey }),
    [currentTheme, setSurveyTheme, applyThemeToSurvey]
  );

  return (
    <SurveyThemeContext.Provider value={contextValue}>
      {children}
    </SurveyThemeContext.Provider>
  );
};
