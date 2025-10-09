import { buildApiUrl, API_BASES} from './apiConfig';

export const RESPONSES_API_BASE = API_BASES.RESPONSES;

export const RESPONSES_API = {
  
  // Submit a new response
  SUBMIT: (surveyId: string) => buildApiUrl(`${RESPONSES_API_BASE}/${surveyId}/submit`),
  
  // Auto-save response progress
  AUTO_SAVE: (surveyId: string) => buildApiUrl(`${RESPONSES_API_BASE}/${surveyId}/auto-save`),
};