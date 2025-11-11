export interface TemplateSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  estimatedTime: string;
  createdBy: string | null;
}

export interface TemplateQuestionSummary {
  id: string;
  title: string;
  type: string;
  description?: string;
  required?: boolean;
  options?: Array<{ id: string; text: string }>;
  settings?: Record<string, unknown>;
}

export interface TemplateDetails extends TemplateSummary {
  pages: Array<{
    questions: Array<TemplateQuestionSummary>;
  }>;
}

