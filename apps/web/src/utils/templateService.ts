interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  estimatedTime: string;
}

interface TemplateQuestion {
  id: string;
  type: string;
  title: string;
  description?: string;
  required?: boolean;
  options?: Array<{ id: string; text: string }>;
  settings?: Record<string, unknown>;
}

interface TemplatePage {
  questions: Array<TemplateQuestion>;
  branching?: Array<Record<string, unknown>>;
}

interface TemplateDetails extends Template {
  pages: Array<TemplatePage>;
}

export const fetchTemplates = async (): Promise<Template[]> => {
  try {
    const response = await fetch('/api/templates', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

export const fetchTemplateById = async (templateId: string): Promise<TemplateDetails> => {
  try {
    const response = await fetch(`/api/templates/${templateId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch template details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching template details:', error);
    throw error;
  }
};

interface InstantiatedSurvey {
  id: string;
  title: string;
  description: string;
  slug: string;
  theme: string;
  status: string;
  pages: Array<TemplatePage>;
  templateId: string;
  createdAt: string;
  updatedAt: string;
}

export const instantiateTemplate = async (templateId: string): Promise<InstantiatedSurvey> => {
  try {
    const response = await fetch(`/api/templates/${templateId}/instantiate`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create survey from template');
    }

    return await response.json();
  } catch (error) {
    console.error('Error instantiating template:', error);
    throw error;
  }
};
