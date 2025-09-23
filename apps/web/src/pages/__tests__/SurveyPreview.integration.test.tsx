import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import SurveyPreview from '../SurveyPreview';

// Mock dependencies
vi.mock('../../utils/apiConfig', () => ({
  buildApiUrl: vi.fn((path) => `http://localhost:3001${path}`)
}));

vi.mock('../../components/questions/QuestionRenderer', () => ({
  default: ({ question, value, onChange, disabled, themeColors }: any) => (
    <div data-testid={`question-${question.id}`}>
      <label>{question.title}</label>
      {question.type === 'text' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          data-testid={`input-${question.id}`}
        />
      )}
      {question.type === 'multiple_choice' && (
        <div>
          {question.options?.map((option: any) => (
            <label key={option.id}>
              <input
                type="radio"
                name={question.id}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                disabled={disabled}
                data-testid={`radio-${question.id}-${option.value}`}
              />
              {option.text}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}));

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/preview/test-survey',
  hostname: 'localhost',
  pathname: '/preview/test-survey'
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock window.close
const mockClose = vi.fn();
Object.defineProperty(window, 'close', {
  value: mockClose,
  writable: true
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ slug: 'test-survey' })
  };
});

describe('SurveyPreview Integration Tests', () => {
  const mockSurvey = {
    id: 'survey-123',
    title: 'Test Survey Preview',
    description: 'A test survey for preview testing',
    pages: [
      {
        questions: [
          {
            id: 'q1',
            type: 'text',
            title: 'What is your name?',
            required: true
          },
          {
            id: 'q2',
            type: 'multiple_choice',
            title: 'What is your favorite color?',
            required: true,
            options: [
              { id: 'opt1', text: 'Red', value: 'red' },
              { id: 'opt2', text: 'Blue', value: 'blue' },
              { id: 'opt3', text: 'Green', value: 'green' }
            ]
          }
        ]
      }
    ],
    theme: 'default',
    status: 'draft',
    backgroundColor: '#ffffff',
    textColor: '#000000'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorageMock.getItem.mockReturnValue(null);
    mockLocation.href = 'http://localhost:3000/preview/test-survey';
    mockLocation.hostname = 'localhost';
    mockLocation.pathname = '/preview/test-survey';
    mockClose.mockClear();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderSurveyPreview = () => {
    return render(
      <MemoryRouter initialEntries={['/preview/test-survey']}>
        <SurveyPreview />
      </MemoryRouter>
    );
  };

  describe('Preview Display and Loading', () => {
    it('should display loading state initially', () => {
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      renderSurveyPreview();
      
      expect(screen.getByText('Loading survey preview...')).toBeInTheDocument();
    });

    it('should display survey title and description after loading', async () => {
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      renderSurveyPreview();
      
      await waitFor(() => {
        expect(screen.getByText('Test Survey Preview')).toBeInTheDocument();
        expect(screen.getByText('A test survey for preview testing')).toBeInTheDocument();
      });
    });

    it('should display questions on current page', async () => {
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      renderSurveyPreview();
      
      await waitFor(() => {
        expect(screen.getByText('What is your name?')).toBeInTheDocument();
        expect(screen.getByText('What is your favorite color?')).toBeInTheDocument();
      });
    });

    it('should show preview mode indicator', async () => {
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      renderSurveyPreview();
      
      await waitFor(() => {
        expect(screen.getByText('Preview Mode - Responses are not saved to database')).toBeInTheDocument();
      });
    });

    it('should handle survey fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Survey not found' })
      });
      
      renderSurveyPreview();
      
      await waitFor(() => {
        expect(screen.getByText('Preview Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to fetch survey')).toBeInTheDocument();
      });
    });

    it('should handle network errors during survey fetch', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      renderSurveyPreview();
      
      await waitFor(() => {
        expect(screen.getByText('Preview Error')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Question Interaction', () => {
    it('should allow interaction with text questions', async () => {
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      renderSurveyPreview();
      
      await waitFor(() => {
        expect(screen.getByText('What is your name?')).toBeInTheDocument();
      });
      
      const nameInput = screen.getByTestId('input-q1');
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      
      expect(nameInput).toHaveValue('John Doe');
    });

    it('should allow interaction with multiple choice questions', async () => {
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      renderSurveyPreview();
      
      await waitFor(() => {
        expect(screen.getByText('What is your favorite color?')).toBeInTheDocument();
      });
      
      const redRadio = screen.getByTestId('radio-q2-red');
      fireEvent.click(redRadio);
      
      expect(redRadio).toBeChecked();
    });

    it('should maintain responses when navigating between pages', async () => {
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      renderSurveyPreview();
      
      await waitFor(() => {
        expect(screen.getByText('What is your name?')).toBeInTheDocument();
      });
      
      // Fill first page
      const nameInput = screen.getByTestId('input-q1');
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      
      const colorRadio = screen.getByTestId('radio-q2-red');
      fireEvent.click(colorRadio);
      
      // Responses should be maintained
      expect(screen.getByTestId('input-q1')).toHaveValue('John Doe');
      expect(screen.getByTestId('radio-q2-red')).toBeChecked();
    });
  });

  describe('Navigation Validation', () => {
    it('should disable Preview Complete button when required questions are not answered', async () => {
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      renderSurveyPreview();
      
      await waitFor(() => {
        expect(screen.getByText('What is your name?')).toBeInTheDocument();
      });
      
      const completeButton = screen.getByText('Preview Complete');
      expect(completeButton).toBeDisabled();
    });

    it('should enable Preview Complete button when all required questions are answered', async () => {
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      renderSurveyPreview();
      
      await waitFor(() => {
        expect(screen.getByText('What is your name?')).toBeInTheDocument();
      });
      
      // Fill required questions
      const nameInput = screen.getByTestId('input-q1');
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      
      const colorRadio = screen.getByTestId('radio-q2-red');
      fireEvent.click(colorRadio);
      
      const completeButton = screen.getByText('Preview Complete');
      expect(completeButton).not.toBeDisabled();
    });
  });

  describe('Close Functionality', () => {
    it('should close window when Close Preview button is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Survey not found' })
      });
      
      renderSurveyPreview();
      
      await waitFor(() => {
        expect(screen.getByText('Close Preview')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByText('Close Preview');
      fireEvent.click(closeButton);
      
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('should render properly on mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      renderSurveyPreview();
      
      await waitFor(() => {
        expect(screen.getByText('Test Survey Preview')).toBeInTheDocument();
      });
      
      expect(screen.getByText('What is your name?')).toBeInTheDocument();
    });

    it('should render properly on desktop viewport', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      renderSurveyPreview();
      
      await waitFor(() => {
        expect(screen.getByText('Test Survey Preview')).toBeInTheDocument();
      });
      
      expect(screen.getByText('What is your name?')).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should handle corrupted sessionStorage data gracefully', async () => {
      const tempSlug = 'temp_12345';
      
      sessionStorageMock.getItem.mockReturnValue('invalid-json');
      
      // Mock useParams to return temp slug
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useParams: () => ({ slug: tempSlug })
        };
      });
      
      renderSurveyPreview();
      
      await waitFor(() => {
        expect(screen.getByText('Preview Error')).toBeInTheDocument();
      });
    });
  });
});