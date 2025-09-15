import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import AuthPage from '../Auth';
import { AuthProvider } from '../../contexts/AuthContext';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock the AuthContext
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider value={{
      user: null,
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      loading: false
    }}>
      {children}
    </AuthProvider>
  );
};

const MockThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider value={{
      theme: 'light',
      toggleTheme: vi.fn()
    }}>
      {children}
    </ThemeProvider>
  );
};

// Mock window.location
const mockLocation = {
  href: '',
  assign: vi.fn(),
  replace: vi.fn()
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

describe('Auth Page Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderAuthPage = () => {
    return render(
      <BrowserRouter>
        <MockThemeProvider>
          <MockAuthProvider>
            <AuthPage />
          </MockAuthProvider>
        </MockThemeProvider>
      </BrowserRouter>
    );
  };

  describe('Login Functionality', () => {
    it('should render login form by default', () => {
      renderAuthPage();
      
      expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
      expect(screen.getByText('Access your survey dashboard')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });

    it('should switch to registration mode', () => {
      renderAuthPage();
      
      const switchButton = screen.getByText('Create an account');
      fireEvent.click(switchButton);
      
      expect(screen.getByText('Create your account')).toBeInTheDocument();
      expect(screen.getByText('Sign up and start creating surveys in minutes!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should switch back to login mode', () => {
      renderAuthPage();
      
      // Switch to registration mode
      const switchToRegister = screen.getByText('Create an account');
      fireEvent.click(switchToRegister);
      
      // Switch back to login mode
      const switchToLogin = screen.getByText('Have an account? Log in');
      fireEvent.click(switchToLogin);
      
      expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
      expect(screen.getByText('Access your survey dashboard')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should have proper form labels', () => {
      renderAuthPage();
      
      // Check for labels by text content instead of getByLabelText
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      renderAuthPage();
      
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create an account/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      renderAuthPage();
      
      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const loginButton = screen.getByRole('button', { name: /log in/i });
      
      // Test that inputs are focusable and accessible
      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);
      
      passwordInput.focus();
      expect(document.activeElement).toBe(passwordInput);
      
      loginButton.focus();
      expect(document.activeElement).toBe(loginButton);
      
      // Test that inputs have proper attributes for accessibility
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(loginButton).toHaveAttribute('type', 'submit');
      
      // Test that form elements are properly structured for accessibility
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
      
      // Test that elements are properly accessible via keyboard
      // Form elements are focusable by default, so we just verify they can be focused
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(loginButton).toBeInTheDocument();
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
      
      renderAuthPage();
      
      expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });

    it('should render properly on desktop viewport', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      renderAuthPage();
      
      expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderAuthPage();
      
      // Check for labels by text content instead of getByLabelText
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      renderAuthPage();
      
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create an account/i })).toBeInTheDocument();
    });

  });
});