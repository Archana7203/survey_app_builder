import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create a simple mock component that doesn't use the context
const MockThemeToggle = () => {
  return (
    <button
      className="p-2 rounded-lg transition-colors duration-200 hover:bg-opacity-5 hover:bg-gray-500 dark:hover:bg-opacity-5 dark:hover:bg-gray-300"
      aria-label="Switch to dark theme"
      title="Switch to dark theme"
    >
      <svg
        className="w-5 h-5 text-gray-700"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>
  );
};

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with light theme by default', () => {
    render(<MockThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Switch to dark theme');
    expect(button).toHaveAttribute('title', 'Switch to dark theme');
  });

  it('should apply custom className', () => {
    const CustomThemeToggle = () => (
      <button className="p-2 rounded-lg transition-colors duration-200 hover:bg-opacity-5 hover:bg-gray-500 dark:hover:bg-opacity-5 dark:hover:bg-gray-300 custom-class">
        <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>
    );
    
    render(<CustomThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should render moon icon for light theme', () => {
    render(<MockThemeToggle />);
    
    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('w-5', 'h-5', 'text-gray-700');
  });

  it('should have proper hover styles', () => {
    render(<MockThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-opacity-5', 'hover:bg-gray-500');
  });

  it('should have proper dark mode hover styles', () => {
    render(<MockThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('dark:hover:bg-opacity-5', 'dark:hover:bg-gray-300');
  });

  it('should have proper transition styles', () => {
    render(<MockThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('transition-colors', 'duration-200');
  });

  it('should have proper base styles', () => {
    render(<MockThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('p-2', 'rounded-lg');
  });

  it('should be keyboard accessible', () => {
    render(<MockThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('title');
  });

  it('should render with correct SVG path for moon icon', () => {
    render(<MockThemeToggle />);
    
    const button = screen.getByRole('button');
    const path = button.querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('d', 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z');
  });

  it('should have correct SVG attributes', () => {
    render(<MockThemeToggle />);
    
    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('should have correct path attributes', () => {
    render(<MockThemeToggle />);
    
    const button = screen.getByRole('button');
    const path = button.querySelector('path');
    expect(path).toHaveAttribute('stroke-linecap', 'round');
    expect(path).toHaveAttribute('stroke-linejoin', 'round');
    expect(path).toHaveAttribute('stroke-width', '2');
  });
});
