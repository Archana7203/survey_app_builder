# Theme Toggle Implementation

This document describes the light/dark theme toggle functionality implemented in the survey app.

## Overview

The theme toggle provides users with the ability to switch between light and dark themes across all pages of the application. The theme preference is persisted in localStorage and overrides the system theme preference.

## Features

- **Manual Theme Toggle**: Users can manually switch between light and dark themes
- **Persistent Storage**: Theme preference is saved in localStorage and persists across browser sessions
- **System Theme Detection**: Initially detects and applies the user's system theme preference
- **Global Application**: Theme toggle is available on all pages (Auth, Dashboard, Survey pages, etc.)
- **Tailwind Integration**: Uses Tailwind's `dark:` class system for consistent theming

## Implementation Details

### 1. ThemeContext (`src/contexts/ThemeContext.tsx`)

The main context that manages theme state:

- **State Management**: Manages current theme (`light` | `dark`)
- **localStorage Integration**: Automatically saves/loads theme preference
- **System Theme Detection**: Detects initial theme from `prefers-color-scheme` media query
- **HTML Class Management**: Applies/removes `dark` class on `document.documentElement`

### 2. ThemeToggle Component (`src/components/ui/ThemeToggle.tsx`)

The reusable toggle button component:

- **Visual Indicators**: Shows moon icon for light theme, sun icon for dark theme
- **Accessibility**: Includes proper ARIA labels and titles
- **Hover Effects**: Smooth transitions and hover states
- **Responsive Design**: Works on all screen sizes

### 3. Integration Points

The theme toggle is integrated into:

- **Auth Page**: Top-right corner for users before login
- **Dashboard Layout**: Header navigation bar
- **Survey Pages**: Public survey renderer and preview
- **Thank You Page**: After survey completion

## Usage

### For Users

1. **Toggle Theme**: Click the theme toggle button (moon/sun icon) in the top-right corner
2. **Automatic Persistence**: Your theme choice is automatically saved
3. **Global Application**: Theme applies to all pages and persists across sessions

### For Developers

#### Using the Theme Context

```tsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('light')}>Force Light</button>
      <button onClick={() => setTheme('dark')}>Force Dark</button>
    </div>
  );
}
```

#### Adding Theme Toggle to New Pages

```tsx
import ThemeToggle from '../components/ui/ThemeToggle';

function NewPage() {
  return (
    <div className="relative">
      {/* Theme toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      {/* Page content */}
      <div>Your page content here</div>
    </div>
  );
}
```

## Tailwind Classes

The theme toggle automatically applies the `dark` class to the HTML element, enabling Tailwind's dark mode classes:

```tsx
// Light theme (default)
<div className="bg-white text-gray-900">

// Dark theme (when dark class is present)
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
```

## CSS Custom Properties

The theme system also supports CSS custom properties for dynamic theming:

```css
:root {
  --color-primary: #2563eb;
  --color-secondary: #dbeafe;
  --color-background: #ffffff;
  --color-text: #111827;
}

.dark {
  --color-background: #111827;
  --color-text: #f9fafb;
}
```

## Browser Support

- **Modern Browsers**: Full support for localStorage and CSS custom properties
- **Fallback**: Gracefully degrades to light theme if localStorage is unavailable
- **System Theme**: Automatically detects and applies system preference on first visit

## Testing

Run the test suite to verify theme toggle functionality:

```bash
npm test ThemeToggle.test.tsx
```

## Troubleshooting

### Theme Not Persisting
- Check if localStorage is enabled in the browser
- Verify the ThemeProvider wraps the entire application

### Dark Mode Not Working
- Ensure Tailwind config has `darkMode: 'class'`
- Check if the `dark` class is being applied to the HTML element
- Verify dark mode classes are properly defined in components

### Performance Issues
- Theme changes are optimized with minimal re-renders
- localStorage operations are debounced to prevent excessive writes
- CSS transitions provide smooth visual feedback

## Future Enhancements

- **Theme Presets**: Additional theme options beyond light/dark
- **Custom Colors**: User-defined color schemes
- **Animation**: Smooth transitions between themes
- **System Sync**: Option to automatically follow system theme changes
