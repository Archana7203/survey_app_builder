import { buildApiUrl} from './apiConfig';
export const fetchQuestionTypesApi = async () => {
  try {
    const res = await fetch(buildApiUrl('/api/questions/types'), {
      credentials: 'include'
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(new Error(errorData.error || `HTTP ${res.status}: Failed to fetch question types`));
    }
    return Promise.resolve(await res.json());
  } catch (error) {
    console.error('Failed to fetch question types:', error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

