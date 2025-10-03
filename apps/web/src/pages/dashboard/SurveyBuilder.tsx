import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, closestCenter, PointerSensor, KeyboardSensor, useSensors, useSensor } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import ReorderableQuestions from '../../components/survey/ReorderableQuestions';
import VisibilityRulesModal from '../../components/modals/VisibilityRulesModal';
import AddQuestionModal from '../../components/modals/AddQuestionModal';
import ComponentLibraryPanel from '../../components/survey/ComponentLibraryPanel';
import { SurveyThemeProvider, useSurveyTheme } from '../../contexts/SurveyThemeContext';
import PreviewArea from '../../components/survey/PreviewArea';
import { validateSurveyData, handleSaveError, createNewQuestion } from "../../utils/surveyUtils";
import { useSurvey } from "../../hooks/useSurvey";
import QuestionSettingsPanel from '../../components/survey/QuestionSettingsPanel';
import PageNavigation from '../../components/survey/PageNavigation';
import SurveyDetailsCard from '../../components/survey/SurveyDetailsCard';

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

interface SurveyBuilderProps {
  readonly viewMode?: boolean;
}

// Question type definitions for the library
const QUESTION_TYPES = [
  { type: 'single_choice', name: 'Single choice', description: 'Single choice question', icon: '◯', category: 'choice' },
  { type: 'multi_choice', name: 'Checkboxes', description: 'Multiple choice question', icon: '☑', category: 'choice' },
  { type: 'dropdown', name: 'Dropdown', description: 'Dropdown selection', icon: '📋', category: 'choice' },
  { type: 'text_short', name: 'Short text', description: 'Short text input', icon: '✏️', category: 'input' },
  { type: 'text_long', name: 'Long text', description: 'Long text input', icon: '📝', category: 'input' },
  { type: 'rating_star', name: 'Star rating', description: 'Star rating question', icon: '⭐', category: 'rating' },
  { type: 'rating_smiley', name: 'Smiley rating', description: 'Smiley face rating', icon: '😊', category: 'rating' },
  { type: 'rating_number', name: 'Number rating', description: 'Number rating question', icon: '🔢', category: 'rating' },
  { type: 'slider', name: 'Slider', description: 'Slider question', icon: '🎯', category: 'rating' },
] as const;

