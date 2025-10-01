interface SurveyQuestion {
  id: string;
  type: string;
  title: string;
  description?: string;
  required?: boolean;
  options?: Array<{ id: string; text: string }>;
  settings?: Record<string, unknown>;
}

interface SurveyPage {
  questions: Array<SurveyQuestion>;
  branching?: Array<Record<string, unknown>>;
}

interface SurveyDefinition {
  title: string;
  description?: string;
  theme?: string;
  pages: Array<SurveyPage>;
}

interface SurveyExportData {
  version: string;
  exportedAt: string;
  survey: SurveyDefinition;
}

export const exportSurveyToFile = async (surveyId: string): Promise<void> => {
  try {
    const response = await fetch(`/api/surveys/${surveyId}/export`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to export survey');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `survey-export-${Date.now()}.json`;

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

export const importSurveyFromFile = (file: File): Promise<SurveyExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const surveyData = JSON.parse(content) as SurveyExportData;
        
        // Validate the imported data structure
        if (!surveyData.survey?.title) {
          throw new Error('Invalid survey file format');
        }
        
        resolve(surveyData);
      } catch {
        reject(new Error('Failed to parse survey file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

interface ImportedSurveyResponse {
  id: string;
  title: string;
  slug: string;
  status: string;
  pages: Array<SurveyPage>;
}

export const uploadImportedSurvey = async (surveyData: SurveyExportData): Promise<ImportedSurveyResponse> => {
  try {
    const response = await fetch('/api/surveys/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ surveyData }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to import survey');
    }

    return await response.json();
  } catch (error) {
    console.error('Import error:', error);
    throw error;
  }
};

interface DuplicatedSurveyResponse {
  id: string;
  title: string;
  slug: string;
  status: string;
  pages: Array<SurveyPage>;
}

export const duplicateSurvey = async (surveyId: string): Promise<DuplicatedSurveyResponse> => {
  try {
    const response = await fetch(`/api/surveys/${surveyId}/duplicate`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to duplicate survey');
    }

    return await response.json();
  } catch (error) {
    console.error('Duplicate error:', error);
    throw error;
  }
};
