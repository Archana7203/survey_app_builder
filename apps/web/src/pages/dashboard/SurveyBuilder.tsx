import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensors,
  useSensor,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { SurveyThemeProvider } from "../../contexts/SurveyThemeContext";
import {
  validateSurveyData,
  handleSaveError,
  createNewQuestion,
} from "../../utils/surveyUtils";
import { useSurvey } from "../../hooks/useSurvey";
import SurveyBuilderContent from "./SurveyBuilderContent";
import { deleteSurveyApi } from "../../api-paths/surveysApi";
export interface Question {
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

export default function SurveyBuilder() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { survey, setSurvey, loading, error, setError } = useSurvey(surveyId);
  const [saving, setSaving] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [previewResponses, setPreviewResponses] = useState<
    Record<string, unknown>
  >({});
  const [activeTab, setActiveTab] = useState("general");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    const preventIfFileDrag = (e: DragEvent) => {
      const types = (e.dataTransfer && Array.from(e.dataTransfer.types)) || [];
      if (types.includes("Files")) {
        e.preventDefault();
      }
    };
    globalThis.addEventListener("dragover", preventIfFileDrag);
    globalThis.addEventListener("drop", preventIfFileDrag);
    return () => {
      globalThis.removeEventListener("dragover", preventIfFileDrag);
      globalThis.removeEventListener("drop", preventIfFileDrag);
    };
  }, []);

  const currentPage = survey?.pages?.[activePageIndex] || {
    questions: [],
    branching: [],
  };

  const saveSurvey = async () => {
    if (!survey) return;

    setSaving(true);
    try {
      const isNew = survey.id === "new";
      const url = isNew ? "/api/surveys" : `/api/surveys/${survey.id}`;
      const method = isNew ? "POST" : "PUT";

      const pages = survey.pages?.length
        ? survey.pages
        : [{ questions: [], branching: [] }];
      const surveyData = { ...survey, pages };

      const errorMessage = validateSurveyData(surveyData);
      if (errorMessage) {
        setError(errorMessage);
        return undefined;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(surveyData),
      });

      if (!response.ok) {
        handleSaveError(response, setError);
        return undefined;
      }

      const responseData = await response.json();
      const savedSurvey = isNew ? responseData : responseData.survey;
      const updatedSurvey = isNew
        ? savedSurvey
        : { ...savedSurvey, id: survey.id };
      setSurvey(updatedSurvey);

      if (isNew)
        navigate(`/dashboard/surveys/${savedSurvey.id}/edit`, {
          replace: true,
        });
      
      return updatedSurvey;
    } catch (err) {
      console.error("Save survey error:", err);
      setError(
        `Error saving survey: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      return undefined;
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
      pages: survey.pages.filter(
        (_: unknown, index: number) => index !== pageIndex
      ),
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
      questions: updatedPages[activePageIndex].questions.filter(
        (q: Question) => q.id !== questionId
      ),
    };
    setSurvey({ ...survey, pages: updatedPages });
  };

  const handleEditVisibility = (questionId: string) => {
    if (!survey?.pages) return;
    const question = survey.pages[activePageIndex]?.questions.find(
      (q: Question) => q.id === questionId
    );
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

    if (active.data.current?.type === "question") {
      const questionType = active.data.current.questionType;
      const typeString =
        typeof questionType === "string" ? questionType : questionType?.type;

      if (!typeString) {
        console.error("No question type found:", questionType);
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
      questions: reordered,
    };

    setSurvey({ ...survey, pages: updatedPages });
  };

  const handleDeleteSurvey = async () => {
    if (!survey) return;

    if (!survey.id || survey.id === "new") {
      navigate("/dashboard/surveys");
      return;
    }

    try {
      await deleteSurveyApi(survey.id);
      navigate("/dashboard/surveys");
    } catch (err) {
      console.error("Delete survey error:", err);
      setError(
        `Error deleting survey: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  };

  const openPreviewInNewTab = useCallback(() => {
    if (!survey) return;

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith("survey_preview_temp_")) {
        const timestamp = Number.parseInt(key.split("_")[3], 10);
        if (timestamp && timestamp < oneHourAgo) {
          sessionStorage.removeItem(key);
        }
      }
    }

    const previewId = `temp_${Date.now()}`;

    try {
      const storageKey = `survey_preview_${previewId}`;
      sessionStorage.setItem(storageKey, JSON.stringify(survey));
      console.log("📋 Preview data stored with key:", storageKey);
    } catch (err) {
      console.warn("Failed to store survey preview payload:", err);
    }

    const surveyUrl = `${globalThis.location.origin}/preview/${previewId}`;

    try {
      const newWindow = window.open(surveyUrl, "_blank");
      if (!newWindow) {
        alert(
          "Popup blocked! Please allow popups for this site and try again."
        );
      }
    } catch (error) {
      console.error("Error opening survey preview in new tab:", error);
      alert("Failed to open survey preview in new tab. Please try again.");
    }
  }, [survey]);
  
  const copyLink = () => {
    if (!survey?.slug) return;
    const link = `${globalThis.location.origin}/s/${survey.slug}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        alert("Survey link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
        alert("Failed to copy link. Please try again.");
      });
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
        loading={loading || false}
        saving={saving}
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
        openPreviewInNewTab={openPreviewInNewTab}
        isDeleteModalOpen={isDeleteModalOpen}
        setIsDeleteModalOpen={setIsDeleteModalOpen}
        handleDeleteSurvey={handleDeleteSurvey}
        copyLink={copyLink}
      />
    </SurveyThemeProvider>
  );
}
