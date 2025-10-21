import { exportSurveyApi, duplicateSurveyApi, uploadImportedSurveyApi } from "../api-paths/surveysApi";
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
    const blob = await exportSurveyApi(surveyId); // call service
    const contentDisposition = 'attachment; filename="survey.json"'; // fallback filename if API doesn't provide headers
    const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `survey-export-${Date.now()}.json`;

    // Create download link
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    globalThis.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};
export const importSurveyFromFile = async (file: File): Promise<SurveyExportData> => {
  try {
    const content = await file.text();
    const surveyData = JSON.parse(content) as SurveyExportData;
    
    // Validate the imported data structure
    if (!surveyData.survey?.title) {
      throw new Error('Invalid survey file format');
    }
    
    return surveyData;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse survey file');
    }
    throw error instanceof Error ? error : new Error('Failed to read file');
  }
};

export const uploadImportedSurvey = async (surveyData: SurveyExportData)=> {
  try {
    const imported = await uploadImportedSurveyApi(surveyData);
    console.log('Imported survey:', imported);
  } catch (err) {
    console.error('Import error:', err);
  }
};

export const duplicateSurvey = async (surveyId: string) => {
  try {
    const duplicated = await duplicateSurveyApi(surveyId);
    console.log('Duplicated survey:', duplicated);
  } catch (err) {
    console.error('Duplicate error:', err);
  }
};
