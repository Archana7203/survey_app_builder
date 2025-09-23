import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Surveys from '../Surveys';

// Mock the API config
vi.mock('../../../utils/apiConfig', () => ({
  buildApiUrl: vi.fn((path: string) => `http://localhost:3001${path}`)
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock navigate function
const mockNavigate = vi.fn();

// Mock data
const mockSurveysData = [
  {
    _id: '1',
    title: 'Customer Satisfaction Survey',
    description: 'A comprehensive survey about customer experience',
    status: 'published',
    createdAt: '2024-01-15T10:00:00Z',
    closeDate: null
  },
  {
    _id: '2',
    title: 'Employee Feedback',
    description: 'Internal employee satisfaction survey',
    status: 'draft',
    createdAt: '2024-01-16T10:00:00Z',
    closeDate: '2024-02-16T10:00:00Z'
  }
];

describe('Surveys Integration Tests', () => {
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
      json: () => Promise.resolve(mockSurveysData)
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderSurveys = () => {
    return render(
      <BrowserRouter>
        <Surveys />
      </BrowserRouter>
    );
  };

  describe('Survey Loading', () => {
    it('should load and display surveys correctly', async () => {
      renderSurveys();

      await waitFor(() => {
        expect(screen.queryByText('Loading surveys...')).not.toBeInTheDocument();
      });

      // Check that main sections are displayed
      expect(screen.getByText('Surveys')).toBeInTheDocument();
      expect(screen.getByText('Create and manage your surveys')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      renderSurveys();

      expect(screen.getByText('Loading surveys...')).toBeInTheDocument();
    });

    it('should display survey table', async () => {
      renderSurveys();

      await waitFor(() => {
        expect(screen.queryByText('Loading surveys...')).not.toBeInTheDocument();
      });

      // Check that table headers are displayed
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Close Date')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  describe('Survey Actions', () => {
    it('should display action buttons', async () => {
      renderSurveys();

      await waitFor(() => {
        expect(screen.queryByText('Loading surveys...')).not.toBeInTheDocument();
      });

      // Check that action buttons are displayed
      expect(screen.getByText('+ Create Survey')).toBeInTheDocument();
      expect(screen.getByText('📥 Import')).toBeInTheDocument();
      expect(screen.getByText('📋 Templates')).toBeInTheDocument();
    });
  });

  describe('Survey Status Display', () => {
    it('should display survey statuses', async () => {
      renderSurveys();

      await waitFor(() => {
        expect(screen.queryByText('Loading surveys...')).not.toBeInTheDocument();
      });

      // Check that at least one status badge is displayed
      const publishedBadges = screen.getAllByText('Published');
      expect(publishedBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error')
      });

      renderSurveys();

      await waitFor(() => {
        expect(screen.queryByText('Loading surveys...')).not.toBeInTheDocument();
      });

      // Should still render the component
      expect(screen.getByText('Surveys')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      renderSurveys();

      await waitFor(() => {
        expect(screen.queryByText('Loading surveys...')).not.toBeInTheDocument();
      });

      // Should still render the component
      expect(screen.getByText('Surveys')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      renderSurveys();

      expect(screen.getByText('Loading surveys...')).toBeInTheDocument();
    });
  });

  describe('Component Re-rendering', () => {
    it('should not cause infinite re-renders', async () => {
      const { rerender } = renderSurveys();

      await waitFor(() => {
        expect(screen.queryByText('Loading surveys...')).not.toBeInTheDocument();
      });

      const initialCallCount = mockFetch.mock.calls.length;

      // Re-render the component
      rerender(
        <BrowserRouter>
          <Surveys />
        </BrowserRouter>
      );

      // Should not make additional API calls
      expect(mockFetch.mock.calls.length).toBe(initialCallCount);
    });
  });
});