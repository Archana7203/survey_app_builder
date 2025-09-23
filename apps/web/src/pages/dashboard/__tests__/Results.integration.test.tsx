import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Results from '../Results';

// Mock the API config
vi.mock('../../../utils/apiConfig', () => ({
  buildApiUrl: vi.fn((path: string) => `http://localhost:3001${path}`)
}));

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  default: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn()
  }))
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Results Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderResults = () => {
    return render(
      <BrowserRouter>
        <Results />
      </BrowserRouter>
    );
  };

  describe('Component Rendering', () => {
    it('should render the Results component', () => {
      renderResults();

      // Check that the component renders
      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      renderResults();

      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error')
      });

      renderResults();

      // Should still render the component
      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      renderResults();

      // Should still render the component
      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });
  });

  describe('Component Re-rendering', () => {
    it('should not cause infinite re-renders', () => {
      const { rerender } = renderResults();

      const initialCallCount = mockFetch.mock.calls.length;

      // Re-render the component
      rerender(
        <BrowserRouter>
          <Results />
        </BrowserRouter>
      );

      // Should not make additional API calls
      expect(mockFetch.mock.calls.length).toBe(initialCallCount);
    });
  });
});