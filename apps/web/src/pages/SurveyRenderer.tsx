import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuestionRenderer from '../components/questions/QuestionRenderer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import { evaluateCondition } from '../utils/visibilityHelpers';
import { fetchPublicSurveyApi } from '../api-paths/surveysApi';
import { autoSaveResponse, submitSurveyApi } from '../api-paths/responsesApi';
import { buildApiUrl } from '../api-paths/apiConfig';

interface Question {
  id: string;
  type: string;
  title: string;
  description?: string;
  required: boolean;
  options?: Array<{
    id: string;
    text: string;
    value?: string;
  }>;
  settings?: Record<string, unknown>;
  // Optional visibility rules (show question when any group matches)
  visibilityRules?: Array<BranchingRule & { groupIndex?: number }>;
  visibleWhen?: Array<BranchingRule & { groupIndex?: number }>;
}

interface BranchingRule {
  questionId: string;
  condition: {
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: string | number | boolean;
  };
  logical?: 'AND' | 'OR';
  action?: {
    type: 'skip_to_page' | 'end_survey';
    targetPageIndex?: number;
  };
}

interface SurveyPage {
  questions: Question[];
  branching?: BranchingRule[];
  backgroundColor?: string;
}

interface Survey {
  id: string;
  title: string;
  description?: string;
  pages: SurveyPage[];
  theme?: string;
  status: string;
  closeDate?: string;
  backgroundColor?: string;
  textColor?: string;
}

interface SurveyResponse {
  [questionId: string]: string | number | boolean | string[] | number[] | Record<string, string>;
}

export default function SurveyRenderer() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [responses, setResponses] = useState<SurveyResponse>({});
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  const [pagesVisited, setPagesVisited] = useState<number[]>([0]);
  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(60000);
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);

  const draftKey = `survey_${slug}_draft`;

  // Helper: extract visibility rules from a question (supports multiple locations for flexibility)
  const getVisibilityRules = useCallback((question: Question): Array<BranchingRule & { groupIndex?: number }> => {
    const settings = (question.settings || {});
    const fromSettings = (settings.visibleWhen || (settings.visibility as any)?.rules) as Array<BranchingRule & { groupIndex?: number }> | undefined;
    return (
      question.visibilityRules ||
      question.visibleWhen ||
      fromSettings ||
      []
    ) as Array<BranchingRule & { groupIndex?: number }>;
  }, []);

  // Helper: is a question visible under current responses?
  const isQuestionVisible = useCallback((question: Question): boolean => {
    const rules = getVisibilityRules(question);
    if (!rules || rules.length === 0) return true;

    // Check if any dependent question has been answered
    const anyDependencyAnswered = rules.some(r => responses[r.questionId] !== undefined);
    if (!anyDependencyAnswered) return false;

    // Group rules by groupIndex
    const groups: Record<number, typeof rules> = {};
    for (const rule of rules) {
      const gi = rule.groupIndex ?? 0;
      if (!groups[gi]) groups[gi] = [];
      groups[gi].push(rule);
    }

  // Helper: evaluate a group of rules
    const evaluateGroup = (groupRules: typeof rules) =>
      groupRules.reduce((acc, rule, idx) => {
        const resp = responses[rule.questionId];
        const conditionMet = resp !== undefined && evaluateCondition(rule.condition.operator, rule.condition.value, resp);

        if (idx === 0) return conditionMet;

        const prevLogical = (groupRules[idx - 1].logical as 'AND' | 'OR') ?? 'OR';
        return prevLogical === 'AND' ? acc && conditionMet : acc || conditionMet;
      }, false);

    // A question is visible if ANY group evaluates to true
    return Object.values(groups).some(evaluateGroup);
  }, [getVisibilityRules, responses]);


  // Get token from URL
  const token = new URLSearchParams(globalThis.location.search).get('token');
  const pagesWithKeys = useMemo(() => {
    if (!survey) return [];
    return survey.pages.map(page => ({ ...page, _key: crypto.randomUUID() }));
  }, [survey]);

  const fetchSurvey = useCallback(async () => {
    if (!slug) return;

    try {
      console.log('Fetching survey with slug:', slug);
      const data = await fetchPublicSurveyApi(slug, token||undefined);
      console.log('Survey data received:', data);
      setSurvey(data);
      setError(null);
    } catch (error: any) {
      console.error('Survey fetch error:', error);
      setError(error.message || 'Error loading survey');
    } finally {
      setLoading(false);
    }
  }, [slug, token]);

  // Fetch config.json
  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl('/config.json'));
      if (response.ok) {
        const config = await response.json();
        setAutoSaveInterval(config.autoSaveInterval);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      // Keep default interval
    }
  }, []);

  // Load survey data and config
  useEffect(() => {
    if (slug) {
      fetchSurvey();
      fetchConfig();
    }
  }, [slug, fetchSurvey, fetchConfig]);

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setResponses(draft.responses || {});
        setCurrentPageIndex(draft.currentPageIndex || 0);
        setPagesVisited(draft.pagesVisited || [0]);
      } catch {
        // Handle error silently
      }
    }
  }, [draftKey]);

  // Auto-save to backend and localStorage every 60 seconds
