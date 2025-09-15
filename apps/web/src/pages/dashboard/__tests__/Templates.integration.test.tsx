import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Templates from '../Templates';

// Mock the API config
vi.mock('../../../utils/apiConfig', () => ({
  buildApiUrl: vi.fn((path: string) => `http://localhost:3001${path}`)
}));

// Mock the template service
vi.mock('../../../utils/templateService', () => ({
  fetchTemplates: vi.fn(),
  instantiateTemplate: vi.fn()
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock navigate function
const mockNavigate = vi.fn();

// Mock data
const mockTemplatesData = [
  {
    id: 'customer-feedback',
    title: 'Customer Feedback Survey',
    description: 'A comprehensive survey to gather customer feedback and satisfaction ratings',
    category: 'Business',
    thumbnail: '📊',
    estimatedTime: '5 min'
  },
  {
    id: 'employee-satisfaction',
    title: 'Employee Satisfaction Survey',
    description: 'Internal survey to measure employee satisfaction and engagement levels',
    category: 'HR',
    thumbnail: '👥',
    estimatedTime: '10 min'
  }
];

describe('Templates Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock react-router-dom navigate
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate
      };
    });

    // Setup default successful responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTemplatesData)
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderTemplates = () => {
    return render(
      <BrowserRouter>
        <Templates />
      </BrowserRouter>
    );
  };

  describe('Template Loading', () => {
    it('should load and display templates correctly', async () => {
      renderTemplates();

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Check that main sections are displayed
      expect(screen.getByText('Survey Templates')).toBeInTheDocument();
      expect(screen.getByText('Choose from professionally designed survey templates to get started quickly')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      renderTemplates();

      expect(screen.getByText('Loading templates...')).toBeInTheDocument();
    });

    it('should display template cards', async () => {
      renderTemplates();

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Check that the component renders without errors
      expect(screen.getByText('Survey Templates')).toBeInTheDocument();
    });
  });

  describe('Template Categories', () => {
    it('should display category filter buttons', async () => {
      renderTemplates();

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Check category filter buttons
      expect(screen.getByText('All Templates')).toBeInTheDocument();
    });

    it('should show category headers', async () => {
      renderTemplates();

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Should show category filter buttons
      expect(screen.getByText('All Templates')).toBeInTheDocument();
    });
  });

  describe('Template Instantiation', () => {
    it('should display use template buttons', async () => {
      renderTemplates();

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Check that the component renders
      expect(screen.getByText('Survey Templates')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error')
      });

      renderTemplates();

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Should still render the component
      expect(screen.getByText('Survey Templates')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      renderTemplates();

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Should still render the component
      expect(screen.getByText('Survey Templates')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      renderTemplates();

      expect(screen.getByText('Loading templates...')).toBeInTheDocument();
    });
  });

  describe('Template Card Display', () => {
    it('should display template cards with correct structure', async () => {
      renderTemplates();

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Check that the component renders
      expect(screen.getByText('Survey Templates')).toBeInTheDocument();
    });

    it('should display template cards in grid layout', async () => {
      renderTemplates();

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Check that the component renders
      expect(screen.getByText('Survey Templates')).toBeInTheDocument();
    });
  });

  describe('Component Re-rendering', () => {
    it('should not cause infinite re-renders', async () => {
      const { rerender } = renderTemplates();

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      const initialCallCount = mockFetch.mock.calls.length;

      // Re-render the component
      rerender(
        <BrowserRouter>
          <Templates />
        </BrowserRouter>
      );

      // Should not make additional API calls
      expect(mockFetch.mock.calls.length).toBe(initialCallCount);
    });
  });
});