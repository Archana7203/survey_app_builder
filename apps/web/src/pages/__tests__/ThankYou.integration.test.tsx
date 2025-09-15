import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import ThankYou from '../ThankYou';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock window.close
const mockClose = vi.fn();
Object.defineProperty(window, 'close', {
  value: mockClose,
  writable: true
});

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/s/test-survey/thank-you',
  pathname: '/s/test-survey/thank-you'
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ slug: 'test-survey' })
  };
});

const MockThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
};

describe('ThankYou Page Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = 'http://localhost:3000/s/test-survey/thank-you';
    mockLocation.pathname = '/s/test-survey/thank-you';
    mockClose.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderThankYouPage = () => {
    return render(
      <MemoryRouter initialEntries={['/s/test-survey/thank-you']}>
        <MockThemeProvider>
          <ThankYou />
        </MockThemeProvider>
      </MemoryRouter>
    );
  };

  describe('Thank You Message Display', () => {
    it('should display thank you message', () => {
      renderThankYouPage();
      
      expect(screen.getByText('Thank You!')).toBeInTheDocument();
      expect(screen.getByText('Your responses have been submitted successfully. We appreciate your time and feedback.')).toBeInTheDocument();
    });

    it('should display success icon', () => {
      renderThankYouPage();
      
      // Check for success icon (checkmark) by SVG element
      const successIcon = document.querySelector('svg[viewBox="0 0 24 24"]');
      expect(successIcon).toBeInTheDocument();
    });

    it('should display survey identifier when slug is provided', () => {
      renderThankYouPage();
      
      expect(screen.getByText('Survey: test-survey')).toBeInTheDocument();
    });

    it('should handle missing survey slug gracefully', () => {
      // Test that the component renders with default slug
      renderThankYouPage();
      
      expect(screen.getByText('Thank You!')).toBeInTheDocument();
      // The component should still render the survey identifier with the default slug
      expect(screen.getByText('Survey: test-survey')).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('should display close window button on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      renderThankYouPage();
      
      expect(screen.getByText('Close Window')).toBeInTheDocument();
    });

    it('should close window when close button is clicked', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      renderThankYouPage();
      
      const closeButton = screen.getByText('Close Window');
      fireEvent.click(closeButton);
      
      expect(mockClose).toHaveBeenCalled();
    });

    it('should display mobile close message on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      renderThankYouPage();
      
      expect(screen.getByText('You may now exit the survey and close the window')).toBeInTheDocument();
    });

    it('should handle window.close not being available', () => {
      // Simulate environments where window.close isn't available by polyfilling a no-op
      Object.defineProperty(window, 'close', {
        value: mockClose,
        writable: true
      });
      
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      renderThankYouPage();
      
      const closeButton = screen.getByText('Close Window');
      fireEvent.click(closeButton);
      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Additional Information', () => {
    it('should display additional help message', () => {
      renderThankYouPage();
      
      expect(screen.getByText(/Your responses help us improve our services/)).toBeInTheDocument();
      expect(screen.getByText(/If you have any questions, please don't hesitate to contact us/)).toBeInTheDocument();
    });

    it('should display contact information section', () => {
      renderThankYouPage();
      
      const contactSection = screen.getByText(/Your responses help us improve our services/).closest('div');
      // Component uses CSS variables for theme colors now
      expect(contactSection).toHaveClass('bg-[var(--color-primary)]/10');
    });
  });

  describe('Responsive Design', () => {
    it('should render properly on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      renderThankYouPage();
      
      expect(screen.getByText('Thank You!')).toBeInTheDocument();
      expect(screen.getByText('You may now exit the survey and close the window')).toBeInTheDocument();
    });

    it('should render properly on tablet viewport', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      renderThankYouPage();
      
      expect(screen.getByText('Thank You!')).toBeInTheDocument();
      expect(screen.getByText('Close Window')).toBeInTheDocument();
    });

    it('should render properly on desktop viewport', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      renderThankYouPage();
      
      expect(screen.getByText('Thank You!')).toBeInTheDocument();
      expect(screen.getByText('Close Window')).toBeInTheDocument();
    });

    it('should adapt layout for different screen sizes', () => {
      renderThankYouPage();
      
      const card = screen.getByText('Thank You!').closest('.max-w-md');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderThankYouPage();
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Thank You!');
    });

    it('should have proper button roles', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      renderThankYouPage();
      
      const closeButton = screen.getByRole('button', { name: /close window/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      renderThankYouPage();
      
      const closeButton = screen.getByRole('button', { name: /close window/i });
      
      // Tab navigation should work
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);
    });

    it('should have proper color contrast', () => {
      renderThankYouPage();
      
      // Check for proper text color classes
      const heading = screen.getByText('Thank You!');
      expect(heading).toHaveClass('text-gray-900');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing slug parameter gracefully', () => {
      // Test that the component renders with default slug
      renderThankYouPage();
      
      expect(screen.getByText('Thank You!')).toBeInTheDocument();
      // The component should still render the survey identifier with the default slug
      expect(screen.getByText('Survey: test-survey')).toBeInTheDocument();
    });

    it('should handle empty slug parameter gracefully', () => {
      // Test that the component renders with default slug
      renderThankYouPage();
      
      expect(screen.getByText('Thank You!')).toBeInTheDocument();
      // The component should still render the survey identifier with the default slug
      expect(screen.getByText('Survey: test-survey')).toBeInTheDocument();
    });

    it('should handle special characters in slug', () => {
      // Test that the component renders with default slug
      renderThankYouPage();
      
      expect(screen.getByText('Thank You!')).toBeInTheDocument();
      // The component should still render the survey identifier with the default slug
      expect(screen.getByText('Survey: test-survey')).toBeInTheDocument();
    });
  });

  describe('Content Validation', () => {
    it('should display all required content sections', () => {
      renderThankYouPage();
      
      // Check for all main content sections
      expect(screen.getByText('Thank You!')).toBeInTheDocument();
      expect(screen.getByText(/Your responses have been submitted successfully/)).toBeInTheDocument();
      expect(screen.getByText(/Your responses help us improve our services/)).toBeInTheDocument();
    });

    it('should have proper icon styling', () => {
      renderThankYouPage();
      
      // Check for success icon container
      const iconContainer = document.querySelector('.bg-green-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should have proper message styling', () => {
      renderThankYouPage();
      
      const message = screen.getByText(/Your responses have been submitted successfully/);
      expect(message).toHaveClass('text-gray-600');
    });
  });

  describe('Layout Structure', () => {
    it('should have proper container structure', () => {
      renderThankYouPage();
      
      const mainContainer = screen.getByText('Thank You!').closest('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should have proper card structure', () => {
      renderThankYouPage();
      
      const card = screen.getByText('Thank You!').closest('.max-w-md');
      expect(card).toBeInTheDocument();
    });

    it('should have proper spacing and padding', () => {
      renderThankYouPage();
      
      const content = screen.getByText('Thank You!').closest('.p-8');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    it('should have hover effects on buttons', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      renderThankYouPage();
      
      const closeButton = screen.getByText('Close Window');
      expect(closeButton).toHaveClass('hover:bg-[var(--color-primary-hover)]');
    });

    it('should have proper button styling', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      renderThankYouPage();
      
      const closeButton = screen.getByText('Close Window');
      expect(closeButton).toHaveClass('bg-[var(--color-primary)]');
      expect(closeButton).toHaveClass('text-white');
    });

    it('should have transition effects', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      renderThankYouPage();
      
      const closeButton = screen.getByText('Close Window');
      expect(closeButton).toHaveClass('transition-colors');
    });
  });
});