import {
  createSurveyApi,
  deleteSurveyApi,
} from "../api-paths/surveysApi";
import {
  exportSurveyToFile,
  importSurveyFromFile,
  uploadImportedSurvey,
} from "./surveyImportExport";

export type StateSetter<T> = (value: T | ((prev: T) => T)) => void;

export type FetchSurveysOptions = {
  isInitial?: boolean;
};

export type FetchSurveysHandler = (
  page: number,
  limit: number,
  options?: FetchSurveysOptions
) => Promise<void>;

export interface SurveySummary {
  id: string;
  title: string;
  description?: string;
  slug: string;
  status: "draft" | "published" | "closed" | "live" | "archived";
  closeDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  responseCount?: number;
  locked?: boolean;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Question {
  id: string;
  type: string;
  title: string;
  description?: string;
  required: boolean;
  options?: Array<{ id: string; text: string; value?: string }>;
  settings?: Record<string, unknown>;
}

// ---- Validation ----
export const validateSurveyData = (surveyData: any): string | null => {
  if (!surveyData.title?.trim()) return "Survey title is required";
  if (!Array.isArray(surveyData.pages)) return "Invalid pages data structure";

  for (let i = 0; i < surveyData.pages.length; i++) {
    const page = surveyData.pages[i];
    if (!page || typeof page !== "object")
      return `Invalid page data at index ${i}`;
    if (!Array.isArray(page.questions))
      return `Invalid questions array at page ${i + 1}`;
    if (!Array.isArray(page.branching))
      return `Invalid branching array at page ${i + 1}`;
  }
  return null;
};

export const handleSaveError = async (
  response: Response,
  setError: (msg: string) => void
) => {
  let message = `Failed to save survey (${response.status})`;
  try {
    const data = await response.json();
    if (data?.error) message = data.error;
  } catch {
    /* ignore */
  }
  if (response.status === 401) message = "Please log in to save surveys.";
  setError(message);
};

// ---- Dashboard Survey Handlers ----
interface BaseHandlerParams {
  setError: StateSetter<string | null>;
}

export interface HandleCreateSurveyParams extends BaseHandlerParams {
  formData: {
    title: string;
    description: string;
    closeDate: string;
  };
  pagination: PaginationState;
  setSubmitting: StateSetter<boolean>;
  setSurveys: StateSetter<SurveySummary[]>;
  setAllSurveys: StateSetter<SurveySummary[]>;
  setIsModalOpen: (value: boolean) => void;
  setPagination: StateSetter<PaginationState>;
  fetchSurveys: FetchSurveysHandler;
}

export const handleCreateSurvey = async ({
  formData,
  pagination,
  setSubmitting,
  setError,
  setSurveys,
  setAllSurveys,
  setIsModalOpen,
  setPagination,
  fetchSurveys,
}: HandleCreateSurveyParams) => {
  setSubmitting(true);
  setError(null);
  try {
    const newSurvey = await createSurveyApi(formData);
    const surveyRecord = newSurvey as SurveySummary;
    setSurveys((prev) => [surveyRecord, ...prev]);
    setAllSurveys((prev) => [surveyRecord, ...prev]);
    setIsModalOpen(false);
    setPagination((prev) => ({
      ...prev,
      total: prev.total + 1,
      totalPages: Math.ceil((prev.total + 1) / prev.limit),
    }));
    await fetchSurveys(1, pagination.limit);
  } catch (error: unknown) {
    setError(
      error instanceof Error ? error.message : "Failed to create survey"
    );
  } finally {
    setSubmitting(false);
  }
};

export interface HandleDeleteSurveyParams extends BaseHandlerParams {
  surveyId: string;
  setDeleting: StateSetter<string | null>;
  surveys: SurveySummary[];
  pagination: PaginationState;
  fetchSurveys: FetchSurveysHandler;
  setAllSurveys: StateSetter<SurveySummary[]>;
}

export const handleDeleteSurvey = async ({
  surveyId,
  setDeleting,
  setError,
  surveys,
  pagination,
  fetchSurveys,
  setAllSurveys,
}: HandleDeleteSurveyParams): Promise<boolean> => {
  setDeleting(surveyId);
  setError(null);
  let wasSuccessful = false;
  try {
    await deleteSurveyApi(surveyId);
    const remainingOnCurrentPage = surveys.length - 1;
    if (remainingOnCurrentPage === 0 && pagination.page > 1) {
      await fetchSurveys(pagination.page - 1, pagination.limit);
    } else {
      await fetchSurveys(pagination.page, pagination.limit);
    }
    setAllSurveys((prev) => prev.filter((survey) => survey.id !== surveyId));
    wasSuccessful = true;
  } catch (error: unknown) {
    setError(
      error instanceof Error ? error.message : "Failed to delete survey"
    );
  } finally {
    setDeleting(null);
  }
  return wasSuccessful;
};

export interface HandleExportSurveyParams extends BaseHandlerParams {
  surveyId: string;
  setExporting: StateSetter<string | null>;
}

export const handleExportSurvey = async ({
  surveyId,
  setExporting,
  setError,
}: HandleExportSurveyParams) => {
  setExporting(surveyId);
  setError(null);
  try {
    await exportSurveyToFile(surveyId);
  } catch (error: unknown) {
    setError(
      error instanceof Error ? error.message : "Failed to export survey"
    );
  } finally {
    setExporting(null);
  }
};

export interface HandleImportSurveyParams extends BaseHandlerParams {
  file: File;
  setSurveys: StateSetter<SurveySummary[]>;
  setAllSurveys: StateSetter<SurveySummary[]>;
  setPagination: StateSetter<PaginationState>;
  pagination: PaginationState;
  fetchSurveys: FetchSurveysHandler;
}

export const handleImportSurvey = async ({
  file,
  setError,
  setSurveys,
  setAllSurveys,
  setPagination,
  pagination,
  fetchSurveys,
}: HandleImportSurveyParams): Promise<boolean> => {
  setError(null);
  try {
    const surveyData = await importSurveyFromFile(file);
    const uploadedSurvey = (await uploadImportedSurvey(surveyData)) as
      | SurveySummary
      | undefined;

    if (uploadedSurvey) {
      setSurveys((prev) => [uploadedSurvey, ...prev]);
      setAllSurveys((prev) => [uploadedSurvey, ...prev]);
      setPagination((prev) => ({
        ...prev,
        total: prev.total + 1,
        totalPages: Math.ceil((prev.total + 1) / prev.limit),
      }));
    }

    await fetchSurveys(1, pagination.limit);

    return true;
  } catch (error: unknown) {
    setError(
      error instanceof Error ? error.message : "Failed to import survey"
    );
    return false;
  } finally {
    // no-op
  }
};

// ---- Drag & Drop ----
const typeMapping: Record<string, string> = {
  single_choice: "singleChoice",
  multi_choice: "multiChoice",
  rating_star: "ratingStar",
  rating_smiley: "ratingSmiley",
  rating_number: "ratingNumber",
  text_short: "textShort",
  text_long: "textLong",
};

export const mapQuestionType = (t: string): string => typeMapping[t] || t;

export const createNewQuestion = (type: string): Question => {
  const mappedType = mapQuestionType(type);
  let settings: Record<string, unknown> = {};
  if (mappedType.startsWith("rating")) {
    settings = {
      maxRating: ["ratingSmiley", "ratingStar"].includes(mappedType) ? 5 : 10,
    };
  } else if (mappedType === "slider") {
    settings = { scaleMin: 0, scaleMax: 100, scaleStep: 1 };
  }
  return {
    id: `q_${Date.now()}`,
    type: mappedType,
    title: "",
    description: "",
    required: false,
    options: ["singleChoice", "multiChoice", "dropdown"].includes(mappedType)
      ? [{ id: "opt_1", text: "Option 1" }]
      : undefined,
    settings,
  };
};
export const prepareStatusUpdatePayload = (
  newStatus: string,
  currentStatus: string
) => {
  const payload: any = { status: newStatus };

  // Handle live → closed transition (Close button)
  if (newStatus === "closed" && currentStatus === "live") {
    payload.endDate = new Date().toISOString();
  }

  return payload;
};
export const getStatusSuccessMessage = (status: string): string => {
  const messages: Record<string, string> = {
    live: "Survey is now live!",
    published: "Survey published successfully!",
    closed: "Survey closed successfully.",
    archived: "Survey archived successfully.",
  };
  return messages[status] || "";
};
export const validateSurveyForPublish = (
  survey: any
): { valid: boolean; error?: string } => {
  if (!survey?.title?.trim()) {
    return { valid: false, error: "Survey title is required" };
  }

  if (!survey?.pages || survey.pages.length === 0) {
    return { valid: false, error: "Survey must have at least one page" };
  }

  const hasQuestions = survey.pages.some(
    (page: any) => page.questions && page.questions.length > 0
  );

  if (!hasQuestions) {
    return { valid: false, error: "Survey must have at least one question" };
  }

  const emptyPages: number[] = [];
  survey.pages.forEach((page: any, pageIndex: number) => {
    if (!page.questions || !Array.isArray(page.questions) || page.questions.length === 0) {
      emptyPages.push(pageIndex + 1);
    }
  });

  if (emptyPages.length > 0) {
    return {
      valid: false,
      error: `Cannot publish survey with empty pages. Please add questions to page(s): ${emptyPages.join(', ')}`,
    };
  }

  // Check for empty question titles - must be done before any other checks
  const emptyQuestions: Array<{ pageIndex: number; questionIndex: number; questionId?: string }> = [];
  survey.pages.forEach((page: any, pageIndex: number) => {
    if (page.questions && Array.isArray(page.questions)) {
      page.questions.forEach((question: any, questionIndex: number) => {
        // Check if title is missing, null, undefined, empty string, or only whitespace
        const title = question.title;
        if (
          title === undefined ||
          title === null ||
          typeof title !== 'string' ||
          title.trim() === ''
        ) {
          emptyQuestions.push({ 
            pageIndex: pageIndex + 1, 
            questionIndex: questionIndex + 1,
            questionId: question.id || `q_${questionIndex}`
          });
        }
      });
    }
  });

  if (emptyQuestions.length > 0) {
    const emptyQuestionDetails = emptyQuestions
      .map(({ pageIndex, questionIndex }) => `Page ${pageIndex}, Question ${questionIndex}`)
      .join('; ');
    return {
      valid: false,
      error: `Cannot publish survey with empty question titles. Please fill in the question titles for: ${emptyQuestionDetails}`,
    };
  }

  if (!survey?.startDate) {
    return { valid: false, error: "Start date is required to publish" };
  }

  if (!survey?.endDate) {
    return { valid: false, error: "End date is required to publish" };
  }

  const start = new Date(survey.startDate);
  const end = new Date(survey.endDate);

  if (end <= start) {
    return { valid: false, error: "End date must be after start date" };
  }
  return { valid: true };
};

export const validateSurveyForGoingLive = (
  survey: any
): { valid: boolean; error?: string } => {
  // First check basic publish requirements
  const publishValidation = validateSurveyForPublish(survey);
  if (!publishValidation.valid) {
    return publishValidation;
  }

  // Note: We don't validate start date here because when going live,
  // the start date will be automatically updated to current date/time
  // So even if start date is in the future, it will be corrected

  const now = new Date();
  const endDate = new Date(survey.endDate);

  // Check if survey hasn't expired
  if (endDate <= now) {
    return {
      valid: false,
      error: "Cannot go live - survey end date has already passed",
    };
  }
  return { valid: true };
};
