// hooks/useSurvey.ts
import { useEffect, useCallback, useState } from "react";
import { buildApiUrl } from "../utils/apiConfig";

export const useSurvey = (surveyId?: string) => {
  const [survey, setSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSurvey = useCallback(async () => {
    if (!surveyId) return;
    try {
      const response = await fetch(buildApiUrl(`/api/surveys/${surveyId}`), {
        credentials: "include",
      });
      if (response.ok) {
        setSurvey(await response.json());
      } else {
        setError("Failed to fetch survey");
      }
    } catch (err) {
      console.error("Error fetching survey:", err);
      setError("Error loading survey");
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

  return { survey, setSurvey, loading, error, setError };
};
