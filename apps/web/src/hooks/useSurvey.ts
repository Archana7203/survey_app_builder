// hooks/useSurvey.ts
import { useEffect, useCallback, useState, useRef } from "react";
import { fetchSurveyByIdApi } from "../api-paths/surveysApi";
export const useSurvey = (surveyId?: string) => {
  const [survey, setSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousSurveyIdRef = useRef<string | undefined>(undefined);

  // Immediately set loading to true when surveyId changes
  useEffect(() => {
    if (previousSurveyIdRef.current !== surveyId) {
      setLoading(true);
      setSurvey(null);
      setError(null);
      previousSurveyIdRef.current = surveyId;
    }
  }, [surveyId]);

  const fetchSurvey = useCallback(async () => {
    if (!surveyId) return;

    try {
      const data = await fetchSurveyByIdApi(surveyId);
      setSurvey(data);
    } catch (err) {
      console.error('Error fetching survey:', err);
      setError(err instanceof Error ? err.message : 'Error loading survey');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    if (surveyId) {
      fetchSurvey();
    } else {
      // default new survey
      setSurvey({
        id: "new",
        title: "New Survey",
        description: "",
        theme: "default",
        pages: [{ questions: [], branching: [] }],
      });
      setLoading(false);
    }
  }, [surveyId, fetchSurvey]);

  // Ensure survey always has pages
  useEffect(() => {
    if (survey && (!survey.pages || survey.pages.length === 0)) {
      setSurvey({ ...survey, pages: [{ questions: [], branching: [] }] });
    }
  }, [survey]);

  // Check if survey is ready (has valid structure with pages)
  const isSurveyReady = survey && survey.pages && Array.isArray(survey.pages) && survey.pages.length > 0;
  const isLoading = loading || (surveyId && !isSurveyReady);

  return { survey, setSurvey, loading: isLoading, error, setError };
};
