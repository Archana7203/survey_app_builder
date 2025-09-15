import React from 'react';

export interface ThemePreset {
  id: string;
  name: string;
  primary: string; // hex
  secondary: string; // hex
  accent: string; // hex
  background: string; // hex
  surface: string; // hex
  text: string; // hex
  description: string;
}

// eslint-disable-next-line react-refresh/only-export-components
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
  {
    id: 'emerald',
    name: 'Emerald Green',
    primary: '#059669',
    secondary: '#d1fae5',
    accent: '#10b981',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    description: 'Fresh and vibrant green theme',
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    primary: '#7c3aed',
    secondary: '#ede9fe',
    accent: '#8b5cf6',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    description: 'Elegant and modern purple theme',
  },
  {
    id: 'rose',
    name: 'Rose Pink',
    primary: '#e11d48',
    secondary: '#ffe4e6',
    accent: '#f43f5e',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    description: 'Warm and inviting pink theme',
  },
  {
    id: 'amber',
    name: 'Sunset Amber',
    primary: '#d97706',
    secondary: '#fef3c7',
    accent: '#f59e0b',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    description: 'Warm and energetic orange theme',
  },
  {
    id: 'indigo',
    name: 'Deep Indigo',
    primary: '#4f46e5',
    secondary: '#e0e7ff',
    accent: '#6366f1',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    description: 'Deep and sophisticated indigo theme',
  },
  {
    id: 'teal',
    name: 'Ocean Teal',
    primary: '#0d9488',
    secondary: '#ccfbf1',
    accent: '#14b8a6',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    description: 'Calming and balanced teal theme',
  },
  {
    id: 'slate',
    name: 'Modern Slate',
    primary: '#475569',
    secondary: '#e2e8f0',
    accent: '#64748b',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    description: 'Minimalist and neutral slate theme',
  },
];

interface ThemePickerProps {
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
  className?: string;
  disabled?: boolean;
}

const ThemePicker: React.FC<ThemePickerProps> = ({
  selectedTheme,
  onThemeChange,
  className = '',
  disabled = false,
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        Choose Theme
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Select a color theme for your survey
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {THEME_PRESETS.map((theme) => (
          <div
            key={theme.id}
            className={`
              relative p-4 border-2 rounded-lg transition-all
              ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
              ${selectedTheme === theme.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }
            `}
            onClick={() => !disabled && onThemeChange(theme.id)}
          >
            {/* Theme Preview */}
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primary }} />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.secondary }} />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.accent }} />
            </div>
            
            {/* Theme Info */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                {theme.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {theme.description}
              </p>
            </div>
            
            {/* Selected Indicator */}
            {selectedTheme === theme.id && (
              <div className="absolute top-2 right-2">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Preview Section */}
      <div className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Theme Preview
        </h4>
        <div className="space-y-2">
          {(() => {
            const currentTheme = THEME_PRESETS.find(t => t.id === selectedTheme) || THEME_PRESETS[0];
            return (
              <div className="flex items-center space-x-4">
                <button className="px-4 py-2 rounded-md text-sm text-white" style={{ backgroundColor: currentTheme.primary }}>
                  Primary Button
                </button>
                <button className="px-4 py-2 rounded-md text-sm border" style={{ backgroundColor: currentTheme.secondary, color: currentTheme.primary, borderColor: currentTheme.primary }}>
                  Secondary Button
                </button>
                <div className="px-3 py-1 rounded-full text-xs text-white" style={{ backgroundColor: currentTheme.accent }}>
                  Accent
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default ThemePicker;
