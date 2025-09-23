import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import SurveyRenderer from '../SurveyRenderer';

// Mock dependencies
vi.mock('../../utils/apiConfig', () => ({
  buildApiUrl: vi.fn((path) => `http://localhost:3001${path}`)
}));

vi.mock('../../components/questions/QuestionRenderer', () => ({
  default: ({ question, value, onChange, themeColors }: any) => (
    <div data-testid={`question-${question.id}`}>
      <label>{question.title}</label>
      {question.type === 'text' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
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

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
const mockLocation = {
  search: '',
  href: '',
  pathname: '/s/test-survey'
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock navigate
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ slug: 'test-survey' })
  };
});

describe('SurveyRenderer Integration Tests', () => {
  const mockSurvey = {
    id: 'survey-123',
    title: 'Test Survey',
    description: 'A test survey for integration testing',
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
    status: 'published',
    backgroundColor: '#ffffff',
    textColor: '#000000'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockLocation.search = '';
    mockNavigate.mockClear();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderSurveyRenderer = () => {
    return render(
      <MemoryRouter initialEntries={['/s/test-survey']}>
        <SurveyRenderer />
      </MemoryRouter>
    );
  };

  describe('Survey Display and Loading', () => {
    it('should display loading state initially', () => {
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      // Mock successful config fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ autoSaveInterval: 60000 })
      });
      
      renderSurveyRenderer();
      
      expect(screen.getByText('Loading survey...')).toBeInTheDocument();
    });

    it('should display survey title and description after loading', async () => {
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      // Mock successful config fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ autoSaveInterval: 60000 })
      });
      
      renderSurveyRenderer();
      
      await waitFor(() => {
        expect(screen.getByText('Test Survey')).toBeInTheDocument();
        expect(screen.getByText('A test survey for integration testing')).toBeInTheDocument();
      });
    });

    it('should display questions on current page', async () => {
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      // Mock successful config fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ autoSaveInterval: 60000 })
      });
      
      renderSurveyRenderer();
      
      await waitFor(() => {
        expect(screen.getByText('What is your name?')).toBeInTheDocument();
        expect(screen.getByText('What is your favorite color?')).toBeInTheDocument();
      });
    });

    it('should handle survey fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Survey not found' })
      });
      
      renderSurveyRenderer();
      
      await waitFor(() => {
        expect(screen.getByText('Survey Not Available')).toBeInTheDocument();
        expect(screen.getByText('Survey not found')).toBeInTheDocument();
      });
    });

    it('should handle network errors during survey fetch', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      renderSurveyRenderer();
      
      await waitFor(() => {
        expect(screen.getByText('Survey Not Available')).toBeInTheDocument();
        expect(screen.getByText('Error loading survey')).toBeInTheDocument();
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
      
      // Mock successful config fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ autoSaveInterval: 60000 })
      });
      
      renderSurveyRenderer();
      
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
      
      // Mock successful config fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ autoSaveInterval: 60000 })
      });
      
      renderSurveyRenderer();
      
      await waitFor(() => {
        expect(screen.getByText('What is your favorite color?')).toBeInTheDocument();
      });
      
      const redRadio = screen.getByTestId('radio-q2-red');
      fireEvent.click(redRadio);
      
      expect(redRadio).toBeChecked();
    });
  });

  describe('Form Validation', () => {
    it('should prevent submission when required questions are not answered', async () => {
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      // Mock successful config fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ autoSaveInterval: 60000 })
      });
      
      renderSurveyRenderer();
      
      await waitFor(() => {
        expect(screen.getByText('What is your name?')).toBeInTheDocument();
      });
      
      const submitButton = screen.getByText('Submit Survey');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please answer all required questions before submitting.')).toBeInTheDocument();
      });
    });

    it('should allow submission when all required questions are answered', async () => {
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      // Mock successful config fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ autoSaveInterval: 60000 })
      });
      
      renderSurveyRenderer();
      
      await waitFor(() => {
        expect(screen.getByText('What is your name?')).toBeInTheDocument();
      });
      
      // Fill required questions
      const nameInput = screen.getByTestId('input-q1');
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      
      const colorRadio = screen.getByTestId('radio-q2-red');
      fireEvent.click(colorRadio);
      
      const submitButton = screen.getByText('Submit Survey');
      fireEvent.click(submitButton);
      
      // Should not show error message
      expect(screen.queryByText('Please answer all required questions before submitting.')).not.toBeInTheDocument();
    });
  });

  describe('Auto-save Functionality', () => {
    it('should auto-save responses to localStorage', async () => {
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      // Mock successful config fetch with shorter interval for testing
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ autoSaveInterval: 1000 })
      });
      
      renderSurveyRenderer();
      
      await waitFor(() => {
        expect(screen.getByText('What is your name?')).toBeInTheDocument();
      });
      
      const nameInput = screen.getByTestId('input-q1');
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      
      // Wait for auto-save (with longer timeout for auto-save interval)
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled();
      }, { timeout: 5000 });
    });

    it('should load draft from localStorage on page load', async () => {
      const draftData = {
        responses: { q1: 'John Doe' },
        currentPageIndex: 0,
        pagesVisited: [0],
        lastSaved: Date.now()
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(draftData));
      
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      // Mock successful config fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ autoSaveInterval: 60000 })
      });
      
      renderSurveyRenderer();
      
      await waitFor(() => {
        expect(screen.getByText('What is your name?')).toBeInTheDocument();
      });
      
      const nameInput = screen.getByTestId('input-q1');
      expect(nameInput).toHaveValue('John Doe');
    });
  });

  describe('Error Recovery', () => {
    it('should handle corrupted localStorage data gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      // Mock successful survey fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey
      });
      
      // Mock successful config fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ autoSaveInterval: 60000 })
      });
      
      renderSurveyRenderer();
      
      await waitFor(() => {
        expect(screen.getByText('What is your name?')).toBeInTheDocument();
      });
      
      // Should not crash and should start with empty form
      const nameInput = screen.getByTestId('input-q1');
      expect(nameInput).toHaveValue('');
    });
  });
});