const saveProgress = useCallback(async () => {
    if (Object.keys(responses).length === 0) return;

    // Save to localStorage
    const draft = {
      responses,
      currentPageIndex,
      pagesVisited,
      lastSaved: Date.now(),
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));

    // Save to backend
    try {
      if (!survey) return;

      // Prepare response data (exclude hidden questions)
      const responseData = Object.entries(responses).flatMap(([questionId, value]) => {
        let pageIndex = -1;
        let foundQuestion;
        for (let i = 0; i < (survey?.pages.length || 0); i++) {
          const q = survey?.pages[i].questions.find(qn => qn.id === questionId);
          if (q) {
            pageIndex = i;
            foundQuestion = q;
            break;
          }
        }
        if (!foundQuestion || pageIndex === -1) return [];
        if (!isQuestionVisible(foundQuestion)) return []; // skip hidden
        return [{ questionId, value, pageIndex }];
      });

      const payload = {
        responses: responseData,
        metadata: {
          lastPageIndex: currentPageIndex,
          timeSpent: Math.floor((Date.now() - startTime) / 1000),
          pagesVisited: [...new Set([...pagesVisited, currentPageIndex])]
        },
        status: "InProgress",
        updatedAt: new Date().toISOString(),
      };

      await autoSaveResponse(survey.id, payload, token||undefined);
      setLastSaveTime(new Date().toISOString());
    } catch (error: any) {
      console.error('Auto-save error:', error);
    }
  }, [responses, currentPageIndex, pagesVisited, draftKey, survey, isQuestionVisible, startTime, token]);

  // Set up auto-save interval
  useEffect(() => {
    const interval = setInterval(saveProgress, autoSaveInterval);
    return () => clearInterval(interval);
  }, [saveProgress, autoSaveInterval]);

  const handleQuestionChange = (questionId: string, value: string | number | boolean | string[] | number[] | Record<string, string>) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const validateCurrentPage = (): boolean => {
    if (!survey) return false;
    
    const currentPage = survey.pages[currentPageIndex];
    const requiredQuestions = currentPage.questions
      .filter(q => isQuestionVisible(q))
      .filter(q => q.required);
    
    for (const question of requiredQuestions) {
      const response = responses[question.id];
      if (response === undefined || response === null || response === '') {
        return false;
      }
      
      // Special validation for arrays (multi-choice questions)
      if (Array.isArray(response) && response.length === 0) {
        return false;
      }
    }
    
    return true;
  };

  const getNextPageIndex = (): number | null => {
    if (!survey) return null;
    return currentPageIndex + 1 < survey.pages.length ? currentPageIndex + 1 : null;
  };

  const goToNextPage = () => {
    if (!validateCurrentPage()) {
      setError('Please answer all required questions before continuing.');
      return;
    }
    
    setError(null);
    const nextPageIndex = getNextPageIndex();
    
    if (nextPageIndex === null) {
      // End of survey or branching rule triggered end
      submitSurvey();
    } else {
      setCurrentPageIndex(nextPageIndex);
      setPagesVisited(prev => [...new Set([...prev, nextPageIndex])]);
    }
  };

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
      setError(null);
    }
  };

  const saveProgressToServer = useCallback(async () => {
    if (Object.keys(responses).length === 0) return;

    try {
      if (!survey) return;

      const responseData = Object.entries(responses).flatMap(([questionId, value]) => {
        let pageIndex = -1;
        let foundQuestion: Question | undefined;

        for (let i = 0; i < (survey?.pages.length || 0); i++) {
          const q = survey?.pages[i].questions.find(qn => qn.id === questionId);
          if (q) {
            pageIndex = i;
            foundQuestion = q;
            break;
          }
        }

        if (!foundQuestion || pageIndex === -1) return [];
        if (!isQuestionVisible(foundQuestion)) return []; // skip hidden

        return [{ questionId, value, pageIndex }];
      });

      const payload = {
        responses: responseData,
        metadata: {
          lastPageIndex: currentPageIndex,
          timeSpent: Math.round((Date.now() - startTime) / 1000),
          pagesVisited,
        },
        status: "InProgress",
        updatedAt: new Date().toISOString(),
      };

      await autoSaveResponse(survey.id, payload, token || undefined);
      setLastSaveTime(new Date().toISOString());
    } catch (error: any) {
      alert("Auto save error")
      console.error('Auto-save error:', error);
    }
  }, [responses, currentPageIndex, pagesVisited, survey, isQuestionVisible, startTime, token]);

  const submitSurvey = async () => {
    if (!survey) return;

    if (!validateCurrentPage()) {
      setError('Please answer all required questions before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Save progress to server before submitting
      await saveProgressToServer();

      // Prepare response data (exclude hidden questions)
      const responseData = Object.entries(responses).flatMap(([questionId, value]) => {
        let pageIndex = -1;
        let foundQuestion: Question | undefined;

        for (let i = 0; i < survey.pages.length; i++) {
          const q = survey.pages[i].questions.find(qn => qn.id === questionId);
          if (q) {
            pageIndex = i;
            foundQuestion = q;
            break;
          }
        }

        if (!foundQuestion || pageIndex === -1) return [];
        if (!isQuestionVisible(foundQuestion)) return [];
        return [{ questionId, value, pageIndex }];
      });

      const timeSpent = Math.round((Date.now() - startTime) / 1000);

      await submitSurveyApi(survey.id, {
        responses: responseData,
        metadata: {
          timeSpent,
          pagesVisited,
          lastPageIndex: currentPageIndex,
        },
      }, token || undefined);

      console.log('Survey submitted successfully');
      localStorage.removeItem(draftKey);
      navigate(`/s/${slug}/thank-you`);
    } catch (error: any) {
      console.error('Submit error:', error);
      setError(error.message || 'Error submitting survey');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: survey?.backgroundColor || '#f9fafb' }}>
        <div style={{ color: survey?.textColor || '#111827' }}>Loading survey...</div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <Card className="max-w-md w-full mx-4">
          <div className="p-6 text-center">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: '#111827' }}>
              Survey Not Available
            </h3>
            <p style={{ color: '#374151' }}>
              {error}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!survey) return null;

  const currentPage = survey.pages[currentPageIndex];
  const isLastPage = currentPageIndex === survey.pages.length - 1;

  const pageBg = currentPage.backgroundColor || survey.backgroundColor;
  
  // Get theme colors
  const getThemeColors = () => {
    const palette: Record<string, { bg: string; text: string; primary: string }> = {
      default: { bg: '#f9fafb', text: '#111827', primary: '#2563eb' },
      emerald: { bg: '#f0fdf4', text: '#064e3b', primary: '#059669' },
      purple: { bg: '#faf5ff', text: '#581c87', primary: '#7c3aed' },
      rose: { bg: '#fff1f2', text: '#881337', primary: '#e11d48' },
      amber: { bg: '#fffbeb', text: '#78350f', primary: '#d97706' },
      indigo: { bg: '#eef2ff', text: '#312e81', primary: '#4f46e5' },
      teal: { bg: '#f0fdfa', text: '#134e4a', primary: '#0d9488' },
      slate: { bg: '#f8fafc', text: '#0f172a', primary: '#475569' },
    };
    
    // Always use the survey's actual theme, regardless of custom colors
    const theme = palette[survey.theme as keyof typeof palette] || palette.default;
    
    return { 
      backgroundColor: survey.backgroundColor || theme.bg, 
      color: survey.textColor || theme.text, 
      primary: theme.primary  // Always use theme primary color
    };
  };
  
  const themeColors = getThemeColors();

  // Compute visible questions for current page
  const visibleQuestions = currentPage.questions.filter(q => isQuestionVisible(q));

  const surveyTextColor = survey.textColor;

  const finalStyle = { 
    backgroundColor: pageBg || themeColors.backgroundColor, 
    color: surveyTextColor || themeColors.color 
  };
  
  // Debug logging
  console.log('SurveyRenderer - Theme colors:', {
    surveyTheme: survey?.theme,
    surveyBackgroundColor: survey?.backgroundColor,
    surveyTextColor: survey?.textColor,
    themeColors,
    pageBg,
    finalStyle
  });
  
  // Debug CSS custom properties
  console.log('SurveyRenderer - CSS Custom Properties:', {
    primary: themeColors.primary,
    secondary: (() => {
      const palette: Record<string, { secondary: string }> = {
        default: { secondary: '#dbeafe' },
        emerald: { secondary: '#d1fae5' },
        purple: { secondary: '#ede9fe' },
        rose: { secondary: '#ffe4e6' },
        amber: { secondary: '#fef3c7' },
        indigo: { secondary: '#e0e7ff' },
        teal: { secondary: '#ccfbf1' },
        slate: { secondary: '#e2e8f0' },
      };
      const theme = palette[survey.theme as keyof typeof palette] || palette.default;
      return theme.secondary;
    })(),
    accent: (() => {
      const palette: Record<string, { accent: string }> = {
        default: { accent: '#3b82f6' },
        emerald: { accent: '#10b981' },
        purple: { accent: '#8b5cf6' },
        rose: { accent: '#f43f5e' },
        amber: { accent: '#f59e0b' },
        indigo: { accent: '#6366f1' },
        teal: { accent: '#14b8a6' },
        slate: { accent: '#64748b' },
      };
      const theme = palette[survey.theme as keyof typeof palette] || palette.default;
      return theme.accent;
    })()
  });
  
  // Debug button theme colors
  console.log('SurveyRenderer - Button Theme Colors:', {
    surveyTheme: survey?.theme,
    primaryButtonColor: themeColors.primary,
    secondaryButtonColor: (() => {
      const palette: Record<string, { secondary: string }> = {
        default: { secondary: '#dbeafe' },
        emerald: { secondary: '#d1fae5' },
        purple: { secondary: '#ede9fe' },
        rose: { secondary: '#ffe4e6' },
        amber: { secondary: '#fef3c7' },
        indigo: { secondary: '#e0e7ff' },
        teal: { secondary: '#ccfbf1' },
        slate: { secondary: '#e2e8f0' },
      };
      const theme = palette[survey.theme as keyof typeof palette] || palette.default;
      return theme.secondary;
    })(),
    expectedColors: {
      rose: { primary: '#e11d48', secondary: '#ffe4e6' },
      purple: { primary: '#7c3aed', secondary: '#ede9fe' },
      emerald: { primary: '#059669', secondary: '#d1fae5' },
      default: { primary: '#2563eb', secondary: '#dbeafe' }
    }
  });

  return (
    <div
      id="survey-root"
      className="min-h-screen py-8"
      style={{
        ...finalStyle,
        minHeight: '100vh',
        width: '100%'
      }}
    >
      <style>
        {` 
        #survey-root { 
          --color-primary: ${themeColors.primary}; 
          --color-secondary: ${(() => {
            const palette: Record<string, { secondary: string }> = {
              default: { secondary: '#dbeafe' },
              emerald: { secondary: '#d1fae5' },
              purple: { secondary: '#ede9fe' },
              rose: { secondary: '#ffe4e6' },
              amber: { secondary: '#fef3c7' },
              indigo: { secondary: '#e0e7ff' },
              teal: { secondary: '#ccfbf1' },
              slate: { secondary: '#e2e8f0' },
            };
            const theme = palette[survey.theme as keyof typeof palette] || palette.default;
            return theme.secondary;
          })()}; 
          --color-accent: ${(() => {
            const palette: Record<string, { accent: string }> = {
              default: { accent: '#3b82f6' },
              emerald: { accent: '#10b981' },
              purple: { accent: '#8b5cf6' },
              rose: { accent: '#f43f5e' },
              amber: { accent: '#f59e0b' },
              indigo: { accent: '#6366f1' },
              teal: { accent: '#14b8a6' },
              slate: { accent: '#64748b' },
            };
            const theme = palette[survey.theme as keyof typeof palette] || palette.default;
            return theme.accent;
          })()}; 
          --color-on-primary: #ffffff; 
          --color-background: ${pageBg || themeColors.backgroundColor};
          --color-text: ${surveyTextColor || themeColors.color};
        }
        
        /* Progress bar removed - no longer needed */
        
        /* Ensure consistent spacing */
        #survey-root .question-container {
          /* No shadows needed - match preview */
        }
        
        /* Force button colors with maximum specificity */
        #survey-root button[data-variant="primary"] {
          background-color: var(--color-primary) !important;
          border-color: var(--color-primary) !important;
          color: var(--color-on-primary) !important;
        }
        
        #survey-root button[data-variant="secondary"] {
          background-color: var(--color-secondary) !important;
          border-color: var(--color-primary) !important;
          color: var(--color-primary) !important;
          border-width: 1px !important;
          border-style: solid !important;
        }
        
        /* Additional button styling to ensure theme colors are applied */
        #survey-root button[data-variant="primary"]:hover {
          background-color: var(--color-primary) !important;
          opacity: 0.9 !important;
        }
        
        #survey-root button[data-variant="secondary"]:hover {
          background-color: var(--color-secondary) !important;
          border-color: var(--color-primary) !important;
          color: var(--color-primary) !important;
        }
        
        /* Override any conflicting button styles */
        #survey-root button[data-variant="primary"],
        #survey-root button[data-variant="secondary"] {
          transition: all 0.15s ease-in-out !important;
        }
        `}
      </style>
      {surveyTextColor && (
        <style>
          {`
          /* Apply text color to survey header */
          #survey-root .survey-header h1,
          #survey-root .survey-header h2,
          #survey-root .survey-header h3,
          #survey-root .survey-header p {
            color: ${surveyTextColor} !important;
          }
          
          /* Apply text color to progress indicators */
          #survey-root .progress-text {
            color: ${surveyTextColor} !important;
          }
          `}
        </style>
      )}
      {survey.backgroundColor && (
        <style>
          {`
          /* Apply survey background color to main container */
          #survey-root {
            background-color: ${survey.backgroundColor} !important;
          }
          
          /* Ensure question containers keep white background */
          #survey-root .question-container {
            background-color: #ffffff !important;
            border: 1px solid #e5e7eb !important;
          }
          `}
        </style>
      )}
      <div className="max-w-2xl mx-auto px-4 relative">

        
        {/* Header */}
        <div className="text-center mb-6 survey-header">
          <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: surveyTextColor }}>
            {survey.title}
          </h2>
          {survey.description && (
            <p className="text-sm md:text-base font-medium opacity-80" style={{ color: surveyTextColor }}>
              {survey.description}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {survey.pages.length > 1 && (
          <div className="mb-6">
            {/* Page Dots Indicator (like preview) */}
            <div className="mt-3 flex items-center justify-center space-x-2">
              {pagesWithKeys.map((page, index) => (
                <div
                  key={page._key}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentPageIndex ? 'bg-current' : 'bg-current opacity-20'
                  }`}
                  style={{ backgroundColor: surveyTextColor || themeColors.color }}
                />
              ))}

            </div>
            <p className="text-xs opacity-70 mt-1 text-center" style={{ color: surveyTextColor }}>
              Page {currentPageIndex + 1} of {survey.pages.length}
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="error" onClose={() => setError(null)} className="mb-6">
            {error}
          </Alert>
        )}

        {/* Questions */}
        <div className="space-y-4 mb-8">
          {visibleQuestions.map((question) => (
            <Card key={question.id} 
                  className="question-container border border-gray-200"
                  data-testid={`question-${question.id}`}
          >
              <div className="p-3">
                <QuestionRenderer
                  question={question}
                  value={responses[question.id]}
                  onChange={(value) => handleQuestionChange(question.id, value)}
                  themeColors={{
                    backgroundColor: '#ffffff',
                    textColor: '#000000',
                    primaryColor: themeColors.primary
                  }}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-6 pt-4 border-t border-gray-300 flex items-center justify-between">
          <div>
            {currentPageIndex > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={goToPreviousPage}
                disabled={submitting}
                data-variant="secondary"
                className={`text-xs ${submitting ? 'opacity-50' : ''}`}
              >
                ← Previous
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {isLastPage ? (
              <Button
                variant="primary"
                size="sm"
                onClick={submitSurvey}
                disabled={submitting}
                data-variant="primary"
                className={`text-xs ${submitting ? 'opacity-50' : ''}`}
              >
                {submitting ? 'Submitting...' : 'Submit Survey'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={goToNextPage}
                disabled={submitting}
                data-variant="primary"
                className={`text-xs ${submitting ? 'opacity-50' : ''}`}
              >
                Next →
              </Button>
            )}
          </div>
        </div>

        {/* Auto-save indicator */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs" style={{ color: surveyTextColor }}>
          {lastSaveTime ? (
            <>Progress auto-saved at {new Date(lastSaveTime).toLocaleTimeString()}</>
          ) : (
            <>Your progress is automatically saved</>
          )}
        </div>
      </div>
    </div>
  );
}
