import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
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

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instantiating, setInstantiating] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);
  useEffect(() => {
    if (error) {
      alert(error);
      setError(null);
    }
  }, [error]);
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
        await ensureTemplateSamples();
        data = await fetchTemplates();
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
      navigate(`/dashboard/surveys/${newSurvey.id}/edit`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error creating survey from template');
    } finally {
      setInstantiating(null);
    }
  };

  const getFilteredTemplates = () => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const getCategoryCount = (category: string) => {
    if (category === 'all') return templates.length;
    return templates.filter(t => t.category === category).length;
  };

  const formatTime = (time: string) => {
    return time.replace('minutes', 'min').replace('minute', 'min');
  };

  const categories = ['Healthcare', 'Research', 'Education', 'Business'];
  const filteredTemplates = getFilteredTemplates();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Templates</h1>
          <p className="text-gray-600 dark:text-gray-400">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Matching Results.tsx structure */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Templates</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose from professionally designed survey templates to get started quickly
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl">
        <div className="relative">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex gap-6">
        {/* Left Sidebar - Category Filter */}
        <aside className="w-56 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
              Categories
            </h2>
            
            <div className="space-y-1.5">
              {/* All Categories */}
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-all duration-200 ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span className="text-sm font-medium">All</span>
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                    selectedCategory === 'all'
                      ? 'bg-white text-blue-600'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {getCategoryCount('all')}
                </span>
              </button>

              {/* Individual Categories */}
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="text-sm font-medium">{category}</span>
                  <span
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                      selectedCategory === category
                        ? 'bg-white text-blue-600'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {getCategoryCount(category)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onInstantiate={handleInstantiateTemplate}
                instantiating={instantiating === template.id}
                formatTime={formatTime}
              />
            ))}
          </div>

          {filteredTemplates.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-600 text-base font-medium mb-1">
                No templates found
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Try selecting a different category or adjusting your search.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

interface TemplateCardProps {
  template: Template;
  onInstantiate: (templateId: string) => void;
  instantiating: boolean;
  formatTime: (time: string) => string;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onInstantiate, instantiating, formatTime }) => {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
      {/* Template Header */}
      <div className="relative pb-2/3 bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-3xl">
          {template.thumbnail}
        </div>
      </div>

      {/* Template Info */}
      <div className="flex-1 p-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          {template.title}
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
            {template.category}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(template.estimatedTime)}
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {template.description}
        </p>
      </div>

      {/* Action Button */}
      <div className="p-4 pt-0">
        <Button
          onClick={() => onInstantiate(template.id)}
          disabled={instantiating}
          className="w-full text-sm"
        >
          {instantiating ? 'Creating...' : 'Use This Template'}
        </Button>
      </div>
    </Card>
  );
};

export default Templates;
