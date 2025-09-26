import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { buildApiUrl } from '../../utils/apiConfig';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import QuestionRenderer from '../questions/QuestionRenderer';

interface QuestionType {
  type: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

interface Question {
  id: string;
  type: string;
  title: string;
  description?: string;
  required: boolean;
  options?: Array<{
    id: string;
    text: string;
    value?: string;
  }>;
  settings?: Record<string, unknown>;
}

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: Question) => void;
  editingQuestion?: Question | null;
}

// Separate component for question type selector
const QuestionTypeSelector: React.FC<{
  types: QuestionType[];
  selectedType: string | null;
  hoveredType: string | null;
  onTypeSelect: (type: string) => void;
  onTypeHover: (type: string | null) => void;
}> = ({ types, selectedType, hoveredType, onTypeSelect, onTypeHover }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
    {types.map((type) => (
      <button
        key={type.type}
        onClick={() => onTypeSelect(type.type)}
        onMouseEnter={() => onTypeHover(type.type)}
        onMouseLeave={() => onTypeHover(null)}
        className={`p-4 border-2 rounded-lg text-center transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 dark:hover:bg-[var(--color-primary)]/20 ${
          (selectedType === type.type || hoveredType === type.type)
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 dark:bg-[var(--color-primary)]/20'
            : 'border-gray-300 dark:border-gray-600'
        }`}
      >
        <div className="text-2xl mb-2">{type.icon}</div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {type.name}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {type.description}
        </div>
      </button>
    ))}
  </div>
);

// Separate component for basic question fields
const BasicQuestionFields: React.FC<{
  title: string;
  description: string;
  required: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onRequiredChange: (value: boolean) => void;
}> = ({ title, description, required, onTitleChange, onDescriptionChange, onRequiredChange }) => (
  <div className="grid grid-cols-1 gap-3">
    <label htmlFor="question-title" className="text-sm text-gray-700 dark:text-gray-300">Title</label>
    <input
      id="question-title"
      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
      value={title}
      onChange={(e) => onTitleChange(e.target.value)}
      placeholder="Question title"
    />
    <label htmlFor="opt-desc" className="text-sm text-gray-700 dark:text-gray-300">Description</label>
    <input
      id="opt-desc"
      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
      value={description}
      onChange={(e) => onDescriptionChange(e.target.value)}
      placeholder="Optional description"
    />
    <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
      <input type="checkbox" checked={required} onChange={(e) => onRequiredChange(e.target.checked)} />Required
    </label>
  </div>
);

