import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../utils/apiConfig';
import { DndContext, DragOverlay, closestCenter, PointerSensor, KeyboardSensor, useSensors, useSensor } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Tabs from '../../components/ui/Tabs';
import Alert from '../../components/ui/Alert';
import ReorderableQuestions from '../../components/survey/ReorderableQuestions';
import VisibilityRulesModal from '../../components/modals/VisibilityRulesModal';
import AddQuestionModal from '../../components/modals/AddQuestionModal';
import ThemePicker from '../../components/ui/ThemePicker';
import RespondentProgress from '../../components/dashboard/RespondentProgress';
import ComponentLibraryPanel from '../../components/survey/ComponentLibraryPanel';
import { SurveyThemeProvider, useSurveyTheme } from '../../contexts/SurveyThemeContext';
import PreviewArea from '../../components/survey/PreviewArea';

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
    maxRating?: number;
    scaleMin?: number;
    scaleMax?: number;
    scaleStep?: number;
  };
}

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
}

interface SurveyPage {
  questions: Question[];
  branching: BranchingRule[];
  backgroundColor?: string;
}

interface Survey {
  id: string;
  title: string;
  description?: string;
  theme?: string;
  pages: SurveyPage[];
  slug?: string;
  backgroundColor?: string;
  textColor?: string;
  locked?: boolean;
  status?: 'draft' | 'published' | 'closed';
}

interface SurveyBuilderProps {
  viewMode?: boolean;
}

