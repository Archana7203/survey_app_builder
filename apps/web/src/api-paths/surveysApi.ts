import { buildApiUrl } from "./apiConfig";
interface SurveyQuestion {
  id: string;
  type: string;
  title: string;
  description?: string;
  required?: boolean;
  options?: Array<{ id: string; text: string }>;
  settings?: Record<string, unknown>;
}
interface SurveyPage {
  questions: Array<SurveyQuestion>;
  branching?: Array<Record<string, unknown>>;
}
interface DuplicatedSurveyResponse {
  id: string;
  title: string;
  slug: string;
  status: string;
  pages: Array<SurveyPage>;
}
interface SurveyExportData {
  version: string;
  exportedAt: string;
  survey: SurveyDefinition;
}
interface SurveyDefinition {
  title: string;
  description?: string;
  theme?: string;
  pages: Array<SurveyPage>;
}
interface ImportedSurveyResponse {
  id: string;
  title: string;
  slug: string;
  status: string;
  pages: Array<SurveyPage>;
}
export const exportSurveyApi = async (surveyId: string): Promise<Blob> => {
  try {
    const response = await fetch(buildApiUrl(`/api/surveys/${surveyId}/export`), {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      const errorText = await response.text();
      return Promise.reject(new Error(`${response.status} ${errorText}`));
    }
    const blob = await response.blob();
    return Promise.resolve(blob);
  } catch (error) {
    console.error("Failed to export survey:", error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const fetchRespondentProgressApi = async (
  surveyId: string,
  page: number = 1,
  limit: number = 20
) => {
  try {
    const res = await fetch(
      buildApiUrl(
        `/api/surveys/${surveyId}/respondent-progress?page=${page}&limit=${limit}`
      ),
      {
        credentials: "include",
      }
    );
    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      return Promise.reject(
        new Error(`${res.status} ${errorText || "Failed to fetch progress"}`)
      );
    }
    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error("Failed to fetch respondent progress:", error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const fetchRespondentsApi = async (surveyId: string) => {
  try {
    const res = await fetch(buildApiUrl(`/api/surveys/${surveyId}/respondents`), {
      credentials: "include",
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(new Error(errorData.error || "Failed to load respondents"));
    }
    const data = await res.json();
    return Promise.resolve(data); 
  } catch (error) {
    console.error("Failed to fetch respondents:", error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const addRespondentApi = async (surveyId: string, email: string) => {
  try {
    const res = await fetch(buildApiUrl(`/api/surveys/${surveyId}/respondents`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(new Error(errorData.error || "Failed to add respondent"));
    }
    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error("Failed to add respondent:", error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const removeRespondentApi = async (surveyId: string, email: string) => {
  try {
    const res = await fetch(
      buildApiUrl(
        `/api/surveys/${surveyId}/respondents/${encodeURIComponent(email)}`
      ),
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(new Error(errorData.error || "Failed to remove respondent"));
    }
    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error("Failed to remove respondent:", error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const fetchSurveyApi = async (slugOrId: string) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugOrId);
    const endpoint = isObjectId
      ? `/api/surveys/by-id/${slugOrId}`
      : `/api/surveys/by-slug/${slugOrId}`;
    const res = await fetch(buildApiUrl(endpoint), { credentials: "include" });
    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      return Promise.reject(
        new Error(`${res.status} ${errorText || "Failed to fetch survey"}`)
      );
    }
    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error("Failed to fetch survey:", error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const fetchPublicSurveyApi = async (slug: string, token?: string) => {
  try {
    const res = await fetch(buildApiUrl(`/api/surveys/public/${slug}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to fetch survey (status ${res.status})`)
      );
    }
    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error("Failed to fetch public survey:", error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const fetchSurveyByIdApi = async (surveyId: string) => {
  try {
    const res = await fetch(buildApiUrl(`/api/surveys/${surveyId}`), {
      credentials: "include",
    });
    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      return Promise.reject(
        new Error(errorText || `Failed to fetch survey (status ${res.status})`)
      );
    }
    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error("Failed to fetch survey by ID:", error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const listSurveysApi = async (page = 1, limit = 5) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const res = await fetch(buildApiUrl(`/api/surveys?${params.toString()}`), {
      credentials: "include",
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to list surveys (status ${res.status})`)
      );
    }
    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error("Failed to list surveys:", error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const createSurveyApi = async (data: {
  title: string;
  description: string;
  closeDate: string;
}) => {
  try {
    const res = await fetch(buildApiUrl("/api/surveys"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      return Promise.reject(
        new Error(errorText || `Failed to create survey (status ${res.status})`)
      );
    }
    const result = await res.json();
    return Promise.resolve(result);
  } catch (error) {
    console.error("Failed to create survey:", error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const updateSurveyStatusApi = async (
  surveyId: string,
  status: "draft" | "published"
) => {
  try {
    const res = await fetch(buildApiUrl(`/api/surveys/${surveyId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return Promise.reject(
        new Error(txt || `Failed to update survey status (status ${res.status})`)
      );
    }
    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error("Failed to update survey status:", error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const deleteSurveyApi = async (surveyId: string) => {
  try {
    const res = await fetch(buildApiUrl(`/api/surveys/${surveyId}`), {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return Promise.reject(
        new Error(txt || `Failed to delete survey (status ${res.status})`)
      );
    }
    return Promise.resolve(true);
  } catch (error) {
    console.error("Failed to delete survey:", error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const duplicateSurveyApi = async (
  surveyId: string
): Promise<DuplicatedSurveyResponse> => {
  try {
    const res = await fetch(buildApiUrl(`/api/surveys/${surveyId}/duplicate`), {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(new Error(errorData.error || "Failed to duplicate survey"));
    }
    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error("Failed to duplicate survey:", error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const uploadImportedSurveyApi = async (
  surveyData: SurveyExportData
): Promise<ImportedSurveyResponse> => {
  try {
    const res = await fetch(buildApiUrl("/api/surveys/import"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ surveyData }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to import survey (status ${res.status})`)
      );
    }
    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error("Failed to import survey:", error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const sendSurveyInvitations = async (surveyId: string): Promise<any> => {
  try {
    const response = await fetch(buildApiUrl(`/api/surveys/${surveyId}/respondents/send-invitations`), {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return Promise.reject(new Error(errorData.error || "Failed to send invitations"));
    }
    const data = await response.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error("Failed to send invitations:", error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};
