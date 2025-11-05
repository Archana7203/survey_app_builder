import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuestionRenderer from '../components/questions/QuestionRenderer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
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
  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(30000);
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
      if (Array.isArray(response) && response.length === 0) {
        return false;
      }
    }
    
    return true;
  };

  // Helper: check if a page has visible questions
  const hasVisibleQuestions = useCallback((pageIndex: number): boolean => {
    if (!survey || pageIndex < 0 || pageIndex >= survey.pages.length) return false;
    const page = survey.pages[pageIndex];
    return page.questions.some(q => isQuestionVisible(q));
  }, [survey, isQuestionVisible]);

  // Helper: find next page with visible questions (skips empty pages)
  const getNextPageWithQuestions = useCallback((): number | null => {
    if (!survey) return null;
    
    for (let i = currentPageIndex + 1; i < survey.pages.length; i++) {
      if (hasVisibleQuestions(i)) {
        return i;
      }
    }
    
    return null; // No more pages with questions
  }, [survey, currentPageIndex, hasVisibleQuestions]);

  // Helper: find previous page with visible questions (skips empty pages)
  const getPreviousPageWithQuestions = useCallback((): number | null => {
    if (!survey) return null;
    
    for (let i = currentPageIndex - 1; i >= 0; i--) {
      if (hasVisibleQuestions(i)) {
        return i;
      }
    }
    
    return null; // No previous pages with questions
  }, [survey, currentPageIndex, hasVisibleQuestions]);

  // Auto-skip empty pages when navigating to them (e.g., from state restoration)
  useEffect(() => {
    if (!survey || loading || submitting) return;
    
    const currentPage = survey.pages[currentPageIndex];
    if (!currentPage) return;
    
    const hasVisible = currentPage.questions.some(q => isQuestionVisible(q));
    
    if (!hasVisible) {
      // Current page has no visible questions, try to skip forward
      const nextPageIndex = getNextPageWithQuestions();
      
      if (nextPageIndex !== null) {
        // Skip to next page with questions
        setCurrentPageIndex(nextPageIndex);
        setPagesVisited(prev => [...new Set([...prev, nextPageIndex])]);
      }
      // If no next page with questions exists, stay on current page
      // User can manually submit if needed
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [survey, currentPageIndex, responses, loading, submitting, isQuestionVisible, getNextPageWithQuestions]);

  const goToNextPage = () => {
    if (!validateCurrentPage()) {
      setError('Please answer all required questions before continuing.');
      return;
    }
    
    setError(null);
    const nextPageIndex = getNextPageWithQuestions();
    
    if (nextPageIndex === null) {
      // No more pages with questions - end of survey
      submitSurvey();
    } else {
      setCurrentPageIndex(nextPageIndex);
      setPagesVisited(prev => [...new Set([...prev, nextPageIndex])]);
    }
  };

  const goToPreviousPage = () => {
    const previousPageIndex = getPreviousPageWithQuestions();
    
    if (previousPageIndex !== null) {
      setCurrentPageIndex(previousPageIndex);
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
      console.error('Auto-save error:', error);
      throw error;
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

  if (!survey) {
    // Show error if survey failed to load
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
          <div className="max-w-md w-full mx-4 rounded-lg border border-gray-200 bg-white shadow">
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
          </div>
        </div>
      );
    }
    return null;
  }

  const currentPage = survey.pages[currentPageIndex];
  // Check if there's a next page with visible questions (not just the last page index)
  const hasNextPageWithQuestions = getNextPageWithQuestions() !== null;

  // Get theme colors
  const getThemeColors = () => {
    const palette: Record<string, { primary: string }> = {
      default: { primary: '#2563eb' },
      emerald: { primary: '#059669' },
      purple: { primary: '#7c3aed' },
      rose: { primary: '#e11d48' },
      amber: { primary: '#d97706' },
      indigo: { primary: '#4f46e5' },
      teal: { primary: '#0d9488' },
      slate: { primary: '#475569' },
    };
    
    const theme = palette[survey.theme as keyof typeof palette] || palette.default;
    return { primary: theme.primary };
  };
  
  const themeColors = getThemeColors();
  const visibleQuestions = currentPage.questions.filter(q => isQuestionVisible(q));
  const surveyTextColor = survey.textColor;

  const getPageStyle = () => {
    const pageBg = currentPage.backgroundColor || survey.backgroundColor;
    const pageTextColor = survey.textColor || '#111827';
    return {
      backgroundColor: pageBg || '#ffffff',
      color: pageTextColor,
    } as React.CSSProperties;
  };

  return (
    <div 
      id="survey-root"
      className="min-h-screen py-8 survey-no-dark-mode"
      style={getPageStyle()}
    >
      {/* Survey Container */}
      <div className="max-w-4xl mx-auto px-4 relative">
        
        <div className="rounded-lg overflow-hidden">
          <div className="p-4 md:p-5 survey-content" style={{ backgroundColor: 'transparent', color: survey.textColor || '#111827' }}>
            {/* Add theme CSS - match preview exactly */}
            <style>
              {`
                /* Force light mode for survey pages - override dark mode styles */
                .survey-no-dark-mode .question-container {
                  background-color: #ffffff !important;
                  border-color: #e5e7eb !important;
                  color: #000000 !important;
                }
                /* Ensure non-question areas stay transparent */
                #survey-root .survey-header,
                #survey-root .survey-content {
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
              {survey.pages.length > 1 && (
                <>
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
                </>
              )}
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="mb-6 p-4 rounded-lg border border-red-300 bg-red-50">
                <div className="flex items-center">
                  <div className="text-red-600 mr-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

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
                        onChange={(value) => handleQuestionChange(question.id, value)}
                        disabled={false}
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
            )}

            {/* Navigation */}
            <div className="mt-6 pt-4 border-t border-gray-300 flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={goToPreviousPage}
                disabled={getPreviousPageWithQuestions() === null || submitting}
                className={`text-xs ${getPreviousPageWithQuestions() === null || submitting ? 'opacity-50' : ''}`}
              >
                ← Previous
              </Button>
              
              <div className="flex items-center space-x-2">
                {!hasNextPageWithQuestions ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={submitSurvey}
                    disabled={submitting}
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
                    className={`text-xs ${submitting ? 'opacity-50' : ''}`}
                  >
                    Next →
                  </Button>
                )}
              </div>
            </div>

            {/* Auto-save indicator */}
            <div className="mt-3 flex items-center justify-center gap-2 text-xs" style={{ color: survey.textColor || '#111827' }}>
              {lastSaveTime ? (
                <>Progress auto-saved at {new Date(lastSaveTime).toLocaleTimeString()}</>
              ) : (
                <>Your progress is automatically saved</>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
