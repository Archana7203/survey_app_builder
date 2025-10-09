import { buildApiUrl, API_BASES} from './apiConfig';

export const SURVEY_API_BASE = API_BASES.SURVEYS;

export const SURVEYS_API = {
  // Get all surveys with pagination
  LIST: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    return buildApiUrl(`${SURVEY_API_BASE}${params.toString() ? `?${params.toString()}` : ''}`);
  },
  
  // Get a specific survey by ID
  GET: (id: string) => buildApiUrl(`${SURVEY_API_BASE}/${id}`),
  
  // Get survey by ID (alternative endpoint)
  GET_BY_ID: (id: string) => buildApiUrl(`${SURVEY_API_BASE}/by-id/${id}`),
  
  // Get survey by slug
  GET_BY_SLUG: (slug: string) => buildApiUrl(`${SURVEY_API_BASE}/by-slug/${slug}`),
  
  // Get public survey by slug
  GET_PUBLIC: (slug: string) => buildApiUrl(`${SURVEY_API_BASE}/public/${slug}`),
  
  // Create a new survey
  CREATE: () => buildApiUrl(SURVEY_API_BASE),
  
  // Update a survey
  UPDATE: (id: string) => buildApiUrl(`${SURVEY_API_BASE}/${id}`),
  
  // Delete a survey
  DELETE: (id: string) => buildApiUrl(`${SURVEY_API_BASE}/${id}`),
    
  //Respondent progress
  RESPONDENT_PROGRESS: (id: string, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    return buildApiUrl(`${SURVEY_API_BASE}/${id}/respondent-progress${params.toString() ? `?${params.toString()}` : ''}`);
  },
  
  // Respondents management
  RESPONDENTS: {
    // Get all respondents for a survey
    LIST: (surveyId: string) => buildApiUrl(`${SURVEY_API_BASE}/${surveyId}/respondents`),
    
    // Add a respondent
    ADD: (surveyId: string) => buildApiUrl(`${SURVEY_API_BASE}/${surveyId}/respondents`),
    
    // Remove a respondent
    REMOVE: (surveyId: string, email: string) => buildApiUrl(`${SURVEY_API_BASE}/${surveyId}/respondents/${encodeURIComponent(email)}`),
    
    // Send invitations to all respondents
    SEND_INVITATIONS: (surveyId: string) => buildApiUrl(`${SURVEY_API_BASE}/${surveyId}/respondents/send-invitations`),
  },
};