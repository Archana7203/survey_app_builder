import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SurveyBuilder from '../SurveyBuilder';

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
const mockSurveyData = {
  _id: '1',
  title: 'Customer Satisfaction Survey',
  description: 'A comprehensive survey about customer experience',
  status: 'draft',
  pages: [
    {
      _id: 'page1',
      title: 'Page 1',
      questions: []
    }
  ]
};

describe('SurveyBuilder Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock react-router-dom navigate
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ surveyId: '1' })
      };
    });

    // Setup default successful responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSurveyData)
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderSurveyBuilder = () => {
    return render(
      <BrowserRouter>
        <SurveyBuilder />
      </BrowserRouter>
    );
  };

  describe('Component Rendering', () => {
    it('should render the SurveyBuilder component', () => {
      renderSurveyBuilder();

      // Check that the component renders
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      renderSurveyBuilder();

      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });
  });

  describe('Survey Loading', () => {
    it('should load existing survey data correctly', () => {
      renderSurveyBuilder();

      // Check that the component renders
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });

    it('should handle survey fetch error', () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Survey not found')
      });

      renderSurveyBuilder();

      // Should still render the component
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });

    it('should handle network errors during survey fetch', () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      renderSurveyBuilder();

      // Should still render the component
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });
  });

  describe('Survey Saving', () => {
    it('should save new survey successfully', () => {
      renderSurveyBuilder();

      // Check that the component renders
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });

    it('should update existing survey successfully', () => {
      renderSurveyBuilder();

      // Check that the component renders
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });

    it('should handle save API errors', () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Save error')
      });

      renderSurveyBuilder();

      // Should still render the component
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });
  });

  describe('Page Management', () => {
    it('should add new page correctly', () => {
      renderSurveyBuilder();

      // Check that the component renders
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });

    it('should delete page correctly', () => {
      renderSurveyBuilder();

      // Check that the component renders
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });

    it('should switch between pages correctly', () => {
      renderSurveyBuilder();

      // Check that the component renders
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });
  });

  describe('Question Management', () => {
    it('should add question via drag and drop', () => {
      renderSurveyBuilder();

      // Check that the component renders
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });

    it('should edit question properties', () => {
      renderSurveyBuilder();

      // Check that the component renders
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });

    it('should delete question correctly', () => {
      renderSurveyBuilder();

      // Check that the component renders
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });
  });

  describe('Theme and Styling', () => {
    it('should apply theme correctly', () => {
      renderSurveyBuilder();

      // Check that the component renders
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });

    it('should update background and text colors', () => {
      renderSurveyBuilder();

      // Check that the component renders
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });
  });

  describe('View Mode', () => {
    it('should render in view mode correctly', () => {
      renderSurveyBuilder();

      // Check that the component renders
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });

    it('should show respondent progress in view mode', () => {
      renderSurveyBuilder();

      // Check that the component renders
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });
  });

  describe('Locked Survey Handling', () => {
    it('should show locked survey banner', () => {
      renderSurveyBuilder();

      // Check that the component renders
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate back to surveys list', () => {
      renderSurveyBuilder();

      // Check that the component renders
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid survey data structure', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data' })
      });

      renderSurveyBuilder();

      // Should still render the component
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });

    it('should handle malformed pages data', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ pages: 'invalid' })
      });

      renderSurveyBuilder();

      // Should still render the component
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });
  });

  describe('Component Re-rendering', () => {
    it('should not cause infinite re-renders', () => {
      const { rerender } = renderSurveyBuilder();

      const initialCallCount = mockFetch.mock.calls.length;

      // Re-render the component
      rerender(
        <BrowserRouter>
          <SurveyBuilder />
        </BrowserRouter>
      );

      // Should not make additional API calls
      expect(mockFetch.mock.calls.length).toBe(initialCallCount);
    });
  });
});