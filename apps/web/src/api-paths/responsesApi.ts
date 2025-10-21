import { buildApiUrl} from './apiConfig';
export const autoSaveResponse = async (surveyId: string, payload: any, token?: string) => {
  try {
    const res = await fetch(buildApiUrl(`/api/responses/${surveyId}/auto-save`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(`${res.status} ${errorData.error || 'Auto-save failed'}`)
      );
    }
    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error("Failed to auto-save response:", error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const submitSurveyApi = async (
  surveyId: string,
  payload: any,
  token?: string
) => {
  try {
    const res = await fetch(buildApiUrl(`/api/responses/${surveyId}/submit`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(`${res.status} ${errorData.error || 'Failed to submit survey'}`)
      );
    }
    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error("Failed to submit survey:", error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};