export default function SurveyBuilder({ viewMode = false }: SurveyBuilderProps) {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { survey, setSurvey, loading, error, setError } = useSurvey(surveyId);
  const [saving, setSaving] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [previewResponses, setPreviewResponses] = useState<Record<string, unknown>>({});
  const [activeTab, setActiveTab] = useState('general');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Prevent browser navigating on file drops
  useEffect(() => {
    const preventIfFileDrag = (e: DragEvent) => {
      const types = (e.dataTransfer && Array.from(e.dataTransfer.types)) || [];
      if (types.includes('Files')) {
        e.preventDefault();
      }
    };
    globalThis.addEventListener('dragover', preventIfFileDrag);
    globalThis.addEventListener('drop', preventIfFileDrag);
    return () => {
      globalThis.removeEventListener('dragover', preventIfFileDrag);
      globalThis.removeEventListener('drop', preventIfFileDrag);
    };
  }, []);

  const currentPage = survey?.pages?.[activePageIndex] || { questions: [], branching: [] };

  const saveSurvey = async () => {
    if (!survey) return;

    setSaving(true);
    try {
      const isNew = survey.id === "new";
      const url = isNew ? "/api/surveys" : `/api/surveys/${survey.id}`;
      const method = isNew ? "POST" : "PUT";

      const pages = survey.pages?.length ? survey.pages : [{ questions: [], branching: [] }];
      const surveyData = { ...survey, pages };

      const errorMessage = validateSurveyData(surveyData);
      if (errorMessage) {
        setError(errorMessage);
        return;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(surveyData),
      });

      if (!response.ok) {
        return handleSaveError(response, setError);
      }

      const savedSurvey = await response.json();
      const updatedSurvey = isNew ? savedSurvey : { ...savedSurvey, id: survey.id };
      setSurvey(updatedSurvey);

      if (isNew) navigate(`/dashboard/surveys/${savedSurvey.id}/edit`, { replace: true });
    } catch (err) {
      console.error("Save survey error:", err);
      setError(`Error saving survey: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const addPage = () => {
    if (!survey?.pages) return;
    setSurvey({
      ...survey,
      pages: [...survey.pages, { questions: [], branching: [] }],
    });
  };

  const deletePage = (pageIndex: number) => {
    if (survey?.pages?.length <= 1) return;
    
    setSurvey({
      ...survey,
      pages: survey.pages.filter((_: unknown, index: number) => index !== pageIndex),
    });
    
    if (activePageIndex >= survey.pages.length - 1) {
      setActivePageIndex(Math.max(0, survey.pages.length - 2));
    }
  };

  const addQuestion = (question: Question) => {
    if (!survey?.pages) return;
    
    const updatedPages = [...survey.pages];
    updatedPages[activePageIndex] = {
      ...updatedPages[activePageIndex],
      questions: [...updatedPages[activePageIndex].questions, question],
    };
    
    setSurvey({ ...survey, pages: updatedPages });
  };

  const updateQuestion = (updatedQuestion: Question) => {
    if (!survey?.pages) return;
    
    const updatedPages = [...survey.pages];
    const questionIndex = updatedPages[activePageIndex].questions.findIndex(
      (q: Question) => q.id === updatedQuestion.id
    );
    
    if (questionIndex !== -1) {
      updatedPages[activePageIndex].questions[questionIndex] = updatedQuestion;
      setSurvey({ ...survey, pages: updatedPages });
    }
  };

  const deleteQuestion = (questionId: string) => {
    if (!survey) return;
    const updatedPages = [...survey.pages];
    updatedPages[activePageIndex] = {
      ...updatedPages[activePageIndex],
      questions: updatedPages[activePageIndex].questions.filter((q: Question) => q.id !== questionId)
    };
    setSurvey({ ...survey, pages: updatedPages });
  };

  const handleEditVisibility = (questionId: string) => {
    if (!survey?.pages) return;
    const question = survey.pages[activePageIndex]?.questions.find((q: Question) => q.id === questionId);
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

    if (!survey) return;

    // Case 1: Dragging from library to add new question
    if (active.data.current?.type === "question") {
      const questionType = active.data.current.questionType;
      
      // Extract the type string from the questionType object
      const typeString = typeof questionType === 'string' ? questionType : questionType?.type;
      
      if (!typeString) {
        console.error('No question type found:', questionType);
        return;
      }

      const newQuestion = createNewQuestion(typeString);

      const updatedPages = [...survey.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        questions: [...updatedPages[activePageIndex].questions, newQuestion],
      };

      setSurvey({ ...survey, pages: updatedPages });
      setSelectedQuestion(newQuestion);
      return;
    }

    // Case 2: Reordering existing questions
    if (!over) return;

    const questions = survey.pages[activePageIndex].questions;
    const activeId = String(active.id);
    const overId = String(over.id);
    
    const oldIndex = questions.findIndex((q: Question) => q.id === activeId);
    const newIndex = questions.findIndex((q: Question) => q.id === overId);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = arrayMove(questions, oldIndex, newIndex);
    const updatedPages = [...survey.pages];
    updatedPages[activePageIndex] = {
      ...updatedPages[activePageIndex],
      questions: reordered
    };

    setSurvey({ ...survey, pages: updatedPages });
  };

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
}: Readonly<SurveyBuilderContentProps>) {
  const { setSurveyTheme } = useSurveyTheme();

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

  if (!survey?.pages || !Array.isArray(survey.pages)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Failed to load survey or survey data is invalid</div>
      </div>
    );
  }

  const isDisabled = survey.locked || viewMode;

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isDisabled && (
        <Alert variant="info">
          {viewMode ? 'Survey Viewer - Read-only mode' : 'Survey locked after first publish - read-only mode'}
        </Alert>
      )}

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
          {!isDisabled && (
            <Button variant="primary" onClick={saveSurvey} disabled={saving}>
              {saving ? 'Saving...' : 'Save Survey'}
            </Button>
          )}
        </div>
      </div>

      <SurveyDetailsCard
        survey={survey}
        setSurvey={setSurvey}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        surveyId={surveyId}
        isDisabled={isDisabled}
      />

      <PageNavigation
        pages={survey.pages}
        activePageIndex={activePageIndex}
        onPageChange={setActivePageIndex}
        onAddPage={addPage}
        onDeletePage={deletePage}
        isDisabled={isDisabled}
      />

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd} 
        onDragStart={handleDragStart}
      >
        <div className="grid grid-cols-12 gap-6 h-[600px]">
          <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            <div className="p-4">
              <ComponentLibraryPanel
                questionTypes={[...QUESTION_TYPES]}
                disabled={isDisabled}
              />
            </div>
          </div>

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
                  onSelectQuestion={setSelectedQuestion}
                  disabled={isDisabled}
                />
              )}
            </div>
          </div>

          <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            <div className="p-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Question Settings
              </h2>
              <QuestionSettingsPanel
                selectedQuestion={selectedQuestion}
                survey={survey}
                setSurvey={setSurvey}
                activePageIndex={activePageIndex}
                setSelectedQuestion={setSelectedQuestion}
                onEditVisibility={handleEditVisibility}
                isDisabled={isDisabled}
              />
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

      <Card className="mt-6">
        <div className="p-0">
          <div className="h-[600px] w-full bg-white light">
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

      {!viewMode && (
        <>
          <VisibilityRulesModal
            isOpen={isVisibilityModalOpen}
            onClose={() => {
              setIsVisibilityModalOpen(false);
              setSelectedQuestion(null);
            }}
            question={selectedQuestion}
            candidateQuestions={(function() {
              if (!selectedQuestion) return [];
              const candidates: Question[] = [];
              for (let p = 0; p < activePageIndex; p++) {
                candidates.push(...survey.pages[p].questions);
              }
              const currentQs = survey.pages[activePageIndex].questions;
              const selIdx = currentQs.findIndex((q: Question) => q.id === selectedQuestion.id);
              if (selIdx > 0) {
                candidates.push(...currentQs.slice(0, selIdx));
              }
              return candidates;
            })()}
            existingRules={selectedQuestion?.settings?.visibleWhen || selectedQuestion?.visibilityRules || []}
            onSave={(rules) => {
              if (!survey || !selectedQuestion) return;
              const updatedPages = [...survey.pages];
              const qIndex = updatedPages[activePageIndex].questions.findIndex((q: Question) => q.id === selectedQuestion.id);
              if (qIndex !== -1) {
                const q = updatedPages[activePageIndex].questions[qIndex];
                const newSettings = { ...q.settings, visibleWhen: rules };
                updatedPages[activePageIndex].questions[qIndex] = { ...q, settings: newSettings };
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