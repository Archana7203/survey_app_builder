import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

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
  settings?: Record<string, unknown> & {
    maxRating?: number;
    scaleMin?: number;
    scaleMax?: number;
    scaleStep?: number;
  };
}

interface QuestionSettingsPanelProps {
  selectedQuestion: Question | null;
  survey: any;
  setSurvey: (survey: any) => void;
  activePageIndex: number;
  setSelectedQuestion: (question: Question | null) => void;
  onEditVisibility: (questionId: string) => void;
}

const QuestionSettingsPanel: React.FC<QuestionSettingsPanelProps> = ({
  selectedQuestion,
  survey,
  setSurvey,
  activePageIndex,
  setSelectedQuestion,
  onEditVisibility,
}) => {
  // Check if this is the first question of the survey
  const isFirstQuestion = activePageIndex === 0 && survey?.pages?.[0]?.questions?.[0]?.id === selectedQuestion?.id;
  
  const updateQuestion = (updates: Partial<Question>) => {
    if (!survey || !selectedQuestion) return;
    
    const updatedPages = [...survey.pages];
    const questionIndex = updatedPages[activePageIndex].questions.findIndex(
      (q: Question) => q.id === selectedQuestion.id
    );
    
    if (questionIndex !== -1) {
      const updated = { ...selectedQuestion, ...updates };
      updatedPages[activePageIndex].questions[questionIndex] = updated;
      setSurvey({
        ...survey,
        id: survey.id,
        title: survey.title,
        pages: updatedPages,
      });
      setSelectedQuestion(updated);
    }
  };

  const updateQuestionSettings = (settings: any) => {
    updateQuestion({ settings: { ...selectedQuestion?.settings, ...settings } });
  };

  const addOption = () => {
    if (!selectedQuestion) return;

    // Generate a secure random ID using Web Crypto API (works in browser)
    const randomId = Array.from(
      globalThis.crypto.getRandomValues(new Uint8Array(4))
    ).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const newOption = { id: `option-${randomId}`, text: '' };
    const updatedOptions = [...(selectedQuestion.options || []), newOption];
    updateQuestion({ options: updatedOptions });
  };

  const removeOption = (optionId: string) => {
    if (!selectedQuestion) return;
    const updatedOptions = selectedQuestion.options?.filter((o: any) => o.id !== optionId) || [];
    updateQuestion({ options: updatedOptions });
  };

  const updateOption = (index: number, text: string) => {
    if (!selectedQuestion?.options) return;
    const updatedOptions = [...selectedQuestion.options];
    updatedOptions[index] = { ...updatedOptions[index], text };
    updateQuestion({ options: updatedOptions });
  };

  if (!selectedQuestion) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        Select a question to configure its settings
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        label="Question Title"
        value={selectedQuestion.title}
        onChange={(e) => updateQuestion({ title: e.target.value })}
        placeholder="Enter question"
      />
      
      <Input
        label="Help Text"
        value={selectedQuestion.description || ''}
        onChange={(e) => updateQuestion({ description: e.target.value })}
        placeholder="Optional help text"
      />
      
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={selectedQuestion.required}
          onChange={(e) => updateQuestion({ required: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Required</span>
      </label>

      {/* Question Type Specific Settings */}
      <QuestionTypeSettings
        question={selectedQuestion}
        updateQuestionSettings={updateQuestionSettings}
        addOption={addOption}
        removeOption={removeOption}
        updateOption={updateOption}
      />

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEditVisibility(selectedQuestion.id)}
          className="w-full"
          disabled={isFirstQuestion}
        >
          Configure Visibility Rules
        </Button>
        {isFirstQuestion && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            The first question is always visible
          </p>
        )}
      </div>
    </div>
  );
};

interface QuestionTypeSettingsProps {
  question: Question;
  updateQuestionSettings: (settings: any) => void;
  addOption: () => void;
  removeOption: (optionId: string) => void;
  updateOption: (index: number, text: string) => void;
}

