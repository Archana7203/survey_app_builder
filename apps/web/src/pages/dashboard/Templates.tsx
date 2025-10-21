import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { fetchTemplates, instantiateTemplate } from '../../utils/templateService';
import { ensureTemplateSamples } from '../../api-paths/templatesApi';

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  estimatedTime: string;
}

interface TemplatesByCategory {
  [category: string]: Template[];
}

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instantiating, setInstantiating] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      let data = await fetchTemplates();

      const hasHealthcare = data.some((t) => t.category === 'Healthcare');
      const hasResearch = data.some((t) => t.category === 'Research');
      const hasSamples =
        data.some((t) => t.id === 'covid-19-vaccination') &&
        data.some((t) => t.id === 'impact-of-social-media');

      if (!hasHealthcare || !hasResearch || !hasSamples) {
        await ensureTemplateSamples(); // call service
        data = await fetchTemplates(); // refetch after ensuring samples
      }

      setTemplates(data);
    } catch (error: any) {
      alert('Error loading templates');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantiateTemplate = async (templateId: string) => {
    setInstantiating(templateId);
    setError(null);
    
    try {
      const newSurvey = await instantiateTemplate(templateId);
      // Redirect to survey builder with the new survey
      navigate(`/dashboard/surveys/${newSurvey.id}/edit`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error creating survey from template');
    } finally {
      setInstantiating(null);
    }
  };

  const groupTemplatesByCategory = (templates: Template[]): TemplatesByCategory => {
    return templates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as TemplatesByCategory);
  };

  const getFilteredTemplates = () => {
    if (selectedCategory === 'all') {
      return templates;
    }
    return templates.filter(template => template.category === selectedCategory);
  };

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];
  const templatesByCategory = groupTemplatesByCategory(templates);
  const filteredTemplates = getFilteredTemplates();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Survey Templates</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose from professionally designed survey templates to get started quickly
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-500'
            }`}
          >
            {category === 'all' ? 'All Templates' : category}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {selectedCategory === 'all' ? (
        // Show by category when "all" is selected
        <div className="space-y-8">
          {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onInstantiate={handleInstantiateTemplate}
                    instantiating={instantiating === template.id}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Show filtered templates
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onInstantiate={handleInstantiateTemplate}
              instantiating={instantiating === template.id}
            />
          ))}
        </div>
      )}

      {filteredTemplates.length === 0 && !loading && (
        <Card>
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 text-gray-400 dark:text-gray-500 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No templates found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try selecting a different category or check back later.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

interface TemplateCardProps {
  template: Template;
  onInstantiate: (templateId: string) => void;
  instantiating: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onInstantiate, instantiating }) => {
  return (
    <Card className="h-full flex flex-col">
      <div className="p-6 flex-1">
        {/* Template Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="text-3xl">{template.thumbnail}</div>
          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
            {template.estimatedTime}
          </span>
        </div>

        {/* Template Info */}
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {template.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {template.category}
            </p>
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            {template.description}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-6 pt-0">
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={() => onInstantiate(template.id)}
          disabled={instantiating}
        >
          {instantiating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : (
            'Use This Template'
          )}
        </Button>
      </div>
    </Card>
  );
};

export default Templates;