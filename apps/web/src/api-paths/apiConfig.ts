// Helper function to build full API URLs
export function buildApiUrl(endpoint: string): string {
  if (import.meta.env.DEV) {
    return endpoint;
  }
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  return `${apiBaseUrl}${endpoint}`;
}