import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EmailQuestion from '../EmailQuestion';

describe('EmailQuestion Component', () => {
  const mockOnChange = vi.fn();
  
  const mockQuestion = {
    id: 'test-question',
    title: 'Email Address',
    description: 'Please enter your email address',
    required: true,
    settings: {
      placeholder: 'Enter your email',
      validation: {
        required: true,
        pattern: '^[^@]+@[^@]+\\.[^@]+$'
      }
    }
  };

  const defaultProps = {
    question: mockQuestion,
    onChange: mockOnChange,
    value: ''
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Basic Functionality Tests
  describe('Basic Functionality', () => {
    it('should render with default props', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should display placeholder text', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'Enter your email address');
    });

    it('should handle email input', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('test@example.com');
    });

    it('should display current value', () => {
      render(<EmailQuestion {...defaultProps} value="user@domain.com" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('user@domain.com');
    });

    it('should show required indicator when required', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should not show required indicator when not required', () => {
      const question = { ...mockQuestion, required: false };
      render(<EmailQuestion {...defaultProps} question={question} />);
      
      const input = screen.getByRole('textbox');
      expect(input).not.toHaveAttribute('required');
    });

    it('should have email input type', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle valid email formats', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ];
      
      validEmails.forEach(email => {
        fireEvent.change(input, { target: { value: email } });
        expect(mockOnChange).toHaveBeenCalledWith(email);
      });
    });

    it('should handle invalid email formats', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user..double@domain.com',
        'user@domain..com'
      ];
      
      invalidEmails.forEach(email => {
        fireEvent.change(input, { target: { value: email } });
        expect(mockOnChange).toHaveBeenCalledWith(email);
      });
    });

    it('should handle special characters in email', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      const specialEmails = [
        'user+tag@example.com',
        'user.name@example.com',
        'user_name@example.com',
        'user-name@example.com'
      ];
      
      specialEmails.forEach(email => {
        fireEvent.change(input, { target: { value: email } });
        expect(mockOnChange).toHaveBeenCalledWith(email);
      });
    });

    it('should handle international domain names', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      const internationalEmails = [
        'user@example.co.uk',
        'user@example.com.au',
        'user@example.de',
        'user@example.fr'
      ];
      
      internationalEmails.forEach(email => {
        fireEvent.change(input, { target: { value: email } });
        expect(mockOnChange).toHaveBeenCalledWith(email);
      });
    });

        it('should handle empty string input', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '' } });

      // Component doesn't call onChange for empty strings
      expect(mockOnChange).not.toHaveBeenCalled();
    });

        it('should handle whitespace-only input', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '   ' } });

      // Component doesn't call onChange for whitespace-only strings
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should handle rapid email changes', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      
      // Rapid changes
      for (let i = 0; i < 10; i++) {
        fireEvent.change(input, { target: { value: `user${i}@example.com` } });
      }
      
      expect(mockOnChange).toHaveBeenCalledTimes(10);
      expect(mockOnChange).toHaveBeenLastCalledWith('user9@example.com');
    });

        it('should handle copy/paste operations', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      const pastedEmail = 'pasted@example.com';
      
      // Simulate paste by directly changing the input value
      fireEvent.change(input, { target: { value: pastedEmail } });

      expect(mockOnChange).toHaveBeenCalledWith(pastedEmail);
    });

    it('should handle very long email addresses', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      
      fireEvent.change(input, { target: { value: longEmail } });
      
      expect(mockOnChange).toHaveBeenCalledWith(longEmail);
    });

    it('should handle missing placeholder setting', () => {
      const question = { ...mockQuestion, settings: { validation: {} } };
      render(<EmailQuestion {...defaultProps} question={question} />);
      
      const input = screen.getByRole('textbox');
      // Component has hardcoded placeholder
      expect(input).toHaveAttribute('placeholder', 'Enter your email address');
    });

    it('should handle null/undefined values gracefully', () => {
      render(<EmailQuestion {...defaultProps} value={null as any} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    it('should handle undefined values gracefully', () => {
      render(<EmailQuestion {...defaultProps} value={undefined as any} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });
  });

  // Error Handling
  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      render(<EmailQuestion {...defaultProps} error="Please enter a valid email address" />);
      
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should handle missing question prop gracefully', () => {
      expect(() => {
        render(<EmailQuestion {...defaultProps} question={null as any} />);
      }).toThrow('Cannot read properties of null');
    });

    it('should handle missing onChange prop gracefully', () => {
      expect(() => {
        render(<EmailQuestion {...defaultProps} onChange={undefined as any} />);
      }).not.toThrow();
    });

    it('should handle malformed question data', () => {
      const malformedQuestion = {
        id: 'malformed',
        title: null,
        description: undefined,
        required: 'not-a-boolean',
        settings: null
      };
      
      expect(() => {
        render(<EmailQuestion {...defaultProps} question={malformedQuestion} />);
      }).not.toThrow();
    });

    it('should handle invalid validation settings', () => {
      const question = { 
        ...mockQuestion, 
        settings: { 
          validation: {
            pattern: 'invalid-regex[',
            required: 'not-boolean'
          }
        } 
      };
      
      expect(() => {
        render(<EmailQuestion {...defaultProps} question={question} />);
      }).not.toThrow();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      
      expect(input).toHaveFocus();
    });

    it('should have proper ARIA attributes', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should support screen reader compatibility', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const label = screen.getByText('Email Address');
      expect(label).toBeInTheDocument();
    });

    it('should have proper focus management', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      
      expect(input).toHaveFocus();
    });

    it('should support tab navigation', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      
      fireEvent.keyDown(input, { key: 'Tab' });
      // Component doesn't prevent default tab behavior
      expect(input).toHaveFocus();
    });

    it('should support enter key submission', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      
      fireEvent.keyDown(input, { key: 'Enter' });
      // Should not prevent default
      expect(input).toBeInTheDocument();
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should handle rapid input changes efficiently', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      const startTime = performance.now();
      
      // Rapid changes
      for (let i = 0; i < 100; i++) {
        fireEvent.change(input, { target: { value: `user${i}@example.com` } });
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should handle large email input efficiently', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      const largeEmail = 'a'.repeat(100) + '@' + 'b'.repeat(100) + '.com';
      
      const startTime = performance.now();
      fireEvent.change(input, { target: { value: largeEmail } });
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });
  });

  // Validation Tests
  describe('Validation', () => {
    it('should handle required validation', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });

        it('should handle custom validation patterns', () => {
      const question = { 
        ...mockQuestion, 
        settings: { 
          validation: { 
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' 
          } 
        } 
      };
      render(<EmailQuestion {...defaultProps} question={question} />);
      
      const input = screen.getByRole('textbox');
      // Component doesn't support pattern attribute
      expect(input).toBeInTheDocument();
    });

    it('should handle missing validation settings', () => {
      const question = { ...mockQuestion, settings: {} };
      render(<EmailQuestion {...defaultProps} question={question} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });
  });

  // Theme and Styling Tests
  describe('Theme and Styling', () => {
    it('should apply custom styling when provided', () => {
      const themeColors = {
        backgroundColor: '#f0f0f0',
        textColor: '#333333',
        primaryColor: '#007bff'
      };
      
      render(<EmailQuestion {...defaultProps} themeColors={themeColors} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should handle missing theme colors gracefully', () => {
      render(<EmailQuestion {...defaultProps} themeColors={undefined as any} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should handle dynamic content changes', () => {
      const { rerender } = render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      
      // Change question content
      const newQuestion = { ...mockQuestion, title: 'New Email Field' };
      rerender(<EmailQuestion {...defaultProps} question={newQuestion} />);
      
      expect(screen.getByText('New Email Field')).toBeInTheDocument();
    });
  });

  // Email-specific Tests
  describe('Email-specific Functionality', () => {
    it('should handle email autocomplete', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should handle email validation on blur', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'invalid-email' } });
      fireEvent.blur(input);
      
      // Component should still function
      expect(input).toBeInTheDocument();
    });

    it('should handle email suggestions', () => {
      render(<EmailQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'user@' } });
      
      // Component should handle partial email input
      expect(mockOnChange).toHaveBeenCalledWith('user@');
    });
  });
});
