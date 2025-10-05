import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Card from '../ui/Card';
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

interface SortableQuestionItemProps {
  question: Question;
  index: number;
  onDelete: (questionId: string) => void;
  onSelect: (question: Question) => void;
}

function SortableQuestionItem({ 
  question, 
  index, 
  onDelete, 
  onSelect,
  disabled = false,
}: SortableQuestionItemProps & { disabled?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: question.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };



  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card className={`${isDragging ? 'shadow-lg' : ''}`}>
        <button
          tabIndex={0}
          className="w-full text-left p-4 cursor-pointer text-gray-700 hover:ring-1 hover:ring-gray-200 dark:text-gray-300 dark:hover:ring-gray-600 transition-all duration-200"
          onClick={() => onSelect(question)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(question);
            }
          }}
        >
          {/* Drag Handle */}
          <div className="flex items-start space-x-3">
            <button
              type="button"
              {...attributes}
              {...listeners}
              disabled={disabled}
              className={`mt-1 p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing ${
                disabled ? 'cursor-not-allowed opacity-50' : ''
              }`}
              title={disabled ? 'Survey is locked' : 'Drag to reorder'}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                }
              }}
              aria-label={disabled ? 'Survey is locked' : 'Drag to reorder'}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/>
                <path d="M0 0h24v24H0z" fill="none"/>
              </svg>
            </button>

            {/* Question Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Q{index + 1}
                  </span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded">
                    {question.type}
                  </span>
                  {question.required && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded">
                      Required
                    </span>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(question.id) } 
                    className="text-red-600 hover:text-red-800"
                    disabled={disabled}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {question.title}
              </h3>
              
              {question.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {question.description}
                </p>
              )}

              {/* Question Options Preview */}
              {question.options && question.options.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Options:</p>
                  <div className="flex flex-wrap gap-1">
                    {question.options.slice(0, 3).map((option) => (
                      <span
                        key={option.id}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {option.text}
                      </span>
                    ))}
                    {question.options.length > 3 && (
                      <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                        +{question.options.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              
            </div>
          </div>
        </button>
      </Card>
    </div>
  );
}

interface ReorderableQuestionsProps {
  questions: Question[];
  onReorder: (questions: Question[]) => void;
  onDeleteQuestion: (questionId: string) => void;
  onSelectQuestion: (question: Question) => void;
  disabled?: boolean;
}

export default function ReorderableQuestions({
  questions,
  onDeleteQuestion,
  onSelectQuestion,
  disabled = false,
}: Readonly<Omit<ReorderableQuestionsProps, 'onReorder'>>) {
  // Sorting is handled by the parent Dnd context; this component only renders Sortable items

  return (
    <>
      {questions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No questions yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding your first question.</p>
        </div>
      ) : (
        <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-0">
            {questions.map((question, index) => (
              <SortableQuestionItem
                key={question.id}
                question={question}
                index={index}
                onDelete={onDeleteQuestion}
                onSelect={onSelectQuestion}
                disabled={disabled}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </>
  );
}
