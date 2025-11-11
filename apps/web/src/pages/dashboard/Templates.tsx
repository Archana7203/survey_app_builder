import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  fetchTemplates,
  fetchTemplateById,
  instantiateTemplate,
  importTemplate as importTemplateApi,
  updateTemplate as updateTemplateApi,
  deleteTemplate as deleteTemplateApi,
} from '../../utils/templateService';
import { ensureTemplateSamples } from '../../api-paths/templatesApi';
import { showErrorToast } from '../../utils/toast';
import TemplatePreviewModal from '../../components/modals/TemplatePreviewModal';
import ImportSurveyModal from '../../components/modals/ImportSurveyModal';
import TemplateEditModal from '../../components/modals/TemplateEditModal';
import type { TemplateDetails, TemplateSummary } from '../../types/templates';
import { Settings, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instantiating, setInstantiating] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateDetailsCache, setTemplateDetailsCache] = useState<Record<string, TemplateDetails>>({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportingTemplate, setIsImportingTemplate] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateSummary | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editEstimatedTime, setEditEstimatedTime] = useState('5 min');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);
  useEffect(() => {
    if (error) {
      showErrorToast(error);
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
      showErrorToast('Error loading templates');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantiateTemplate = async (templateId: string) => {
    setInstantiating(templateId);
    setError(null);
    try {
      const newSurvey = await instantiateTemplate(templateId);
      setSelectedTemplateId(null);
      navigate(`/dashboard/surveys/${newSurvey.id}/edit`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error creating survey from template');
    } finally {
      setInstantiating(null);
    }
  };

  const handleOpenDetails = async (templateId: string) => {
      setDetailsError(null);
      setSelectedTemplateId(templateId);

      if (templateDetailsCache[templateId]) {
        return;
      }

      setDetailsLoading(true);
      try {
        const details = await fetchTemplateById(templateId);
        setTemplateDetailsCache((prev) => ({
          ...prev,
          [templateId]: details,
        }));
      } catch (fetchError: unknown) {
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : 'Failed to load template details';
        setDetailsError(message);
        showErrorToast(message);
      } finally {
        setDetailsLoading(false);
      }
  };

  const handleCloseDetails = () => {
    setSelectedTemplateId(null);
    setDetailsError(null);
    setDetailsLoading(false);
  };

  const handleOpenImportModal = () => {
    setImportSuccess(false);
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    if (isImportingTemplate) return;
    setIsImportModalOpen(false);
    setImportSuccess(false);
  };

  const handleImportTemplateFile = async (file: File): Promise<boolean> => {
    setIsImportingTemplate(true);
    setImportSuccess(false);
    try {
      const fileContent = await file.text();
      const parsed = JSON.parse(fileContent);
      const imported = await importTemplateApi(parsed);

      const summary: TemplateSummary = {
        id: imported.id,
        title: imported.title,
        description: imported.description,
        category: imported.category,
        thumbnail: imported.thumbnail,
        estimatedTime: imported.estimatedTime,
        createdBy: imported.createdBy,
      };

      setTemplateDetailsCache((prev) => ({
        ...prev,
        [imported.id]: imported,
      }));

      setTemplates((prev) => {
        const filtered = prev.filter((tpl) => tpl.id !== summary.id);
        return [summary, ...filtered];
      });

      setImportSuccess(true);
      return true;
    } catch (importError) {
      const message =
        importError instanceof Error
          ? importError.message
          : 'Failed to import template';
      showErrorToast(message);
      return false;
    } finally {
      setIsImportingTemplate(false);
    }
  };

  const handleOpenEditModal = (template: TemplateSummary) => {
    setEditingTemplate(template);
    setEditCategory(template.category);
    setEditEstimatedTime(template.estimatedTime);
    setEditError(null);
  };

  const handleCloseEditModal = () => {
    if (editSaving) return;
    setEditingTemplate(null);
    setEditError(null);
  };

  const handleSaveTemplateEdits = async () => {
    if (!editingTemplate) return;

    const trimmedCategory = editCategory.trim();
    const trimmedTime = editEstimatedTime.trim();

    if (!trimmedCategory) {
      setEditError('Category is required.');
      return;
    }

    if (!trimmedTime) {
      setEditError('Estimated time is required.');
      return;
    }

    const normalizedTime = trimmedTime.toLowerCase().endsWith('min')
      ? trimmedTime
      : `${trimmedTime} min`;

    setEditSaving(true);
    setEditError(null);
    try {
      const updated = await updateTemplateApi(editingTemplate.id, {
        category: trimmedCategory,
        estimatedTime: normalizedTime,
      });

      const summary: TemplateSummary = {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        category: updated.category,
        thumbnail: updated.thumbnail,
        estimatedTime: updated.estimatedTime,
        createdBy: updated.createdBy,
      };

      setTemplates((prev) =>
        prev.map((template) => (template.id === summary.id ? summary : template)),
      );

      setTemplateDetailsCache((prev) => ({
        ...prev,
        [summary.id]: updated,
      }));

      setEditingTemplate(null);
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Failed to update template';
      setEditError(message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteTemplate = async (template: TemplateSummary) => {
    if (
      !currentUserId ||
      !template.createdBy ||
      template.createdBy !== currentUserId
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Delete template "${template.title}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingTemplateId(template.id);
    try {
      await deleteTemplateApi(template.id);
      setTemplates((prev) => prev.filter((tpl) => tpl.id !== template.id));
      setTemplateDetailsCache((prev) => {
        const { [template.id]: _, ...rest } = prev;
        return rest;
      });
      if (selectedTemplateId === template.id) {
        handleCloseDetails();
      }
      if (editingTemplate?.id === template.id) {
        setEditingTemplate(null);
      }
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : 'Failed to delete template';
      showErrorToast(message);
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const selectedTemplateDetails = useMemo(() => {
    if (!selectedTemplateId) return null;
    return templateDetailsCache[selectedTemplateId] ?? null;
  }, [selectedTemplateId, templateDetailsCache]);

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

  const categories = useMemo(() => {
    const unique = new Set<string>(['Healthcare', 'Research', 'Education', 'Business', 'Custom']);
    templates.forEach((template) => {
      if (template.category && template.category.trim()) {
        unique.add(template.category.trim());
      }
    });
    return Array.from(unique);
  }, [templates]);
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Templates</h1>
        <p className="text-gray-600 dark:text-white">
          Choose from professionally designed survey templates to get started quickly
        </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOpenImportModal}>
          📥 Import
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl">
        <div className="relative">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-black placeholder-gray-500 dark:placeholder-gray-400"
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
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-black hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span className="text-sm font-medium">All</span>
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                    selectedCategory === 'all'
                      ? 'bg-white text-blue-600'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-black'
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
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-black hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="text-sm font-medium">{category}</span>
                  <span
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                      selectedCategory === category
                        ? 'bg-white text-blue-600'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-black'
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
                onPreview={handleOpenDetails}
                instantiating={instantiating === template.id}
                formatTime={formatTime}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteTemplate}
                isOwned={Boolean(
                  currentUserId &&
                    template.createdBy &&
                    template.createdBy === currentUserId,
                )}
                isDeleting={deletingTemplateId === template.id}
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

      <TemplatePreviewModal
        isOpen={Boolean(selectedTemplateId)}
        onClose={handleCloseDetails}
        template={selectedTemplateDetails}
        isLoading={detailsLoading && !selectedTemplateDetails}
        error={detailsError}
        onUseTemplate={() => {
          if (selectedTemplateId && !instantiating) {
            void handleInstantiateTemplate(selectedTemplateId);
          }
        }}
        isInstantiating={
          Boolean(selectedTemplateId && instantiating === selectedTemplateId)
        }
      />
      <ImportSurveyModal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        onFileSelected={handleImportTemplateFile}
        isUploading={isImportingTemplate}
        isSuccess={importSuccess}
        modalTitle="Import Template"
        inputLabel="Choose a template JSON file"
        helperText="Upload a template exported from this app (.json)."
        uploadButtonLabel="Import"
        successTitle="Template imported successfully!"
        successSubtitle="You can close this window or import another template."
      />
      <TemplateEditModal
        isOpen={Boolean(editingTemplate)}
        templateTitle={editingTemplate?.title ?? null}
        category={editCategory}
        estimatedTime={editEstimatedTime}
        onCategoryChange={setEditCategory}
        onEstimatedTimeChange={setEditEstimatedTime}
        onClose={handleCloseEditModal}
        onSave={handleSaveTemplateEdits}
        saving={editSaving}
        error={editError}
      />
    </div>
  );
};

interface TemplateCardProps {
  template: TemplateSummary;
  onPreview: (templateId: string) => void;
  instantiating: boolean;
  formatTime: (time: string) => string;
  onEdit: (template: TemplateSummary) => void;
  onDelete: (template: TemplateSummary) => void;
  isOwned: boolean;
  isDeleting: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onPreview,
  instantiating,
  formatTime,
  onEdit,
  onDelete,
  isOwned,
  isDeleting,
}) => {
  return (
    <Card className="relative flex h-full flex-col overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {isOwned && (
        <div className="absolute right-2 top-2 flex items-center gap-2">
          <button
            type="button"
            className="rounded-full p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(template);
            }}
            aria-label={`Edit template ${template.title}`}
            disabled={isDeleting}
          >
            <Settings className="h-4 w-4" />
          </button>
      <button
        type="button"
            className="rounded-full p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
        onClick={(event) => {
          event.stopPropagation();
              onDelete(template);
        }}
            aria-label={`Delete template ${template.title}`}
            disabled={isDeleting}
      >
            <Trash2 className="h-4 w-4" />
      </button>
        </div>
      )}
      {/* Template Info */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col gap-1.5">
          <h3 className="line-clamp-2 min-h-[3.5rem] text-base font-semibold leading-snug text-gray-900 dark:text-white">
          {template.title}
        </h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {template.category}
          </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(template.estimatedTime)}
          </span>
        </div>
        </div>
        <p className="line-clamp-2 text-sm leading-5 text-gray-600 dark:text-gray-300">
          {template.description}
        </p>
      </div>

      {/* Action Button */}
      <div className="mt-auto border-t border-gray-200 px-4 py-3 dark:border-gray-700">
        <Button
          onClick={() => onPreview(template.id)}
          disabled={instantiating}
          className="w-full text-sm"
        >
          {instantiating ? 'Creating...' : 'Preview Template'}
        </Button>
      </div>
    </Card>
  );
};

export default Templates;
