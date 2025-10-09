import { buildApiUrl, API_BASES} from './apiConfig';

export const ANALYTICS_API_BASE = API_BASES.ANALYTICS;

export const ANALYTICS_API = {
  // Get analytics for a survey
  GET: (surveyId: string) => buildApiUrl(`${ANALYTICS_API_BASE}/${surveyId}`),
};