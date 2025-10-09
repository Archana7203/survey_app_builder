export const API_BASES = {
  SURVEYS: buildApiUrl('/api/surveys'),
  TEMPLATES: buildApiUrl('/api/templates'),
  RESPONSES: buildApiUrl('/api/responses'),
  QUESTIONS: buildApiUrl('/api/questions'),
  AUTH: buildApiUrl('/api/auth'),
  ANALYTICS: buildApiUrl('/api/analytics')
};

// Helper function to build full API URLs
export function buildApiUrl(endpoint: string): string {
  // In development, use relative URLs which will go through Vite proxy
    return endpoint;
}