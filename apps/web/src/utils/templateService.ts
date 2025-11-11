import type { TemplateSummary, TemplateDetails } from '../types/templates';

interface TemplatePage {
  questions: TemplateDetails['pages'][number]['questions'];
  branching?: Array<Record<string, unknown>>;
}

const normalizeSummary = (template: any): TemplateSummary => ({
  id: template.id,
  title: template.title,
  description: template.description,
  category: template.category,
  thumbnail: template.thumbnail,
  estimatedTime: template.estimatedTime,
  createdBy:
    template.createdBy !== undefined && template.createdBy !== null
      ? String(template.createdBy)
      : null,
});

const normalizeDetails = (template: any): TemplateDetails => ({
  ...normalizeSummary(template),
  pages: Array.isArray(template.pages) ? template.pages : [],
});

export const fetchTemplates = async (): Promise<TemplateSummary[]> => {
  try {
    const response = await fetch('/api/templates', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }

    const data = await response.json();
    return Array.isArray(data) ? data.map(normalizeSummary) : [];
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

    const data = await response.json();
    return normalizeDetails(data);
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

export const importTemplate = async (templateData: unknown): Promise<TemplateDetails> => {
  try {
    const response = await fetch('/api/templates/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(templateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to import template');
    }

    const data = await response.json();
    return normalizeDetails(data);
  } catch (error) {
    console.error('Error importing template:', error);
    throw error;
  }
};

export const updateTemplate = async (
  templateId: string,
  updates: {
    category: string;
    estimatedTime: string;
  },
): Promise<TemplateDetails> => {
  try {
    const response = await fetch(`/api/templates/${templateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update template');
    }

    const data = await response.json();
    return normalizeDetails(data);
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
};

export const deleteTemplate = async (templateId: string): Promise<void> => {
  try {
    const response = await fetch(`/api/templates/${templateId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete template');
    }
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
};
