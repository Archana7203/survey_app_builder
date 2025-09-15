import { useState, useCallback, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import QuestionRenderer, { type QuestionProps as RendererQuestionProps } from '../questions/QuestionRenderer';

interface BranchingRule {
  questionId: string;
  condition: {
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: string | number | boolean;
  };
  action: {
    type: 'skip_to_page' | 'end_survey';
    targetPageIndex?: number;
  };
  logical?: 'AND' | 'OR';
  groupIndex?: number;
}

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
  settings?: Record<string, unknown> & {
    visibleWhen?: BranchingRule[];
    visibilityRules?: BranchingRule[];
  };
  visibleWhen?: BranchingRule[];
  visibilityRules?: BranchingRule[];
}

interface SurveyPage {
  questions: Question[];
  backgroundColor?: string;
}

interface Survey {
  id: string;
  title: string;
  description?: string;
  theme?: string;
  pages: SurveyPage[];
  backgroundColor?: string;
  textColor?: string;
  slug?: string;
}

interface PreviewAreaProps {
  survey: Survey;
  previewResponses: Record<string, RendererQuestionProps['value'] | undefined>;
  onPreviewResponseChange: (questionId: string, value: RendererQuestionProps['value'] | undefined) => void;
  activePageIndex?: number;
}

export default function PreviewArea({
  survey,
  previewResponses,
  onPreviewResponseChange,
  activePageIndex = 0,
}: PreviewAreaProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [currentPageIndex, setCurrentPageIndex] = useState(activePageIndex);
  const [previewResponsesState, setPreviewResponsesState] = useState<Record<string, RendererQuestionProps['value'] | undefined>>({});
  const [pagesVisited, setPagesVisited] = useState<number[]>([activePageIndex]);

  // Initialize preview responses from parent
  useEffect(() => {
    setPreviewResponsesState(previewResponses);
  }, [previewResponses]);

  // Sync starting page with builder but allow independent navigation afterward
  useEffect(() => {
    setCurrentPageIndex(activePageIndex);
    setPagesVisited([activePageIndex]);
  }, [activePageIndex]);

  // Helper: extract visibility rules from a question
  const getVisibilityRules = useCallback((question: Question): BranchingRule[] => {
    const settings = (question.settings || {}) as Record<string, unknown>;
    const fromSettings = (settings.visibleWhen || (settings.visibility as any)?.rules) as BranchingRule[] | undefined;
    return (
      question.visibilityRules ||
      question.visibleWhen ||
      fromSettings ||
      []
    );
  }, []);

  // Helper: evaluate a single condition against a response value
  const evaluateCondition = (operator: BranchingRule['condition']['operator'], condValue: any, responseValue: any): boolean => {
    switch (operator) {
      case 'equals': {
        const respIsNumber = typeof responseValue === 'number';
        const condAsNumber = Number(condValue);
        if (respIsNumber || !Number.isNaN(condAsNumber)) {
          return Number(responseValue) === Number(condValue);
        }
        return String(responseValue) === String(condValue);
      }
      case 'contains': {
        if (Array.isArray(responseValue)) {
          return responseValue.map(v => String(v).toLowerCase()).includes(String(condValue).toLowerCase());
        }
        return String(responseValue).toLowerCase().includes(String(condValue).toLowerCase());
      }
      case 'greater_than':
        return Number(responseValue) > Number(condValue);
      case 'less_than':
        return Number(responseValue) < Number(condValue);
      default:
        return false;
    }
  };

  // Helper: is a question visible under current responses?
  const isQuestionVisible = useCallback((question: Question): boolean => {
    const rules = getVisibilityRules(question);
    if (!rules || rules.length === 0) return true; // default visible when no rules

    // Group rules by groupIndex
    const byGroup: Record<number, BranchingRule[]> = {};
    for (const rule of rules) {
      const gi = rule.groupIndex ?? 0;
      if (!byGroup[gi]) byGroup[gi] = [];
      byGroup[gi].push(rule);
    }
    const orderedGroups = Object.keys(byGroup).map(n => Number(n)).sort((a, b) => a - b);

    // A question is visible if ANY group evaluates to true
    for (const gi of orderedGroups) {
      const groupRules = byGroup[gi];
      let combined: boolean | null = null;

      for (let idx = 0; idx < groupRules.length; idx++) {
        const r = groupRules[idx];
        const resp = previewResponsesState[r.questionId];
        const conditionMet = resp !== undefined && evaluateCondition(r.condition.operator, r.condition.value, resp);

        if (combined === null) {
          combined = conditionMet;
        } else {
          const prevRule = groupRules[idx - 1];
          const prevLogical = prevRule.logical ?? 'OR';
          combined = prevLogical === 'AND' ? (combined && conditionMet) : (combined || conditionMet);
        }
      }

      if (combined) return true;
    }

    return false;
  }, [getVisibilityRules, previewResponsesState]);

  // Get visible questions for current page
  const getVisibleQuestions = useCallback((page: SurveyPage): Question[] => {
    return page.questions.filter(isQuestionVisible);
  }, [isQuestionVisible]);

  // Handle response change and check for branching
  const handleResponseChange = useCallback((questionId: string, value: RendererQuestionProps['value'] | undefined) => {
    const newResponses = { ...previewResponsesState, [questionId]: value };
    setPreviewResponsesState(newResponses);
    try { onPreviewResponseChange(questionId, value); } catch (err) { console.error('Callback error'); }

    // Check for branching rules
    const pageData = survey.pages[currentPageIndex];
    const question = pageData?.questions.find(q => q.id === questionId);
    if (question) {
      const rules = getVisibilityRules(question);
      for (const rule of rules) {
        if (rule.questionId === questionId) {
          const conditionMet = value !== undefined && evaluateCondition(rule.condition.operator, rule.condition.value, value);
          if (conditionMet) {
            if (rule.action.type === 'skip_to_page' && rule.action.targetPageIndex !== undefined) {
              const target = Math.min(Math.max(0, rule.action.targetPageIndex), survey.pages.length - 1);
              setCurrentPageIndex(target);
              setPagesVisited(prev => [...prev, target]);
              return;
            }
            if (rule.action.type === 'end_survey') {
              setCurrentPageIndex(survey.pages.length - 1);
              setPagesVisited(prev => [...prev, survey.pages.length - 1]);
              return;
            }
          }
        }
      }
    }
  }, [previewResponsesState, onPreviewResponseChange, currentPageIndex, survey.pages, getVisibilityRules, evaluateCondition]);

  // Navigation functions
  const goToNextPage = useCallback(() => {
    if (currentPageIndex < survey.pages.length - 1) {
      const nextPage = currentPageIndex + 1;
      setCurrentPageIndex(nextPage);
      setPagesVisited(prev => [...prev, nextPage]);
    }
  }, [currentPageIndex, survey.pages.length]);

  const goToPreviousPage = useCallback(() => {
    if (currentPageIndex > 0) {
      const prevPage = currentPageIndex - 1;
      setCurrentPageIndex(prevPage);
      setPagesVisited(prev => [...prev, prevPage]);
    }
  }, [currentPageIndex]);

  const resetPreview = useCallback(() => {
    setCurrentPageIndex(activePageIndex);
    setPagesVisited([activePageIndex]);
    setPreviewResponsesState({});
    // Reset parent responses too
    Object.keys(previewResponsesState).forEach(key => {
      try { onPreviewResponseChange(key, undefined); } catch (err) { console.error('Callback error'); }
    });
  }, [previewResponsesState, onPreviewResponseChange, activePageIndex]);

  // Open preview in new tab
  const openInNewTab = useCallback(() => {
    // Clean up old preview data (older than 1 hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('survey_preview_temp_')) {
        try {
          const timestamp = parseInt(key.split('_')[2]);
          if (timestamp && timestamp < oneHourAgo) {
            sessionStorage.removeItem(key);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });

    // Always create a temporary preview ID to ensure we show unsaved changes
    const previewId = `temp_${Date.now()}`;

    // Persist the current survey draft to sessionStorage so the preview tab
    // can load unsaved changes (theme/colors/pages/questions)
    try {
      const storageKey = `survey_preview_${previewId}`;
      sessionStorage.setItem(storageKey, JSON.stringify(survey));
      console.log('📋 Preview data stored with key:', storageKey);
    } catch (err) {
      console.warn('Failed to store survey preview payload:', err);
    }

    // Construct the preview URL
    const surveyUrl = `${window.location.origin}/preview/${previewId}`;
    
    try {
      const newWindow = window.open(surveyUrl, '_blank');
      if (!newWindow) {
        alert('Popup blocked! Please allow popups for this site and try again.');
      }
    } catch (error) {
      console.error('Error opening survey preview in new tab:', error);
      alert('Failed to open survey preview in new tab. Please try again.');
    }
  }, [survey]);

  const getThemeStyle = () => {
    // Global background color for entire survey page
    const pageBg = currentPageData.backgroundColor || survey.backgroundColor;

    return {
      backgroundColor: pageBg || '#ffffff', // Default to white if no color set
    } as React.CSSProperties;
  };

  // Helper function to get theme colors for QuestionRenderer
  const getThemeColorsForQuestions = () => {
    // Questions should have white background and black text
    return {
      backgroundColor: '#ffffff', // Always white background for questions
      textColor: '#000000', // Always black text for questions
      primaryColor: '#000000' // Use black for consistency
    };
  };

  const currentPageData = survey.pages[currentPageIndex] || { questions: [], backgroundColor: undefined };
  const visibleQuestions = getVisibleQuestions(currentPageData);
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === survey.pages.length - 1;
  const canGoNext = visibleQuestions.length > 0 && visibleQuestions.every(q => !q.required || previewResponsesState[q.id]);

  return (
    <div id="builder-preview-root" className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Survey Preview
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Test your survey with visibility rules and branching
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Open in New Tab Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={openInNewTab}
              className="text-xs px-2 py-1"
              title="Open survey preview in new tab"
            >
              Open Preview
            </Button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('desktop')}
                className={`
                  px-2 py-1 text-xs font-medium rounded-md transition-colors
                  ${viewMode === 'desktop'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                💻
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`
                  px-2 py-1 text-xs font-medium rounded-md transition-colors
                  ${viewMode === 'mobile'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                📱
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <div 
          className={`mx-auto transition-all duration-300 ${
            viewMode === 'mobile' ? 'max-w-sm' : 'max-w-4xl'
          }`}
        >
          {/* Survey Container */}
          <div
            className="rounded-lg shadow-md overflow-hidden"
            style={getThemeStyle()}
          >
            {/* Add theme CSS for buttons */}
            <style>
              {`
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
            
            <div className="p-4 md:p-5 survey-preview-content">
              {/* Survey Header */}
              <div className="text-center mb-6" style={{ color: survey.textColor || '#111827' }}>
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
                  {survey.pages.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentPageIndex
                          ? 'bg-current'
                          : pagesVisited.includes(index)
                          ? 'bg-current opacity-40'
                          : 'bg-current opacity-20'
                      }`}
                      style={{ backgroundColor: survey.textColor || '#111827' }}
                    />
                  ))}
                </div>
                <p className="text-xs opacity-70 mt-1" style={{ color: survey.textColor || '#111827' }}>
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
                      {currentPageData.questions.length === 0 
                        ? 'This page has no questions yet'
                        : 'All questions on this page are hidden by visibility rules'
                      }
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {visibleQuestions.map((question) => (
                    <Card
                      key={question.id}
                      className="question-card border border-gray-200"
                      backgroundColor="#ffffff"
                    >
                      <div className="p-3">
                        <QuestionRenderer
                          question={question}
                          value={previewResponsesState[question.id]}
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
                  disabled={isFirstPage}
                  className={`text-xs ${isFirstPage ? 'opacity-50' : ''}`}
                >
                  ← Previous
                </Button>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={resetPreview}
                    className="text-xs"
                  >
                    Reset
                  </Button>
                  
                  {!isLastPage && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={!canGoNext}
                      className={`text-xs ${!canGoNext ? 'opacity-50' : ''}`}
                    >
                      Next →
                    </Button>
                  )}
                  
                  {isLastPage && (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!canGoNext}
                      className={`text-xs ${!canGoNext ? 'opacity-50' : ''}`}
                    >
                      Submit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>



          {/* Preview Info */}
          <div className="mt-3 flex items-center justify-center gap-2 text-sm" style={{ color: survey.textColor || '#111827' }}>
            Interactive Preview
            {viewMode === 'mobile' && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                Mobile View
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}