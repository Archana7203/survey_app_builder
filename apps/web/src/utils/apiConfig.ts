// Helper function to build full API URLs
export function buildApiUrl(endpoint: string): string {
  // In development, use relative URLs which will go through Vite proxy
    return endpoint;
}
