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
  settings?: Record<string, unknown>;
}

interface Survey {
  id: string;
  title: string;
  description?: string;
  theme?: string;
  backgroundColor?: string;
  textColor?: string;
}

interface InspectorPanelProps {
  readonly selectedQuestion: Question | null;
  readonly survey: Survey;
  readonly onSurveyUpdate: (updates: Partial<Survey>) => void;
  readonly onQuestionUpdate: (questionId: string, updates: Partial<Question>) => void;
  readonly onEditQuestion: (question: Question) => void;
}

function QuestionInspector({ 
  question, 
  onUpdate, 
  onEdit 
}: { 
  readonly question: Question; 
  readonly onUpdate: (updates: Partial<Question>) => void;
  readonly onEdit: (question: Question) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {question.type}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(question)}
          className="text-xs text-blue-600 dark:text-blue-400"
        >
          Advanced Settings →
        </Button>
      </div>

      {/* Basic Settings */}
      <div className="space-y-3">
        <Input
          label="Title"
          value={question.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Enter question"
        />

        <Input
          label="Help Text"
          value={question.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })} 
          placeholder="Optional help text"
        />

        <label className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            checked={question.required || false}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Required
          </span>
        </label>
      </div>

      {/* Type-specific Settings */}
      {(question.type === 'single_choice' || question.type === 'multi_choice' || question.type === 'dropdown') && (
        <div className="space-y-2 pt-2">
          <label htmlFor={`option-0`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Options
          </label>
          <div className="space-y-2">
            {(question.options || []).map((option, index) => (
              <div key={option.id} className="flex items-center gap-2">
                <div className="w-6 text-center text-xs text-gray-400">
                  {index + 1}
                </div>
                <Input
                  id={`option-${index}`}
                  value={option.text}
                  onChange={(e) => {
                      const newOptions = [...(question.options || [])];
                      newOptions[index] = { ...option, text: e.target.value };
                      onUpdate({ options: newOptions });
                  }}
                  placeholder="Enter option"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                      const newOptions = (question.options || []).filter((_, i) => i !== index);
                      onUpdate({ options: newOptions });
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                  const newOptions = [...(question.options || []), {
                    id: `opt_${Date.now()}`,
                    text: '',
                  }];
                  onUpdate({ options: newOptions });
              }}
              className="w-full text-[var(--color-primary)] dark:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 dark:hover:bg-[var(--color-primary)]/20"
            >
              + Add Option
            </Button>
          </div>
        </div>
      )}

      {question.type === 'rating_number' && (
        <div className="space-y-3 pt-2">
          <label htmlFor="maxRating" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Number Rating
          </label>
          <Input
            id="maxRating"
            label="Maximum Rating"
            type="number"
            value={(question.settings?.maxRating as number) || 10}
            onChange={(e) => {
                let maxRating = Number.parseInt(e.target.value, 10);
                // Enforce limit: 1-10 for number ratings
                maxRating = Math.min(Math.max(maxRating, 1), 10);
                onUpdate({ 
                  settings: { ...question.settings, maxRating }
                });
            }}
            min={1}
            max={10}
          />
        </div>
      )}

      {question.type === 'rating_star' && (
        <div className="space-y-3 pt-2">
          <label htmlFor="starRating" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Star Rating
          </label>
          <Input
            id="starRating"
            label="Number of Stars"
            type="number"
            value={(question.settings?.maxRating as number) || 5}
            onChange={(e) => {
                let maxRating = Number.parseInt(e.target.value, 10);
                // Enforce limit: 1-10 for star ratings
                maxRating = Math.min(Math.max(maxRating, 1), 10);
                onUpdate({ 
                  settings: { ...question.settings, maxRating }
                });
            }}
            min={1}
            max={10}
          />
        </div>
      )}

      {question.type === 'ratingSmiley' && (
        <div className="space-y-3 pt-2">
          <label htmlFor='smileyRating' className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Smiley Rating
          </label>
          <Input
            id="smileyRating"
            label="Number of Smileys"
            type="number"
            value={(question.settings?.maxRating as number) || 5}
            onChange={(e) => {
                let maxRating = Number.parseInt(e.target.value, 10);
                // Enforce limit: 3-5 for smiley ratings
                maxRating = Math.min(Math.max(maxRating, 3), 5);
                onUpdate({ 
                  settings: { ...question.settings, maxRating }
                });
            }}
            min={3}
            max={5}
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p><strong>3 smileys:</strong> Very Sad, Neutral, Very Happy</p>
            <p><strong>4 smileys:</strong> Very Sad, Neutral, Happy, Very Happy</p>
            <p><strong>5 smileys:</strong> Very Sad, Sad, Neutral, Happy, Very Happy</p>
          </div>
        </div>
      )}
    </div>
  );
}

function GlobalInspector({ 
  survey, 
  onUpdate 
}: { 
  readonly survey: Survey; 
  readonly onUpdate: (updates: Partial<Survey>) => void;
}) {
  const backgroundColor = survey.backgroundColor || '#ffffff';
  const textColor = survey.textColor || '#1f2937';
  const contrastRatio = getContrastRatio(backgroundColor, textColor);
  const meetsWCAG = contrastRatio >= 4.5;

  return (
    <div className="space-y-4">
      {/* Basic Settings */}
      <div className="space-y-3">
        <Input
          label="Survey Title"
          value={survey.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Enter title"
        />

        <Input
          label="Description"
          value={survey.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Optional description"
        />
      </div>

      {/* Theme selection removed — use background/text color controls */}

      {/* Colors */}
      <div className="pt-2 space-y-3">
        <label htmlFor="background-color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Colors
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="background-color"
            label="Background"
            type="color"
            value={backgroundColor}
            onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
          />
          <Input
            label="Text"
            type="color"
            value={textColor}
            onChange={(e) => onUpdate({ textColor: e.target.value })}
          />
        </div>

        {/* Contrast Check */}
        <div className={`
          flex items-center gap-2 px-3 py-2 rounded-md text-xs
          ${meetsWCAG 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
          }
        `}>
          <div className={`w-2 h-2 rounded-full ${meetsWCAG ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span>
            {meetsWCAG 
              ? `Good contrast (${contrastRatio.toFixed(1)}:1)` 
              : `Low contrast (${contrastRatio.toFixed(1)}:1)`
            }
          </span>
        </div>
      </div>
    </div>
  );
}

// WCAG AA contrast ratio checker
function getContrastRatio(color1: string, color2: string): number {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: Number.parseInt(result[1], 16),
      g: Number.parseInt(result[2], 16),
      b: Number.parseInt(result[3], 16)
    } : null;
  };

  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

export default function InspectorPanel({
  selectedQuestion,
  survey,
  onSurveyUpdate,
  onQuestionUpdate,
  onEditQuestion,
}: InspectorPanelProps) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {selectedQuestion ? 'Question Properties' : 'Survey Properties'}
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedQuestion ? (
          <QuestionInspector
            question={selectedQuestion}
            onUpdate={(updates) => onQuestionUpdate(selectedQuestion.id, updates)}
            onEdit={onEditQuestion}
          />
        ) : (
          <GlobalInspector
            survey={survey}
            onUpdate={onSurveyUpdate}
          />
        )}
      </div>
    </div>
  );
}