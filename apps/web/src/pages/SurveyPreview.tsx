import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { evaluateCondition } from '../utils/visibilityHelpers';
import QuestionRenderer from '../components/questions/QuestionRenderer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { fetchSurveyApi } from '../api-paths/surveysApi';

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
  visibilityRules?: BranchingRule[];
  visibleWhen?: BranchingRule[];
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

export default function SurveyPreview() {
  const { slug } = useParams<{ slug: string }>();
  
  // Debug logging for URL handling
 
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [responses, setResponses] = useState<SurveyResponse>({});

  // Helper: extract visibility rules from a question
  const getVisibilityRules = useCallback((question: Question): BranchingRule[] => {
    const settings = (question.settings || {});
    const fromSettings = (settings.visibleWhen || (settings.visibility as any)?.rules) as BranchingRule[] | undefined;
    return (
      question.visibilityRules ||
      question.visibleWhen ||
      fromSettings ||
      []
    ) as BranchingRule[];
  }, []);

  // Helper: check if a question should be visible based on visibility rules
  const isQuestionVisible = useCallback((question: Question): boolean => {
    const rules = getVisibilityRules(question);
    if (!rules?.length) return true;

    // Check if any dependent question has been answered
    const anyDependencyAnswered = rules.some(r => responses[r.questionId] !== undefined);
    if (!anyDependencyAnswered) return false;

    // Evaluate all rules as a single flat list (no groups)
    return rules.reduce((acc, rule, idx) => {
      const resp = responses[rule.questionId];
      const conditionMet = resp !== undefined && evaluateCondition(rule.condition.operator, rule.condition.value, resp);

      if (idx === 0) return conditionMet;

      const prevLogical = (rules[idx - 1].logical as 'AND' | 'OR') ?? 'OR';
      return prevLogical === 'AND' ? acc && conditionMet : acc || conditionMet;
    }, false);
  }, [responses, getVisibilityRules]);

  // Fetch survey data
  const fetchSurvey = useCallback(async () => {
    if (!slug) return;

    try {
      if (slug.startsWith('temp_')) {
        const storageKey = `survey_preview_${slug}`;
        const storedSurvey = sessionStorage.getItem(storageKey);

        if (!storedSurvey) {
          throw new Error(
            'Preview session expired or not found. Please return to the Survey Builder and click "Open Preview" again.'
          );
        }

        const surveyData = JSON.parse(storedSurvey);
        console.log('📋 Loaded preview data:', surveyData);
        setSurvey(surveyData);
        setError(null);
        return;
      }

      // Fetch from API if not preview
      const surveyData = await fetchSurveyApi(slug);
      setSurvey(surveyData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching survey:', err);
      setError(err.message || 'Failed to load survey');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchSurvey();
  }, [fetchSurvey]);

  const handleResponseChange = (questionId: string, value: string | number | boolean | string[] | number[] | Record<string, string>) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const goToNextPage = () => {
    if (currentPageIndex < survey!.pages.length - 1) {
      const nextPage = currentPageIndex + 1;
      setCurrentPageIndex(nextPage);
    }
  };

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      const prevPage = currentPageIndex - 1;
      setCurrentPageIndex(prevPage);
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: survey?.backgroundColor || '#ffffff' }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 border-blue-500"></div>
          <p>Loading survey preview...</p>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: survey?.backgroundColor || '#ffffff' }}
      >
        <div className="text-center">
          <div className="text-6xl mb-4 text-red-500">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Preview Error</h1>
          <p className="mb-4">{error || 'Survey not found'}</p>
          <Button onClick={() => window.close()}>Close Preview</Button>
        </div>
      </div>
    );
  }

  const currentPage = survey.pages[currentPageIndex];
  const visibleQuestions = currentPage?.questions.filter(isQuestionVisible) || [];
  const canGoNext = visibleQuestions.length > 0 && visibleQuestions.every(q => !q.required || responses[q.id]);
  
  const getPageStyle = () => {
    const pageBg = currentPage?.backgroundColor || survey.backgroundColor;
    const pageTextColor = survey.textColor || '#111827';
    return {
      backgroundColor: pageBg || '#ffffff',
      color: pageTextColor,
    } as React.CSSProperties;
  };

  const surveyTextColor = survey.textColor;
  const surveyBackgroundColor = survey.backgroundColor;

  // Helper function to get theme colors for QuestionRenderer - matches inline preview exactly
  const getThemeColorsForQuestions = () => {
    // Questions should have white background and black text
    return {
      backgroundColor: '#ffffff', // Always white background for questions
      textColor: '#000000', // Always black text for questions
      primaryColor: '#000000' // Use black for consistency
    };
  };

  return (
    <div 
      id="survey-preview-root"
      className="min-h-screen py-8 survey-no-dark-mode"
      style={getPageStyle()}
    >
      {/* Survey Container */}
      <div className="max-w-4xl mx-auto px-4 relative">

        
        <div className="rounded-lg overflow-hidden">
          <div className="p-4 md:p-5 survey-content" style={{ backgroundColor: 'transparent', color: survey.textColor || '#111827' }}>
            {/* Add theme CSS - match inline preview exactly */}
            <style>
              {`
                /* Force light mode for preview pages - override dark mode styles */
                .survey-no-dark-mode .question-container {
                  background-color: #ffffff !important;
                  border-color: #e5e7eb !important;
                  color: #000000 !important;
                }
                /* Ensure non-question areas stay transparent */
                #survey-preview-root .survey-header,
                #survey-preview-root .survey-content {
                  background-color: transparent !important;
                  border: none !important;
                }
                
                .survey-no-dark-mode input,
                .survey-no-dark-mode textarea,
                .survey-no-dark-mode select {
                  background-color: #ffffff !important;
                  border-color: #d1d5db !important;
                  color: #000000 !important;
                }
                
              
                
                :root { 
                  --color-primary: ${(() => {
                    const palette: Record<string, { primary: string; secondary: string; accent: string }> = {
                      default: { primary: '#2563eb', secondary: '#dbeafe', accent: '#3b82f6' },
                      emerald: { primary: '#059669', secondary: '#d1fae5', accent: '#10b981' },
                      purple: { primary: '#7c3aed', secondary: '#ede9fe', accent: '#8b5cf6' },
                      rose: { primary: '#e11d48', secondary: '#ffe4e6', accent: '#f43f5e' },
                      amber: { primary: '#d97706', secondary: '#fef3c7', accent: '#f59e0b' },
                      indigo: { primary: '#4f46e5', secondary: '#e0e7ff', accent: '#6366f1' },
                      teal: { primary: '#0d9488', secondary: '#ccfbf1', accent: '#14b8a6' },
                      slate: { primary: '#475569', secondary: '#e2e8f0', accent: '#64748b' },
                    };
                    const theme = palette[survey.theme as keyof typeof palette] || palette.default;
                    return theme.primary;
                  })()}; 
                  --color-secondary: ${(() => {
                    const palette: Record<string, { primary: string; secondary: string; accent: string }> = {
                      default: { primary: '#2563eb', secondary: '#dbeafe', accent: '#3b82f6' },
                      emerald: { primary: '#059669', secondary: '#d1fae5', accent: '#10b981' },
                      purple: { primary: '#7c3aed', secondary: '#ede9fe', accent: '#8b5cf6' },
                      rose: { primary: '#e11d48', secondary: '#ffe4e6', accent: '#f43f5e' },
                      amber: { primary: '#d97706', secondary: '#fef3c7', accent: '#f59e0b' },
                      indigo: { primary: '#4f46e5', secondary: '#e0e7ff', accent: '#6366f1' },
                      teal: { primary: '#0d9488', secondary: '#ccfbf1', accent: '#14b8a6' },
                      slate: { primary: '#475569', secondary: '#e2e8f0', accent: '#64748b' },
                    };
                    const theme = palette[survey.theme as keyof typeof palette] || palette.default;
                    return theme.secondary;
                  })()}; 
                  --color-accent: ${(() => {
                    const palette: Record<string, { primary: string; secondary: string; accent: string }> = {
                      default: { primary: '#2563eb', secondary: '#dbeafe', accent: '#3b82f6' },
                      emerald: { primary: '#059669', secondary: '#d1fae5', accent: '#10b981' },
                      purple: { primary: '#7c3aed', secondary: '#ede9fe', accent: '#8b5cf6' },
                      rose: { primary: '#e11d48', secondary: '#ffe4e6', accent: '#f43f5e' },
                      amber: { primary: '#d97706', secondary: '#fef3c7', accent: '#f59e0b' },
                      indigo: { primary: '#4f46e5', secondary: '#e0e7ff', accent: '#6366f1' },
                      teal: { primary: '#0d9488', secondary: '#ccfbf1', accent: '#14b8a6' },
                      slate: { primary: '#475569', secondary: '#e2e8f0', accent: '#64748b' },
                    };
                    const theme = palette[survey.theme as keyof typeof palette] || palette.default;
                    return theme.accent;
                  })()}; 
                  --color-accent-hover: ${(() => {
                    const palette: Record<string, { primary: string; secondary: string; accent: string }> = {
                      default: { primary: '#1d4ed8', secondary: '#bfdbfe', accent: '#2563eb' },
                      emerald: { primary: '#047857', secondary: '#a7f3d0', accent: '#059669' },
                      purple: { primary: '#6d28d9', secondary: '#ddd6fe', accent: '#7c3aed' },
                      rose: { primary: '#be185d', secondary: '#fecdd3', accent: '#e11d48' },
                      amber: { primary: '#b45309', secondary: '#fde68a', accent: '#d97706' },
                      indigo: { primary: '#4338ca', secondary: '#c7d2fe', accent: '#4f46e5' },
                      teal: { primary: '#0f766e', secondary: '#99f6e4', accent: '#0d9488' },
                      slate: { primary: '#334155', secondary: '#cbd5e1', accent: '#475569' },
                    };
                    const theme = palette[survey.theme as keyof typeof palette] || palette.default;
                    return theme.primary; // Use primary for hover (darker shade)
                  })()}; 
                  --color-on-primary: #ffffff; 
                }
                `}
            </style>
            {surveyTextColor && (
              <style>
                {`
                /* Apply text color to survey header */
                #survey-preview-root .survey-header h1,
                #survey-preview-root .survey-header h2,
                #survey-preview-root .survey-header h3,
                #survey-preview-root .survey-header p {
                  color: ${surveyTextColor} !important;
                }
                
                /* Apply text color to progress indicators */
                #survey-preview-root .progress-text {
                  color: ${surveyTextColor} !important;
                }
                `}
              </style>
            )}
            {surveyBackgroundColor && (
              <style>
                {`
                /* Apply survey background color to main container */
                #survey-preview-root {
                  background-color: ${surveyBackgroundColor} !important;
                }
                
                /* Ensure question containers keep white background */
                #survey-preview-root .question-container {
                  background-color: #ffffff !important;
                  border: 1px solid #e5e7eb !important;
                }
                `}
              </style>
            )}
            
            {/* Survey Header */}
            <div className="text-center mb-6 survey-header" style={{ color: surveyTextColor || '#111827' }}>
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                {survey.title || 'Untitled Survey'}
              </h2>
              {survey.description && (
                <p className="text-sm md:text-base font-medium opacity-80">
                  {survey.description}
                </p>
              )}
              
              {/* Page Progress */}
              <div className="mt-3 flex items-center justify-center space-x-2">
                {survey.pages.map((page, index) => (
                  <div
                    key={page.questions.map(q => q.id).join('-') || `page-${index}`}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentPageIndex
                        ? 'bg-current'
                        : 'bg-current opacity-20'
                    }`}
                    style={{ backgroundColor: surveyTextColor || '#111827' }}
                  />
                ))}
              </div>
              <p className="text-xs opacity-70 mt-1 progress-text" style={{ color: surveyTextColor || '#111827' }}>
                Page {currentPageIndex + 1} of {survey.pages.length}
              </p>
            </div>

            {/* Questions */}
            {visibleQuestions.length === 0 ? (
              <Card className="question-card border border-gray-200" backgroundColor="#ffffff">
                <div className="text-center py-8 text-black">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-base font-medium mb-1 text-black">No Visible Questions</p>
                  <p className="text-xs text-gray-600">
                    {currentPage?.questions.length === 0 
                      ? 'This page has no questions yet'
                      : 'All questions on this page are hidden by visibility rules'
                    }
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {visibleQuestions.map((question) => (
                  <Card key={question.id} className="question-card border border-gray-200" backgroundColor="#ffffff">
                    <div className="p-3">
                      <QuestionRenderer
                        question={question}
                        value={responses[question.id]}
                        onChange={(value) => handleResponseChange(question.id, value)}
                        disabled={false}
                        themeColors={getThemeColorsForQuestions()}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="mt-6 pt-4 border-t border-gray-300 flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPageIndex === 0}
                className={`text-xs ${currentPageIndex === 0 ? 'opacity-50' : ''}`}
              >
                ← Previous
              </Button>
              
              <div className="flex items-center space-x-2">
                {currentPageIndex < survey.pages.length - 1 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={!canGoNext}
                    className={`text-xs ${canGoNext ? '' : 'opacity-50'}`}
                  >
                    Next →
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!canGoNext}
                    className={`text-xs ${canGoNext ? '' : 'opacity-50'}`}
                  >
                    Preview Complete
                  </Button>
                )}
              </div>
            </div>

            {/* Preview Info */}
            <div className="mt-3 flex items-center justify-center gap-2 text-xs" style={{ color: survey.textColor || '#111827' }}>
              Preview Mode - Responses are not saved to database
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
