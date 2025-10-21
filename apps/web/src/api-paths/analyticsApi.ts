import { buildApiUrl } from "./apiConfig";

export const fetchAnalyticsApi = async (surveyId: string) => {
  try {
    const response = await fetch(buildApiUrl(`/api/analytics/${surveyId}`), {
      credentials: "include",
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return Promise.reject(new Error(`${response.status} ${errorText}`));  
    }
    
    const data = await response.json();
    return Promise.resolve(data);  
    
  } catch (error) {
    console.error("Failed to fetch analytics data:", error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

