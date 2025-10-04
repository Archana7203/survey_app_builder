import React from 'react';
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
  isDisabled?: boolean;
}

const QuestionSettingsPanel: React.FC<QuestionSettingsPanelProps> = ({
  selectedQuestion,
  survey,
  setSurvey,
  activePageIndex,
  setSelectedQuestion,
  onEditVisibility,
  isDisabled = false
}) => {
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
        disabled={isDisabled}
      />
      
      <Input
        label="Help Text"
        value={selectedQuestion.description || ''}
        onChange={(e) => updateQuestion({ description: e.target.value })}
        placeholder="Optional help text"
        disabled={isDisabled}
      />
      
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={selectedQuestion.required}
          onChange={(e) => updateQuestion({ required: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
          disabled={isDisabled}
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
        isDisabled={isDisabled}
      />

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEditVisibility(selectedQuestion.id)}
          className="w-full"
          disabled={isDisabled}
        >
          Configure Visibility Rules
        </Button>
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
  isDisabled: boolean;
}

const QuestionTypeSettings: React.FC<QuestionTypeSettingsProps> = ({
  question,
  updateQuestionSettings,
  addOption,
  removeOption,
  updateOption,
  isDisabled
}) => {
  const isChoiceType = ['singleChoice', 'multiChoice', 'dropdown'].includes(question.type);
  const isRatingType = ['ratingStar', 'ratingSmiley', 'ratingNumber'].includes(question.type);
  const isSliderType = question.type === 'slider';

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
              disabled={isDisabled}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeOption(option.id)}
              className="text-red-600 hover:text-red-800"
              disabled={isDisabled}
            >
              ×
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={addOption}
          disabled={isDisabled}
        >
          + Add Option
        </Button>
      </div>
    );
  }

  if (isRatingType) {
    return (
      <div className="space-y-4">
        <Input
          type="number"
          label="Maximum Rating"
          value={question.settings?.maxRating || 5}
          onChange={(e) => {
            let maxRating = Number.parseInt(e.target.value);
            
            // Enforce limits based on question type
            if (question.type === 'ratingSmiley') {
              maxRating = Math.min(Math.max(maxRating, 3), 5); // 3-5 for smileys
            } else {
              maxRating = Math.min(Math.max(maxRating, 1), 10); // 1-10 for stars and numbers
            }
            
            updateQuestionSettings({ maxRating });
          }}
          min={question.type === 'ratingSmiley' ? 3 : 1}
          max={question.type === 'ratingSmiley' ? 5 : 10}
          disabled={isDisabled}
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
          value={question.settings?.scaleMin || 0}
          onChange={(e) => updateQuestionSettings({ scaleMin: Number.parseInt(e.target.value) })}
          disabled={isDisabled}
        />
        <Input
          type="number"
          label="Maximum Value"
          value={question.settings?.scaleMax || 100}
          onChange={(e) => updateQuestionSettings({ scaleMax: Number.parseInt(e.target.value) })}
          disabled={isDisabled}
        />
        <Input
          type="number"
          label="Step Size"
          value={question.settings?.scaleStep || 1}
          onChange={(e) => updateQuestionSettings({ scaleStep: Number.parseInt(e.target.value) })}
          min={1}
          disabled={isDisabled}
        />
      </div>
    );
  }

  return null;
};

export default QuestionSettingsPanel;
