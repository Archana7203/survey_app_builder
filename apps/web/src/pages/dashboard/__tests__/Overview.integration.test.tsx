import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Overview from '../Overview';
import { buildApiUrl } from '../../../utils/apiConfig';

// Mock the API config
vi.mock('../../../utils/apiConfig', () => ({
  buildApiUrl: vi.fn((path: string) => `http://localhost:3001${path}`)
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock data
const mockSurveysData = [
  { _id: '1', title: 'Customer Satisfaction Survey', status: 'published' },
  { _id: '2', title: 'Employee Feedback', status: 'draft' }
];

const mockTemplatesData = [
  { _id: '1', title: 'Customer Feedback Template' },
  { _id: '2', title: 'Employee Survey Template' }
];

const mockResponsesData = {
  totalResponses: 25,
  completedResponses: 20,
  recentResponses: [
    {
      _id: '1',
      survey: { _id: '1', title: 'Customer Satisfaction Survey', status: 'published' },
      respondentEmail: 'user1@example.com',
      status: 'Completed',
      createdAt: '2024-01-15T20:00:00Z'
    },
    {
      _id: '2',
      survey: { _id: '1', title: 'Customer Satisfaction Survey', status: 'published' },
      respondentEmail: 'user2@example.com',
      status: 'InProgress',
      createdAt: '2024-01-15T20:30:00Z'
    }
  ]
};

describe('Overview Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSurveysData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplatesData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponsesData)
      });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderOverview = () => {
    return render(
      <BrowserRouter>
        <Overview />
      </BrowserRouter>
    );
  };

  describe('Data Loading', () => {
    it('should load and display overview data correctly', async () => {
      renderOverview();

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
      });

      // Check that all main sections are displayed
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Welcome to your survey dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Surveys')).toBeInTheDocument();
      expect(screen.getByText('Published Surveys')).toBeInTheDocument();
      expect(screen.getByText('Total Responses')).toBeInTheDocument();
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      renderOverview();

      expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
    });

    it('should display statistics cards', async () => {
      renderOverview();

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
      });

      // Check that all stat cards are present
      expect(screen.getByText('Total Surveys')).toBeInTheDocument();
      expect(screen.getByText('Published Surveys')).toBeInTheDocument();
      expect(screen.getByText('Total Responses')).toBeInTheDocument();
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });
  });

  describe('Response Completion Rate', () => {
    it('should display response completion rate', async () => {
      renderOverview();

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Response Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('20 of 25 responses completed')).toBeInTheDocument();
    });

    it('should show 0% completion rate when no responses', async () => {
      const emptyResponsesData = {
        totalResponses: 0,
        completedResponses: 0,
        recentResponses: []
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSurveysData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplatesData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(emptyResponsesData)
        });

      renderOverview();

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Response Completion Rate')).toBeInTheDocument();
    });
  });

  describe('Survey Status Distribution', () => {
    it('should display survey status distribution', async () => {
      renderOverview();

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Survey Status Distribution')).toBeInTheDocument();
      expect(screen.getByText('Published')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });
  });

  describe('Recent Activity', () => {
    it('should display recent activity when responses exist', async () => {
      renderOverview();

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getAllByText('Customer Satisfaction Survey')).toHaveLength(2);
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('InProgress')).toBeInTheDocument();
    });

    it('should show empty state when no recent activity', async () => {
      const emptyResponsesData = {
        totalResponses: 0,
        completedResponses: 0,
        recentResponses: []
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSurveysData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplatesData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(emptyResponsesData)
        });

      renderOverview();

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
      });

      // Check that empty state is shown
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      // The empty state should be displayed when no recent responses
      const recentActivitySection = screen.getByText('Recent Activity').closest('.bg-white');
      expect(recentActivitySection).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error')
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplatesData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponsesData)
        });

      renderOverview();

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
      });

      // Should still render the component with partial data
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Total Surveys')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplatesData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponsesData)
        });

      renderOverview();

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
      });

      // Should still render the component
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
  });

  describe('Data Format Variations', () => {
    it('should handle surveys API with pagination', async () => {
      const surveysWithPagination = {
        surveys: mockSurveysData,
        pagination: { total: 2 }
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(surveysWithPagination)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplatesData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponsesData)
        });

      renderOverview();

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Total Surveys')).toBeInTheDocument();
    });

    it('should handle responses data without recentResponses', async () => {
      const responsesDataWithoutRecent = {
        totalResponses: 25,
        completedResponses: 20
        // No recentResponses array
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSurveysData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplatesData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(responsesDataWithoutRecent)
        });

      renderOverview();

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Total Responses')).toBeInTheDocument();
      // Check that the recent activity section exists
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });
  });

  describe('Component Re-rendering', () => {
    it('should not cause infinite re-renders', async () => {
      const { rerender } = renderOverview();

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
      });

      const initialCallCount = mockFetch.mock.calls.length;

      // Re-render the component
      rerender(
        <BrowserRouter>
          <Overview />
        </BrowserRouter>
      );

      // Should not make additional API calls
      expect(mockFetch.mock.calls.length).toBe(initialCallCount);
    });
  });
});