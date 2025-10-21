import { buildApiUrl } from "./apiConfig";

export const ensureTemplateSamples = async (): Promise<void> => {
  try {
    const response = await fetch(buildApiUrl("/api/templates/ensure-samples"), {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Promise.reject(new Error(`${response.status} ${errorText}`));
    }

    return Promise.resolve(); // Explicit void return
  } catch (error) {
    console.error("Failed to ensure template samples:", error);
    return Promise.reject(
      error instanceof Error ? error : new Error(String(error))
    );
  }
};
