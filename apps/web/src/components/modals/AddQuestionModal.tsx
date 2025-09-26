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

const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingQuestion,
}) => {
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [categories, setCategories] = useState<Array<{id: string; name: string; count: number}>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState<Array<{ id: string; text: string }>>([]);
  const [newOptionText, setNewOptionText] = useState('');
  const [settings, setSettings] = useState<Record<string, unknown>>({});

  // Helper function to populate form with editing question data
  const populateFormWithEditingQuestion = useCallback(() => {
    if (!editingQuestion) return;
    
    setSelectedType(editingQuestion.type);
    setTitle(editingQuestion.title || '');
    setDescription(editingQuestion.description || '');
    setRequired(!!editingQuestion.required);
    setOptions(editingQuestion.options || []);
    setSettings(editingQuestion.settings || {});
  }, [editingQuestion]);

  // Helper function to reset form to initial state
  const resetFormToDefaults = useCallback(() => {
    setSelectedType(null);
    setTitle('');
    setDescription('');
    setRequired(false);
    setOptions([]);
    setSettings({});
  }, []);

  // Reduced complexity useEffect - now just handles modal open/close logic
  useEffect(() => {
    if (!isOpen) return;
    
    fetchQuestionTypes();
    
    if (editingQuestion) {
      populateFormWithEditingQuestion();
    } else {
      resetFormToDefaults();
    }
  }, [isOpen, editingQuestion, populateFormWithEditingQuestion, resetFormToDefaults]);

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

  const filteredTypes = selectedCategory === 'all' 
    ? questionTypes 
    : questionTypes.filter(type => type.category === selectedCategory);

  // Helper function to get default options for choice-based question types
  const getDefaultOptionsForType = (type: string) => {
    const choiceTypes = ['singleChoice', 'multiChoice', 'dropdown'];
    return choiceTypes.includes(type) 
      ? [{ id: '1', text: 'Option 1' }, { id: '2', text: 'Option 2' }] 
      : [];
  };

  // Helper function to get default settings for different question types
  const getDefaultSettingsForType = (type: string) => {
    const settingsMap: Record<string, Record<string, unknown>> = {
      slider: { scaleMin: 0, scaleMax: 10, scaleStep: 1 },
      ratingStar: { maxRating: 5 },
      ratingSmiley: { maxRating: 5 },
      ratingNumber: { maxRating: 10 }
    };
    
    return settingsMap[type] || {};
  };

  // Simplified previewQuestion computation
  const previewQuestion = useMemo(() => {
    const type = selectedType || hoveredType || 'textShort';
    const baseQuestion: Question = {
      id: 'preview',
      type,
      title: title || 'Preview Question',
      description: description,
      required,
      options: [],
      settings: {},
    };

    // Set options for choice-based questions
    const choiceTypes = ['singleChoice', 'multiChoice', 'dropdown'];
    if (choiceTypes.includes(type)) {
      baseQuestion.options = options.length === 0 
        ? getDefaultOptionsForType(type)
        : options;
    }

    // Set default settings based on type
    baseQuestion.settings = { ...getDefaultSettingsForType(type), ...settings };

    return baseQuestion;
  }, [selectedType, hoveredType, title, description, required, options, settings]);

  const handleChooseType = (type: string) => {
    setSelectedType(type);
    
    // Only set defaults when not editing
    if (editingQuestion) return;
    
    setOptions(getDefaultOptionsForType(type));
    setSettings(getDefaultSettingsForType(type));
    
    if (!title) {
      setTitle('New Question');
    }
  };

  const handleSave = () => {
    const type = selectedType || hoveredType;
    if (!type) return;
    
    const question: Question = {
      id: editingQuestion?.id || `q_${Date.now()}`,
      type,
      title: title || 'Untitled Question',
      description,
      required,
      options: getDefaultOptionsForType(type).length > 0 ? options : undefined,
      settings,
    };
    
    try { 
      onSubmit(question); 
    } catch (err) { 
      console.error(err); 
    }
    
    try { 
      onClose(); 
    } catch (err) { 
      console.error(err); 
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Question"
      size="xl"
    >
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
              {/* Question Types Grid */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Choose Question Type
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {filteredTypes.map((type) => (
                    <button
                      key={type.type}
                      onClick={() => handleChooseType(type.type)}
                      onMouseEnter={() => setHoveredType(type.type)}
                      onMouseLeave={() => setHoveredType(null)}
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
              </div>

              {/* Editor + Live Preview */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {editingQuestion ? 'Edit Question' : 'Configure Question'}
                </h3>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Title</label>
                    <input
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Question title"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">Description</label>
                    <input
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional description"
                    />
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
                      Required
                    </label>
                  </div>

                  {(selectedType === 'singleChoice' || selectedType === 'multiChoice' || selectedType === 'dropdown') && (
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
                              onChange={(e) => {
                                const next = [...options];
                                next[idx] = { ...opt, text: e.target.value };
                                setOptions(next);
                              }}
                            />
                            <button
                              type="button"
                              className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              onClick={() => setOptions(options.filter((o) => o.id !== opt.id))}
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
                          onChange={(e) => setNewOptionText(e.target.value)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const t = newOptionText.trim();
                            if (!t) return;
                            const id = t.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                            setOptions((prev) => [...prev, { id, text: t }]);
                            setNewOptionText('');
                          }}
                        >
                          + Add
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedType === 'slider' && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300">Min</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                          value={Number((settings as any).scaleMin ?? 0)}
                          onChange={(e) => setSettings({ ...settings, scaleMin: parseInt(e.target.value || '0', 10) })}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300">Max</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                          value={Number((settings as any).scaleMax ?? 10)}
                          onChange={(e) => setSettings({ ...settings, scaleMax: parseInt(e.target.value || '0', 10) })}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300">Step</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                          value={Number((settings as any).scaleStep ?? 1)}
                          onChange={(e) => setSettings({ ...settings, scaleStep: parseInt(e.target.value || '1', 10) })}
                        />
                      </div>
                    </div>
                  )}

                  {(selectedType === 'ratingStar' || selectedType === 'ratingNumber' || selectedType === 'ratingSmiley') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300">Max Rating</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                          value={Number((settings as any).maxRating ?? (selectedType === 'ratingSmiley' ? 5 : selectedType === 'ratingStar' ? 5 : 10))}
                          onChange={(e) => {
                            let maxRating = parseInt(e.target.value || '0', 10);
                            
                            // Enforce limits based on question type
                            if (selectedType === 'ratingSmiley') {
                              maxRating = Math.min(Math.max(maxRating, 3), 5); // 3-5 for smileys
                            } else {
                              maxRating = Math.min(Math.max(maxRating, 1), 10); // 1-10 for stars and numbers
                            }
                            
                            setSettings({ ...settings, maxRating });
                          }}
                          min={selectedType === 'ratingSmiley' ? 3 : 1}
                          max={selectedType === 'ratingSmiley' ? 5 : 10}
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
                  )}

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Live Preview</div>
                    <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                      <QuestionRenderer question={previewQuestion} disabled={true} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => { try { onClose(); } catch (err) { console.error('Close error'); } }}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={!selectedType && !hoveredType}>
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