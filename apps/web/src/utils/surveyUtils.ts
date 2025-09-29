// utils/surveyUtils.ts

// Basic shape of Question so utils can compile
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
    if (!page || typeof page !== "object") return `Invalid page data at index ${i}`;
    if (!Array.isArray(page.questions)) return `Invalid questions array at page ${i + 1}`;
    if (!Array.isArray(page.branching)) return `Invalid branching array at page ${i + 1}`;
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
    settings = { maxRating: ["ratingSmiley", "ratingStar"].includes(mappedType) ? 5 : 10 };
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