export default function SurveyBuilder({ viewMode = false }: SurveyBuilderProps) {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [previewResponses, setPreviewResponses] = useState<Record<string, unknown>>({});
  const [activeTab, setActiveTab] = useState('general');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Helper variables - with additional safety checks
  const currentPage = survey?.pages?.[activePageIndex] || { questions: [], branching: [] };

  const fetchSurvey = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl(`/api/surveys/${surveyId}`), {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSurvey(data);
      } else {
        setError('Failed to fetch survey');
      }
    } catch (error) {
      console.error('Error fetching survey:', error);
      setError('Error loading survey');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    if (surveyId) {
      fetchSurvey();
    } else {
      // Create new survey
      const newSurvey: Survey = {
        id: 'new',
        title: 'New Survey',
        description: '',
        pages: [{ questions: [], branching: [] }],
      };
      setSurvey(newSurvey);
      setLoading(false);
    }
  }, [surveyId, fetchSurvey]);

  // Ensure survey pages are always properly initialized
  useEffect(() => {
    if (survey && (!survey.pages || survey.pages.length === 0)) {
      setSurvey({
        ...survey,
        pages: [{ questions: [], branching: [] }]
      });
    }
  }, [survey]);

  // Ensure activePageIndex is valid
  useEffect(() => {
    if (survey?.pages && activePageIndex >= survey.pages.length) {
      setActivePageIndex(Math.max(0, survey.pages.length - 1));
    }
  }, [survey?.pages, activePageIndex]);

  const saveSurvey = async () => {
    if (!survey) return;

    setSaving(true);
    try {
      const url = survey.id === 'new' ? buildApiUrl('/api/surveys') : buildApiUrl(`/api/surveys/${survey.id}`);
      const method = survey.id === 'new' ? 'POST' : 'PUT';
      
      // Ensure pages array is properly initialized
      const pages = survey.pages && Array.isArray(survey.pages) && survey.pages.length > 0 
        ? survey.pages 
        : [{ questions: [], branching: [] }];
      
      const surveyData = {
        title: survey.title,
        description: survey.description,
        theme: survey.theme,
        backgroundColor: survey.backgroundColor,
        textColor: survey.textColor,
        pages: pages,
      };
      
      // Validate survey data before sending
      if (!surveyData.title || surveyData.title.trim() === '') {
        setError('Survey title is required');
        setSaving(false);
        return;
      }
      
      // Validate pages structure
      if (!Array.isArray(surveyData.pages)) {
        setError('Invalid pages data structure');
        setSaving(false);
        return;
      }
      
      // Check for any invalid data in pages
      for (let i = 0; i < surveyData.pages.length; i++) {
        const page = surveyData.pages[i];
        if (!page || typeof page !== 'object') {
          setError(`Invalid page data at index ${i}`);
          setSaving(false);
          return;
        }
        
        if (!Array.isArray(page.questions)) {
          setError(`Invalid questions array at page ${i + 1}`);
          setSaving(false);
          return;
        }
        
        if (!Array.isArray(page.branching)) {
          setError(`Invalid branching array at page ${i + 1}`);
          setSaving(false);
          return;
        }
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(surveyData),
      });

      if (response.ok) {
        const savedSurvey = await response.json();
        
        // Preserve the original survey ID if it's an existing survey
        const updatedSurvey = survey.id === 'new' ? savedSurvey : { ...savedSurvey, id: survey.id };
        
        setSurvey(updatedSurvey);
        if (survey.id === 'new') {
          navigate(`/dashboard/surveys/${savedSurvey.id}/edit`, { replace: true });
        }
      } else {
        let message = `Failed to save survey (${response.status})`;
        try {
          const data = await response.json();
          if (data?.error) message = data.error;
        } catch {
          // ignore JSON parse errors
        }
        if (response.status === 401) {
          message = 'Please log in to save surveys.';
        }
        setError(message);
      }
    } catch (error) {
      console.error('Save survey error:', error);
      setError(`Error saving survey: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const addPage = () => {
    if (!survey || !survey.pages) return;
    
    setSurvey({
      ...survey,
      pages: [...survey.pages, { questions: [], branching: [] }],
    });
  };

  const deletePage = (pageIndex: number) => {
    if (!survey || !survey.pages || survey.pages.length <= 1) return;
    
    setSurvey({
      ...survey,
      pages: survey.pages.filter((_, index) => index !== pageIndex),
    });
    
    if (activePageIndex >= survey.pages.length - 1) {
      setActivePageIndex(Math.max(0, survey.pages.length - 2));
    }
  };

  const addQuestion = (question: Question) => {
    if (!survey || !survey.pages) return;
    
    const updatedPages = [...survey.pages];
    updatedPages[activePageIndex] = {
      ...updatedPages[activePageIndex],
      questions: [...updatedPages[activePageIndex].questions, question],
    };
    
    setSurvey({
      ...survey,
      pages: updatedPages,
    });
  };

  const updateQuestion = (updatedQuestion: Question) => {
    if (!survey || !survey.pages) return;
    
    const updatedPages = [...survey.pages];
    const questionIndex = updatedPages[activePageIndex].questions.findIndex(
      q => q.id === updatedQuestion.id
    );
    
    if (questionIndex !== -1) {
      updatedPages[activePageIndex].questions[questionIndex] = updatedQuestion;
      setSurvey({
        ...survey,
        pages: updatedPages,
      });
    }
  };

  const deleteQuestion = (questionId: string) => {
    if (!survey) return;
    const updatedPages = [...survey.pages];
    updatedPages[activePageIndex] = {
      ...updatedPages[activePageIndex],
      questions: updatedPages[activePageIndex].questions.filter(q => q.id !== questionId)
    };
    setSurvey({ ...survey, pages: updatedPages });
  };

  const handleEditVisibility = (questionId: string) => {
    if (!survey?.pages) return;
    const question = survey.pages[activePageIndex]?.questions.find(q => q.id === questionId);
    if (question) {
      setSelectedQuestion(question);
      setIsVisibilityModalOpen(true);
    }
  };

  const handleDragStart = (event: DragEndEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    
    // Case 1: Dragging from the library to add a new question
    if (active.data.current?.type === 'question') {
      const questionType = active.data.current.questionType as any;

      // Map library snake_case types to renderer camelCase types
      const mapType = (t: string): string => {
        switch (t) {
          case 'single_choice': return 'singleChoice';
          case 'multi_choice': return 'multiChoice';
          case 'rating_star': return 'ratingStar';
          case 'rating_smiley': return 'ratingSmiley';
          case 'rating_number': return 'ratingNumber';
          case 'text_short': return 'textShort';
          case 'text_long': return 'textLong';
          default: return t;
        }
      };
      const mappedType = mapType(questionType.type);

      const newQuestion: Question = {
        id: `q_${Date.now()}`,
        type: mappedType,
        title: '',
        description: '',
        required: false,
        options: ['singleChoice', 'multiChoice', 'dropdown'].includes(mappedType) 
          ? [{ id: 'opt_1', text: 'Option 1' }] 
          : undefined,
        settings: mappedType.startsWith('rating') 
          ? { 
              maxRating: mappedType === 'ratingSmiley' ? 5 : 
                         mappedType === 'ratingStar' ? 5 : 10 
            } 
          : mappedType === 'slider'
          ? { scaleMin: 0, scaleMax: 100, scaleStep: 1 }
          : {},
      };
      
      if (!survey) return;
      
      const updatedPages = [...survey.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        questions: [...updatedPages[activePageIndex].questions, newQuestion],
      };
      setSurvey({
        ...survey,
        id: survey.id,
        title: survey.title,
        pages: updatedPages,
      });
      setSelectedQuestion(newQuestion);
      return;
    }

    // Case 2: Reordering within the list
    if (!survey || !over) {
      return;
    }

    const pageQuestions = survey.pages[activePageIndex].questions;
    const activeId = String(active.id);
    const overId = String(over.id);
    const oldIndex = pageQuestions.findIndex(q => q.id === activeId);
    const newIndex = pageQuestions.findIndex(q => q.id === overId);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const reordered = arrayMove(pageQuestions, oldIndex, newIndex);
      const updatedPages = [...survey.pages];
      updatedPages[activePageIndex] = { ...updatedPages[activePageIndex], questions: reordered };
      setSurvey({ ...survey, pages: updatedPages });
    }
  };

  // questionTypes was previously used by the library; current implementation passes inline props directly

  return (
    <SurveyThemeProvider surveyTheme={survey?.theme}>
      <SurveyBuilderContent 
        survey={survey}
        setSurvey={setSurvey}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activePageIndex={activePageIndex}
        setActivePageIndex={setActivePageIndex}
        selectedQuestion={selectedQuestion}
        setSelectedQuestion={setSelectedQuestion}
        previewResponses={previewResponses}
        setPreviewResponses={setPreviewResponses}
        error={error}
        setError={setError}
        loading={loading}
        saving={saving}
        viewMode={viewMode}
        navigate={navigate}
        saveSurvey={saveSurvey}
        addPage={addPage}
        deletePage={deletePage}
        deleteQuestion={deleteQuestion}
        handleDragStart={handleDragStart}
        handleDragEnd={handleDragEnd}
        activeDragId={activeDragId}
        sensors={sensors}
        closestCenter={closestCenter}
        currentPage={currentPage}
        handleEditVisibility={handleEditVisibility}
        isVisibilityModalOpen={isVisibilityModalOpen}
        setIsVisibilityModalOpen={setIsVisibilityModalOpen}
        isAddQuestionModalOpen={isAddQuestionModalOpen}
        setIsAddQuestionModalOpen={setIsAddQuestionModalOpen}
        editingQuestion={editingQuestion}
        setEditingQuestion={setEditingQuestion}
        addQuestion={addQuestion}
        updateQuestion={updateQuestion}
        surveyId={surveyId}
      />
    </SurveyThemeProvider>
  );
}

interface SurveyBuilderContentProps {
  survey: any;
  setSurvey: any;
  activeTab: string;
  setActiveTab: any;
  activePageIndex: number;
  setActivePageIndex: any;
  selectedQuestion: any;
  setSelectedQuestion: any;
  previewResponses: any;
  setPreviewResponses: any;
  error: string | null;
  setError: any;
  loading: boolean;
  saving: boolean;
  viewMode: boolean;
  navigate: any;
  saveSurvey: any;
  addPage: any;
  deletePage: any;
  deleteQuestion: any;
  handleDragStart: any;
  handleDragEnd: any;
  activeDragId: string | null;
  sensors: any;
  closestCenter: any;
  currentPage: any;
  handleEditVisibility: any;
  isVisibilityModalOpen: boolean;
  setIsVisibilityModalOpen: any;
  isAddQuestionModalOpen: boolean;
  setIsAddQuestionModalOpen: any;
  editingQuestion: any;
  setEditingQuestion: any;
  addQuestion: any;
  updateQuestion: any;
  surveyId: string | undefined;
}

function SurveyBuilderContent({
  survey,
  setSurvey,
  activeTab,
  setActiveTab,
  activePageIndex,
  setActivePageIndex,
  selectedQuestion,
  setSelectedQuestion,
  previewResponses,
  setPreviewResponses,
  error,
  setError,
  loading,
  saving,
  viewMode,
  navigate,
  saveSurvey,
  addPage,
  deletePage,
  deleteQuestion,
  handleDragStart,
  handleDragEnd,
  activeDragId,
  sensors,
  closestCenter,
  currentPage,
  handleEditVisibility,
  isVisibilityModalOpen,
  setIsVisibilityModalOpen,
  isAddQuestionModalOpen,
  setIsAddQuestionModalOpen,
  editingQuestion,
  setEditingQuestion,
  addQuestion,
  updateQuestion,
  surveyId
}: SurveyBuilderContentProps) {
  const { setSurveyTheme } = useSurveyTheme();

  // Apply theme when survey theme changes
  useEffect(() => {
    if (survey?.theme) {
      setSurveyTheme(survey.theme);
    }
  }, [survey?.theme, setSurveyTheme]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading survey...</div>
      </div>
    );
  }

  if (!survey || !survey.pages || !Array.isArray(survey.pages)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Failed to load survey or survey data is invalid</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error State */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Locked Survey Banner */}
      {(survey.locked || viewMode) && (
        <Alert variant="info">
          {viewMode ? 'Survey Viewer  Read-only mode' : 'Survey locked after first publish  read-only mode'}
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {viewMode ? 'Survey Viewer' : 'Survey Builder'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {viewMode ? 'View survey configuration and respondent progress' : 'Build and customize your survey'}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => navigate('/dashboard/surveys')}>
            Back to Surveys
          </Button>
          {!survey.locked && !viewMode && (
            <Button variant="primary" onClick={saveSurvey} disabled={saving}>
              {saving ? 'Saving...' : 'Save Survey'}
            </Button>
          )}
        </div>
      </div>

      {/* Survey Details */}
      <Card>
        <div className="p-6">
          <Tabs
            tabs={[
              { id: 'general', label: 'General' },
              { id: 'theme', label: 'Theme' },
              ...((survey.locked || viewMode) ? [{ id: 'progress', label: 'Respondent Progress' }] : []),
            ]}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId)}
          />
          
          <div className="mt-6">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <Input
                  label="Survey Title"
                  value={survey.title}
                  onChange={(e) => setSurvey({ ...survey, title: e.target.value })}
                  placeholder="Enter survey title"
                  disabled={survey.locked || viewMode}
                />
                <Input
                  label="Description (Optional)"
                  value={survey.description || ''}
                  onChange={(e) => setSurvey({ ...survey, description: e.target.value })}
                  placeholder="Describe your survey"
                  disabled={survey.locked || viewMode}
                />

                {/* Global background and theme preview */}
                {!viewMode && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Global Background Color"
                      type="color"
                      value={survey.backgroundColor || '#f9fafb'}
                      onChange={(e) => {
                        const newSurvey = { ...survey, backgroundColor: e.target.value };
                        setSurvey(newSurvey);
                      }}
                    />
                    <Input
                      label="Global Text Color"
                      type="color"
                      value={survey.textColor || '#111827'}
                      onChange={(e) => {
                        const newSurvey = { ...survey, textColor: e.target.value };
                        setSurvey(newSurvey);
                      }}
                    />
                  </div>
                )}
                
              </div>
            )}
            
            {activeTab === 'theme' && (
              <div className="space-y-4">
                <ThemePicker
                  selectedTheme={survey.theme || 'default'}
                  onThemeChange={(themeId) => {
                    setSurvey({ ...survey, theme: themeId });
                  }}
                  disabled={survey.locked || viewMode}
                />
              </div>
            )}
            
            {activeTab === 'progress' && (survey.locked || viewMode) && (
              <div>
                <RespondentProgress surveyId={surveyId || 'new'} />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Page Navigation */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addPage}
                  disabled={survey.locked || viewMode}
                >
                  + Add Page
                </Button>
          {survey.pages.map((_: unknown, index: number) => (
            <button
              key={index}
              onClick={() => setActivePageIndex(index)}
              className={`px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                index === activePageIndex
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                  : 'text-gray-700 hover:ring-1 hover:ring-gray-300 dark:text-gray-300 dark:hover:ring-gray-500'
              }`}
            >
              Page {index + 1}
            </button>
          ))}
                {survey.pages.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePage(activePageIndex)}
                    disabled={survey.locked || viewMode}
                    className="text-red-600 hover:ring-1 hover:ring-red-300 dark:text-red-400 dark:hover:ring-red-500"
                  >
                    Delete Page
                  </Button>
                )}
              </div>
          </div>

      {/* Three Panel Layout */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <div className="grid grid-cols-12 gap-6 h-[600px]">
          {/* Left Panel - Question Library */}
          <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            <div className="p-4">
              <ComponentLibraryPanel
                questionTypes={[
                  { type: 'single_choice', name: 'Single choice', description: 'Single choice question', icon: '◯', category: 'choice' },
                  { type: 'multi_choice', name: 'Checkboxes', description: 'Multiple choice question', icon: '🔲', category: 'choice' },
                  { type: 'dropdown', name: 'Dropdown', description: 'Dropdown selection', icon: '📋', category: 'choice' },
                  { type: 'text_short', name: 'Short text', description: 'Short text input', icon: '✏️', category: 'input' },
                  { type: 'text_long', name: 'Long text', description: 'Long text input', icon: '📝', category: 'input' },
                  { type: 'rating_star', name: 'Star rating', description: 'Star rating question', icon: '🌟', category: 'rating' },
                  { type: 'rating_smiley', name: 'Smiley rating', description: 'Smiley face rating', icon: '😊', category: 'rating' },
                  { type: 'rating_number', name: 'Number rating', description: 'Number rating question', icon: '🔢', category: 'rating' },
                  { type: 'slider', name: 'Slider', description: 'Slider question', icon: '🎯', category: 'rating' },
                ]}
                disabled={survey.locked || viewMode}
              />
            </div>
          </div>

          {/* Center Panel - Canvas Only */}
          <div className="col-span-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Question Order</h2>
              {currentPage.questions.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  Drag and drop questions here to add them to your survey
                </div>
              ) : (
                <ReorderableQuestions
                  questions={currentPage.questions}
                  onDeleteQuestion={deleteQuestion}
                  onSelectQuestion={(question) => setSelectedQuestion(question)}
                  disabled={survey.locked || viewMode}
                />
              )}
            </div>
          </div>

          {/* Right Panel - Question Settings */}
          <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            <div className="p-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Question Settings
            </h2>
              {selectedQuestion ? (
                <div className="space-y-4">
                  <Input
                    label="Question Title"
                    value={selectedQuestion.title}
                    onChange={(e) => {
                      if (!survey) return;
                      const updatedPages = [...survey.pages];
                      const questionIndex = updatedPages[activePageIndex].questions.findIndex(
                        (q: Question) => q.id === selectedQuestion.id
                      );
                      if (questionIndex !== -1) {
                        const updated = { ...selectedQuestion, title: e.target.value };
                        updatedPages[activePageIndex].questions[questionIndex] = updated;
                        setSurvey({
                          ...survey,
                          id: survey.id,
                          title: survey.title,
                          pages: updatedPages,
                        });
                        setSelectedQuestion(updated);
                      }
                    }}
                    placeholder="Enter question"
                    disabled={survey.locked || viewMode}
                  />
                  <Input
                    label="Help Text"
                    value={selectedQuestion.description || ''}
                    onChange={(e) => {
                      if (!survey) return;
                      const updatedPages = [...survey.pages];
                      const questionIndex = updatedPages[activePageIndex].questions.findIndex(
                        (q: Question) => q.id === selectedQuestion.id
                      );
                      if (questionIndex !== -1) {
                        const updated = { ...selectedQuestion, description: e.target.value };
                        updatedPages[activePageIndex].questions[questionIndex] = updated;
                        setSurvey({
                          ...survey,
                          id: survey.id,
                          title: survey.title,
                          pages: updatedPages,
                        });
                        setSelectedQuestion(updated);
                      }
                    }}
                    placeholder="Optional help text"
                    disabled={survey.locked || viewMode}
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedQuestion.required}
                      onChange={(e) => {
                        if (!survey) return;
                        const updatedPages = [...survey.pages];
                        const questionIndex = updatedPages[activePageIndex].questions.findIndex(
                          (q: Question) => q.id === selectedQuestion.id
                        );
                        if (questionIndex !== -1) {
                          const updated = { ...selectedQuestion, required: e.target.checked };
                          updatedPages[activePageIndex].questions[questionIndex] = updated;
                          setSurvey({
                            ...survey,
                            id: survey.id,
                            title: survey.title,
                            pages: updatedPages,
                          });
                          setSelectedQuestion(updated);
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={survey.locked || viewMode}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Required</span>
                  </label>

                  {/* Question Type Specific Settings */}
                  {(selectedQuestion.type === 'singleChoice' || selectedQuestion.type === 'multiChoice' || selectedQuestion.type === 'dropdown') && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Options
                      </label>
                      {selectedQuestion.options?.map((option: { id: string; text: string }, index: number) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <Input
                            value={option.text}
                            onChange={(e) => {
                              if (!survey) return;
                              const updatedPages = [...survey.pages];
                              const questionIndex = updatedPages[activePageIndex].questions.findIndex(
                                (q: Question) => q.id === selectedQuestion.id
                              );
                              if (questionIndex !== -1) {
                                const updatedOptions = [...(selectedQuestion.options || [])];
                                updatedOptions[index] = { ...option, text: e.target.value };
                                const updated = { ...selectedQuestion, options: updatedOptions };
                                updatedPages[activePageIndex].questions[questionIndex] = updated;
                                setSurvey({
                                  ...survey,
                                  id: survey.id,
                                  title: survey.title,
                                  pages: updatedPages,
                                });
                                setSelectedQuestion(updated);
                              }
                            }}
                            placeholder={`Option ${index + 1}`}
                            disabled={survey.locked || viewMode}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!survey) return;
                              const updatedPages = [...survey.pages];
                              const questionIndex = updatedPages[activePageIndex].questions.findIndex(
                                (q: Question) => q.id === selectedQuestion.id
                              );
                              if (questionIndex !== -1) {
                                const updatedOptions = selectedQuestion.options?.filter((o: { id: string }) => o.id !== option.id) || [];
                                const updated = { ...selectedQuestion, options: updatedOptions };
                                updatedPages[activePageIndex].questions[questionIndex] = updated;
                                setSurvey({
                                  ...survey,
                                  id: survey.id,
                                  title: survey.title,
                                  pages: updatedPages,
                                });
                                setSelectedQuestion(updated);
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                            disabled={survey.locked || viewMode}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!survey) return;
                          const updatedPages = [...survey.pages];
                          const questionIndex = updatedPages[activePageIndex].questions.findIndex(
                            (q: Question) => q.id === selectedQuestion.id
                          );
                          if (questionIndex !== -1) {
                            const newOption = { id: Math.random().toString(36).substr(2, 9), text: '' };
                            const updated = {
                              ...selectedQuestion,
                              options: [...(selectedQuestion.options || []), newOption]
                            };
                            updatedPages[activePageIndex].questions[questionIndex] = updated;
                            setSurvey({
                              ...survey,
                              id: survey.id,
                              title: survey.title,
                              pages: updatedPages,
                            });
                            setSelectedQuestion(updated);
                          }
                        }}
                        disabled={survey.locked || viewMode}
                      >
                        + Add Option
                      </Button>
                    </div>
                  )}

                  {/* Rating Type Settings */}
                  {(selectedQuestion.type === 'ratingStar' || selectedQuestion.type === 'ratingSmiley' || selectedQuestion.type === 'ratingNumber') && (
                    <div className="space-y-4">
                      <Input
                        type="number"
                        label="Maximum Rating"
                        value={selectedQuestion.settings?.maxRating || 5}
                        onChange={(e) => {
                          if (!survey) return;
                          const updatedPages = [...survey.pages];
                          const questionIndex = updatedPages[activePageIndex].questions.findIndex(
                            (q: Question) => q.id === selectedQuestion.id
                          );
                          if (questionIndex !== -1) {
                            let maxRating = parseInt(e.target.value);
                            
                            // Enforce limits based on question type
                            if (selectedQuestion.type === 'ratingSmiley') {
                              maxRating = Math.min(Math.max(maxRating, 3), 5); // 3-5 for smileys
                            } else {
                              maxRating = Math.min(Math.max(maxRating, 1), 10); // 1-10 for stars and numbers
                            }
                            
                            const updated = {
                              ...selectedQuestion,
                              settings: { ...selectedQuestion.settings, maxRating }
                            };
                            updatedPages[activePageIndex].questions[questionIndex] = updated;
                            setSurvey({
                              ...survey,
                              id: survey.id,
                              title: survey.title,
                              pages: updatedPages,
                            });
                            setSelectedQuestion(updated);
                          }
                        }}
                        min={selectedQuestion.type === 'ratingSmiley' ? 3 : 1}
                        max={selectedQuestion.type === 'ratingSmiley' ? 5 : 10}
                        disabled={survey.locked || viewMode}
                      />
                    </div>
                  )}

                  {/* Slider Type Settings */}
                  {selectedQuestion.type === 'slider' && (
                    <div className="space-y-4">
                      <Input
                        type="number"
                        label="Minimum Value"
                        value={selectedQuestion.settings?.scaleMin || 0}
                        onChange={(e) => {
                          if (!survey) return;
                          const updatedPages = [...survey.pages];
                          const questionIndex = updatedPages[activePageIndex].questions.findIndex(
                            (q: Question) => q.id === selectedQuestion.id
                          );
                          if (questionIndex !== -1) {
                            const updated = {
                              ...selectedQuestion,
                              settings: { ...selectedQuestion.settings, scaleMin: parseInt(e.target.value) }
                            };
                            updatedPages[activePageIndex].questions[questionIndex] = updated;
                            setSurvey({
                              ...survey,
                              id: survey.id,
                              title: survey.title,
                              pages: updatedPages,
                            });
                            setSelectedQuestion(updated);
                          }
                        }}
                        disabled={survey.locked || viewMode}
                      />
                      <Input
                        type="number"
                        label="Maximum Value"
                        value={selectedQuestion.settings?.scaleMax || 100}
                        onChange={(e) => {
                          if (!survey) return;
                          const updatedPages = [...survey.pages];
                          const questionIndex = updatedPages[activePageIndex].questions.findIndex(
                            (q: Question) => q.id === selectedQuestion.id
                          );
                          if (questionIndex !== -1) {
                            const updated = {
                              ...selectedQuestion,
                              settings: { ...selectedQuestion.settings, scaleMax: parseInt(e.target.value) }
                            };
                            updatedPages[activePageIndex].questions[questionIndex] = updated;
                            setSurvey({
                              ...survey,
                              id: survey.id,
                              title: survey.title,
                              pages: updatedPages,
                            });
                            setSelectedQuestion(updated);
                          }
                        }}
                        disabled={survey.locked || viewMode}
                      />
                      <Input
                        type="number"
                        label="Step Size"
                        value={selectedQuestion.settings?.scaleStep || 1}
                        onChange={(e) => {
                          if (!survey) return;
                          const updatedPages = [...survey.pages];
                          const questionIndex = updatedPages[activePageIndex].questions.findIndex(
                            (q: Question) => q.id === selectedQuestion.id
                          );
                          if (questionIndex !== -1) {
                            const updated = {
                              ...selectedQuestion,
                              settings: { ...selectedQuestion.settings, scaleStep: parseInt(e.target.value) }
                            };
                            updatedPages[activePageIndex].questions[questionIndex] = updated;
                            setSurvey({
                              ...survey,
                              id: survey.id,
                              title: survey.title,
                              pages: updatedPages,
                            });
                            setSelectedQuestion(updated);
                          }
                        }}
                        min={1}
                        disabled={survey.locked || viewMode}
                      />
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditVisibility(selectedQuestion.id)}
                      className="w-full"
                      disabled={survey.locked || viewMode}
                    >
                      Configure Visibility Rules
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Select a question to configure its settings
                </div>
              )}
            </div>
          </div>
        </div>
        <DragOverlay>
          {activeDragId ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-lg">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                New Question
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Preview Section (Standalone below layout) */}
      <Card className="mt-6">
        <div className="p-0">
          <div className="h-[600px] w-full bg-white light">
            {/* Compact interactive preview with visibility rules - No dark mode */}
            <PreviewArea
              survey={survey}
              previewResponses={previewResponses}
              onPreviewResponseChange={(questionId, value) => 
                setPreviewResponses((prev: Record<string, unknown>) => ({ ...prev, [questionId]: value }))
              }
              activePageIndex={activePageIndex}
            />
          </div>
        </div>
      </Card>

      {/* Modals */}
      {!viewMode && (
        <>
          <VisibilityRulesModal
            isOpen={isVisibilityModalOpen}
            onClose={() => {
              setIsVisibilityModalOpen(false);
              setSelectedQuestion(null);
            }}
            question={selectedQuestion as any}
            candidateQuestions={(function() {
              if (!selectedQuestion) return [] as any[];
              const candidates: Question[] = [] as any;
              // All questions from pages before the current one
              for (let p = 0; p < activePageIndex; p++) {
                candidates.push(...(survey.pages[p].questions as any));
              }
              // Questions earlier on the current page than the selected question
              const currentQs = survey.pages[activePageIndex].questions;
              const selIdx = currentQs.findIndex((q: Question) => q.id === (selectedQuestion as any).id);
              if (selIdx > 0) {
                candidates.push(...currentQs.slice(0, selIdx));
              }
              return candidates;
            })()}
            existingRules={(selectedQuestion?.settings as any)?.visibleWhen || (selectedQuestion as any)?.visibilityRules || []}
            onSave={(rules) => {
              if (!survey || !selectedQuestion) return;
              const updatedPages = [...survey.pages];
              const qIndex = updatedPages[activePageIndex].questions.findIndex((q: Question) => q.id === selectedQuestion.id);
              if (qIndex !== -1) {
                const q = updatedPages[activePageIndex].questions[qIndex];
                const newSettings = { ...(q.settings || {}), visibleWhen: rules } as any;
                updatedPages[activePageIndex].questions[qIndex] = { ...q, settings: newSettings } as any;
                setSurvey({ ...survey, pages: updatedPages });
              }
              setIsVisibilityModalOpen(false);
              setSelectedQuestion(null);
            }}
          />

          <AddQuestionModal
            isOpen={isAddQuestionModalOpen}
            onClose={() => {
              setIsAddQuestionModalOpen(false);
              setEditingQuestion(null);
            }}
            onSubmit={editingQuestion ? updateQuestion : addQuestion}
            editingQuestion={editingQuestion}
          />
        </>
      )}
    </div>
  );
}