const QuestionTypeSettings: React.FC<QuestionTypeSettingsProps> = ({
  question,
  updateQuestionSettings,
  addOption,
  removeOption,
  updateOption
}) => {
  const isChoiceType = ['singleChoice', 'multiChoice', 'dropdown'].includes(question.type);
  const isRatingType = ['ratingStar', 'ratingSmiley', 'ratingNumber'].includes(question.type);
  const isSliderType = question.type === 'slider';
  
  // Local state for input values to allow free typing
  const [maxRatingInput, setMaxRatingInput] = useState(String(question.settings?.maxRating || 5));
  const [scaleMinInput, setScaleMinInput] = useState(String(question.settings?.scaleMin || 0));
  const [scaleMaxInput, setScaleMaxInput] = useState(String(question.settings?.scaleMax || 100));
  const [scaleStepInput, setScaleStepInput] = useState(String(question.settings?.scaleStep || 1));
  
  // Update local state when question settings change
  useEffect(() => {
    setMaxRatingInput(String(question.settings?.maxRating || 5));
  }, [question.settings?.maxRating]);
  
  useEffect(() => {
    setScaleMinInput(String(question.settings?.scaleMin || 0));
  }, [question.settings?.scaleMin]);
  
  useEffect(() => {
    setScaleMaxInput(String(question.settings?.scaleMax || 100));
  }, [question.settings?.scaleMax]);
  
  useEffect(() => {
    setScaleStepInput(String(question.settings?.scaleStep || 1));
  }, [question.settings?.scaleStep]);
  
  // Helper function to show alert
  const showRangeAlert = (min: number, max: number, fieldName: string) => {
    alert(`Please enter a value between ${min} and ${max} for ${fieldName}`);
  };

  if (isChoiceType) {
    return (
      <div className="space-y-2">
        <label htmlFor="option" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Options
        </label>
        {question.options?.map((option: any, index: number) => (
          <div key={option.id} className="flex items-center gap-2">
            <Input
              id="option"
              value={option.text}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeOption(option.id)}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={addOption}
        >
          + Add Option
        </Button>
      </div>
    );
  }

  if (isRatingType) {
    const minRating = question.type === 'ratingSmiley' ? 3 : 1;
    const maxRating = question.type === 'ratingSmiley' ? 5 : 10;
    
    return (
      <div className="space-y-4">
        <Input
          type="number"
          label="Maximum Rating"
          value={maxRatingInput}
          onChange={(e) => {
            // Allow free typing by updating local state
            setMaxRatingInput(e.target.value);
          }}
          onBlur={(e) => {
            const inputValue = e.target.value;
            
            // If empty or invalid, reset to default
            if (inputValue === '' || isNaN(Number.parseInt(inputValue))) {
              setMaxRatingInput('5');
              updateQuestionSettings({ maxRating: 5 });
              return;
            }
            
            let inputRating = Number.parseInt(inputValue);
            
            // Check if value is out of range and show alert
            if (inputRating < minRating || inputRating > maxRating) {
              showRangeAlert(minRating, maxRating, 'Maximum Rating');
              // Reset to current valid value
              const currentValue = question.settings?.maxRating || 5;
              setMaxRatingInput(String(currentValue));
              return;
            }
            
            // Value is valid, update settings
            setMaxRatingInput(String(inputRating));
            updateQuestionSettings({ maxRating: inputRating });
          }}
          min={minRating}
          max={maxRating}
          placeholder={`${minRating}-${maxRating}`}
        />
      </div>
    );
  }

  if (isSliderType) {
    return (
      <div className="space-y-4">
        <Input
          type="number"
          label="Minimum Value"
          value={scaleMinInput}
          onChange={(e) => {
            // Allow free typing by updating local state
            setScaleMinInput(e.target.value);
          }}
          onBlur={(e) => {
            const inputValue = e.target.value;
            
            // If empty or invalid, reset to default
            if (inputValue === '' || isNaN(Number.parseInt(inputValue))) {
              setScaleMinInput('0');
              updateQuestionSettings({ scaleMin: 0 });
            } else {
              const minValue = Number.parseInt(inputValue);
              setScaleMinInput(String(minValue));
              updateQuestionSettings({ scaleMin: minValue });
            }
          }}
          placeholder="0"
        />
        <Input
          type="number"
          label="Maximum Value"
          value={scaleMaxInput}
          onChange={(e) => {
            // Allow free typing by updating local state
            setScaleMaxInput(e.target.value);
          }}
          onBlur={(e) => {
            const inputValue = e.target.value;
            
            // If empty or invalid, reset to default
            if (inputValue === '' || isNaN(Number.parseInt(inputValue))) {
              setScaleMaxInput('100');
              updateQuestionSettings({ scaleMax: 100 });
            } else {
              const maxValue = Number.parseInt(inputValue);
              setScaleMaxInput(String(maxValue));
              updateQuestionSettings({ scaleMax: maxValue });
            }
          }}
          placeholder="100"
        />
        <Input
          type="number"
          label="Step Size"
          value={scaleStepInput}
          onChange={(e) => {
            // Allow free typing by updating local state
            setScaleStepInput(e.target.value);
          }}
          onBlur={(e) => {
            const inputValue = e.target.value;
            
            // If empty or invalid, reset to default
            if (inputValue === '' || isNaN(Number.parseInt(inputValue))) {
              setScaleStepInput('1');
              updateQuestionSettings({ scaleStep: 1 });
            } else {
              const stepValue = Number.parseInt(inputValue);
              
              // Check if step size is less than 1
              if (stepValue < 1) {
                showRangeAlert(1, 20, 'Step Size');
                // Reset to current valid value
                const currentValue = question.settings?.scaleStep || 1;
                setScaleStepInput(String(currentValue));
                return;
              }
              
              // Value is valid, update settings
              setScaleStepInput(String(stepValue));
              updateQuestionSettings({ scaleStep: stepValue });
            }
          }}
          min={1}
          placeholder="1"
        />
      </div>
    );
  }

  return null;
};

export default QuestionSettingsPanel;