// Separate component for choice options
const ChoiceOptionsEditor: React.FC<{
  options: Array<{ id: string; text: string }>;
  newOptionText: string;
  onOptionsChange: (options: Array<{ id: string; text: string }>) => void;
  onNewOptionTextChange: (text: string) => void;
}> = ({ options, newOptionText, onOptionsChange, onNewOptionTextChange }) => {
  const addOption = () => {
    const text = newOptionText.trim();
    if (!text) return;
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    onOptionsChange([...options, { id, text }]);
    onNewOptionTextChange('');
  };

  const updateOption = (index: number, text: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], text };
    onOptionsChange(updated);
  };

  const removeOption = (id: string) => {
    onOptionsChange(options.filter(opt => opt.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Choices</div>
      {options.length === 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">No options yet</div>
      )}
      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div key={opt.id} className="flex items-center gap-2">
            <input
              className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              value={opt.text}
              onChange={(e) => updateOption(idx, e.target.value)}
            />
            <button
              type="button"
              className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
              onClick={() => removeOption(opt.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
          placeholder="Add an option"
          value={newOptionText}
          onChange={(e) => onNewOptionTextChange(e.target.value)}
        />
        <Button variant="outline" size="sm" onClick={addOption}>
          + Add
        </Button>
      </div>
    </div>
  );
};

// Separate component for slider settings
const SliderSettings: React.FC<{
  settings: Record<string, unknown>;
  onSettingsChange: (settings: Record<string, unknown>) => void;
}> = ({ settings, onSettingsChange }) => {
  const updateSetting = (key: string, value: number) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label htmlFor="min" className="text-sm text-gray-700 dark:text-gray-300">Min</label>
        <input
          id="min"
          type="number"
          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
          value={Number((settings as any).scaleMin ?? 0)}
          onChange={(e) => updateSetting('scaleMin', parseInt(e.target.value || '0', 10))}
        />
      </div>
      <div>
        <label htmlFor="max" className="text-sm text-gray-700 dark:text-gray-300">Max</label>
        <input
          id="max"
          type="number"
          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
          value={Number((settings as any).scaleMax ?? 10)}
          onChange={(e) => updateSetting('scaleMax', parseInt(e.target.value || '0', 10))}
        />
      </div>
      <div>
        <label htmlFor="step" className="text-sm text-gray-700 dark:text-gray-300">Step</label>
        <input
          id="step"
          type="number"
          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
          value={Number((settings as any).scaleStep ?? 1)}
          onChange={(e) => updateSetting('scaleStep', parseInt(e.target.value || '1', 10))}
        />
      </div>
    </div>
  );
};

// Separate component for rating settings
const RatingSettings: React.FC<{
  selectedType: string;
  settings: Record<string, unknown>;
  onSettingsChange: (settings: Record<string, unknown>) => void;
}> = ({ selectedType, settings, onSettingsChange }) => {
  const getDefaultMaxRating = () => {
    if (selectedType === 'ratingSmiley') return 5;
    if (selectedType === 'ratingStar') return 5;
    return 10;
  };

  const getMinMaxRating = () => {
    if (selectedType === 'ratingSmiley') return { min: 3, max: 5 };
    return { min: 1, max: 10 };
  };

  const handleMaxRatingChange = (value: string) => {
    let maxRating = parseInt(value || '0', 10);
    const { min, max } = getMinMaxRating();
    maxRating = Math.min(Math.max(maxRating, min), max);
    onSettingsChange({ ...settings, maxRating });
  };

  const { min, max } = getMinMaxRating();

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label htmlFor="max-rating" className="text-sm text-gray-700 dark:text-gray-300">Max Rating</label>
        <input
          id="max-rating"
          type="number"
          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
          value={Number((settings as any).maxRating ?? getDefaultMaxRating())}
          onChange={(e) => handleMaxRatingChange(e.target.value)}
          min={min}
          max={max}
        />
        {selectedType === 'ratingSmiley' && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-1">
            <p><strong>3:</strong> Very Sad, Neutral, Very Happy</p>
            <p><strong>4:</strong> Very Sad, Neutral, Happy, Very Happy</p>
            <p><strong>5:</strong> Very Sad, Sad, Neutral, Happy, Very Happy</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Custom hook for question form state
const useQuestionForm = (editingQuestion?: Question | null) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState<Array<{ id: string; text: string }>>([]);
  const [settings, setSettings] = useState<Record<string, unknown>>({});

  const resetForm = useCallback(() => {
    setSelectedType(null);
    setTitle('');
    setDescription('');
    setRequired(false);
    setOptions([]);
    setSettings({});
  }, []);

  const populateForm = useCallback(() => {
    if (!editingQuestion) return;
    setSelectedType(editingQuestion.type);
    setTitle(editingQuestion.title || '');
    setDescription(editingQuestion.description || '');
    setRequired(!!editingQuestion.required);
    setOptions(editingQuestion.options || []);
    setSettings(editingQuestion.settings || {});
  }, [editingQuestion]);

  return {
    selectedType, setSelectedType,
    title, setTitle,
    description, setDescription,
    required, setRequired,
    options, setOptions,
    settings, setSettings,
    resetForm,
    populateForm
  };
};

// Custom hook for question types
const useQuestionTypes = () => {
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [categories, setCategories] = useState<Array<{id: string; name: string; count: number}>>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuestionTypes = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/questions/types'));
      if (response.ok) {
        const data = await response.json();
        setQuestionTypes(data.types);
        setCategories([{ id: 'all', name: 'All Types', count: 0 }, ...data.categories]);
      } else {
        setQuestionTypes([]);
        setCategories([{ id: 'all', name: 'All Types', count: 0 }]);
      }
    } catch {
      setQuestionTypes([]);
      setCategories([{ id: 'all', name: 'All Types', count: 0 }]);
    } finally {
      setLoading(false);
    }
  };

  return { questionTypes, categories, loading, fetchQuestionTypes };
};

