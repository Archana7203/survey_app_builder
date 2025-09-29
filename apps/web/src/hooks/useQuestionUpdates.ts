import { useCallback } from 'react';

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

interface UseQuestionUpdatesProps {
  survey: any;
  setSurvey: (survey: any) => void;
  activePageIndex: number;
  setSelectedQuestion: (question: Question | null) => void;
}

export const useQuestionUpdates = ({
  survey,
  setSurvey,
  activePageIndex,
  setSelectedQuestion
}: UseQuestionUpdatesProps) => {
  const updateQuestion = useCallback((questionId: string, updates: Partial<Question>) => {
    if (!survey) return;
    
    const updatedPages = [...survey.pages];
    const questionIndex = updatedPages[activePageIndex].questions.findIndex(
      (q: Question) => q.id === questionId
    );
    
    if (questionIndex !== -1) {
      const updated = { ...updatedPages[activePageIndex].questions[questionIndex], ...updates };
      updatedPages[activePageIndex].questions[questionIndex] = updated;
      setSurvey({
        ...survey,
        pages: updatedPages,
      });
      setSelectedQuestion(updated);
    }
  }, [survey, setSurvey, activePageIndex, setSelectedQuestion]);

  const addQuestion = useCallback((question: Question) => {
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
  }, [survey, setSurvey, activePageIndex]);

  const deleteQuestion = useCallback((questionId: string) => {
    if (!survey) return;
    const updatedPages = [...survey.pages];
    updatedPages[activePageIndex] = {
      ...updatedPages[activePageIndex],
      questions: updatedPages[activePageIndex].questions.filter((q: Question) => q.id !== questionId)
    };
    setSurvey({ ...survey, pages: updatedPages });
  }, [survey, setSurvey, activePageIndex]);

  const updateQuestionOptions = useCallback((questionId: string, options: any[]) => {
    updateQuestion(questionId, { options });
  }, [updateQuestion]);

  const updateQuestionSettings = useCallback((questionId: string, settings: any) => {
    const currentQuestion = survey?.pages?.[activePageIndex]?.questions?.find((q: Question) => q.id === questionId);
    if (currentQuestion) {
      updateQuestion(questionId, { settings: { ...currentQuestion.settings, ...settings } });
    }
  }, [survey, activePageIndex, updateQuestion]);

  return {
    updateQuestion,
    addQuestion,
    deleteQuestion,
    updateQuestionOptions,
    updateQuestionSettings
  };
};
