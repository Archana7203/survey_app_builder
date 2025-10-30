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

  if (newStatus === "live" && currentStatus === "published") {
    payload.startDate = new Date().toISOString();
  }

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

  // Check if start date is today or in the past
  const now = new Date();
  const startDate = new Date(survey.startDate);
  const endDate = new Date(survey.endDate);

  // Compare only the date part (ignore time)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const surveyStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  if (surveyStartDate > todayStart) {
    return {
      valid: false,
      error: "Cannot go live before the start date. Start date must be today or earlier.",
    };
  }

  // Check if survey hasn't expired
  if (endDate <= now) {
    return {
      valid: false,
      error: "Cannot go live - survey end date has already passed",
    };
  }
  return { valid: true };
};