const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingQuestion,
}) => {
  const { questionTypes, categories, loading, fetchQuestionTypes } = useQuestionTypes();
  const formState = useQuestionForm(editingQuestion);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  const [newOptionText, setNewOptionText] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    fetchQuestionTypes();
    if (editingQuestion) {
      formState.populateForm();
    } else {
      formState.resetForm();
    }
  }, [isOpen, editingQuestion, formState]);

  const filteredTypes = useMemo(() => 
    selectedCategory === 'all' 
      ? questionTypes 
      : questionTypes.filter(type => type.category === selectedCategory),
    [questionTypes, selectedCategory]
  );

  const isChoiceType = (type: string) => ['singleChoice', 'multiChoice', 'dropdown'].includes(type);
  const isRatingType = (type: string) => ['ratingStar', 'ratingNumber', 'ratingSmiley'].includes(type);

  const createPreviewQuestion = (): Question => {
    const type = formState.selectedType || hoveredType || 'textShort';
    return {
      id: 'preview',
      type,
      title: formState.title || 'Preview Question',
      description: formState.description,
      required: formState.required,
      options: isChoiceType(type) && formState.options.length === 0 
        ? [{ id: '1', text: 'Option 1' }, { id: '2', text: 'Option 2' }]
        : formState.options,
      settings: formState.settings,
    };
  };

  const handleTypeSelect = (type: string) => {
    formState.setSelectedType(type);
    if (editingQuestion) return;

    if (isChoiceType(type)) {
      formState.setOptions([{ id: '1', text: 'Option 1' }, { id: '2', text: 'Option 2' }]);
    } else {
      formState.setOptions([]);
    }

    const defaultSettings: Record<string, Record<string, unknown>> = {
      slider: { scaleMin: 0, scaleMax: 10, scaleStep: 1 },
      ratingStar: { maxRating: 5 },
      ratingSmiley: { maxRating: 5 },
      ratingNumber: { maxRating: 10 }
    };
    formState.setSettings(defaultSettings[type] || {});

    if (!formState.title) formState.setTitle('New Question');
  };

  const handleSave = () => {
    const type = formState.selectedType || hoveredType;
    if (!type) return;

    const question: Question = {
      id: editingQuestion?.id || `q_${Date.now()}`,
      type,
      title: formState.title || 'Untitled Question',
      description: formState.description,
      required: formState.required,
      options: isChoiceType(type) ? formState.options : undefined,
      settings: formState.settings,
    };

    try { onSubmit(question); } catch (err) { console.error(err); }
    try { onClose(); } catch (err) { console.error(err); }
  };

  const renderTypeSpecificEditor = () => {
    if (!formState.selectedType) return null;

    if (isChoiceType(formState.selectedType)) {
      return (
        <ChoiceOptionsEditor
          options={formState.options}
          newOptionText={newOptionText}
          onOptionsChange={formState.setOptions}
          onNewOptionTextChange={setNewOptionText}
        />
      );
    }

    if (formState.selectedType === 'slider') {
      return (
        <SliderSettings
          settings={formState.settings}
          onSettingsChange={formState.setSettings}
        />
      );
    }

    if (isRatingType(formState.selectedType)) {
      return (
        <RatingSettings
          selectedType={formState.selectedType}
          settings={formState.settings}
          onSettingsChange={formState.setSettings}
        />
      );
    }

    return null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Question" size="xl">
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading question types...</div>
          </div>
        ) : (
          <>
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Question Types */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Choose Question Type
                </h3>
                <QuestionTypeSelector
                  types={filteredTypes}
                  selectedType={formState.selectedType}
                  hoveredType={hoveredType}
                  onTypeSelect={handleTypeSelect}
                  onTypeHover={setHoveredType}
                />
              </div>

              {/* Editor + Preview */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {editingQuestion ? 'Edit Question' : 'Configure Question'}
                </h3>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 space-y-4">
                  <BasicQuestionFields
                    title={formState.title}
                    description={formState.description}
                    required={formState.required}
                    onTitleChange={formState.setTitle}
                    onDescriptionChange={formState.setDescription}
                    onRequiredChange={formState.setRequired}
                  />

                  {renderTypeSpecificEditor()}

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Live Preview</div>
                    <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                      <QuestionRenderer question={createPreviewQuestion()} disabled={true} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={handleSave} 
                disabled={!formState.selectedType && !hoveredType}
              >
                {editingQuestion ? 'Update Question' : 'Add Question'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default AddQuestionModal;