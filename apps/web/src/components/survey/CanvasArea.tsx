import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Card from '../ui/Card';
import QuestionRenderer, { type QuestionProps as RendererQuestionProps } from '../questions/QuestionRenderer';
//SonarQube: interactive div is necessary for drag-and-drop, accessibility handled via role and keyboard listeners
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

interface CanvasQuestionProps {
  readonly question: Question;
  readonly index: number;
  readonly isSelected: boolean;
  readonly onSelect: (question: Question) => void;
  readonly onEdit: (question: Question) => void;
  readonly onDelete: (questionId: string) => void;
  readonly previewResponses: Record<string, RendererQuestionProps['value'] | undefined>;
  readonly onPreviewResponseChange: (questionId: string, value: RendererQuestionProps['value'] | undefined) => void;
}
function CanvasQuestion({
  question,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  previewResponses,
  onPreviewResponseChange,
}: CanvasQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className="group">
      <div 
        role="button"
        tabIndex={0}
        onClick={() => onSelect(question)} 
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onSelect(question); }
        }}
        className={`
          relative rounded-lg transition-all duration-200 
          ${isDragging ? 'opacity-50' : 'opacity-100'}
          ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
        `}
      >
        <Card className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow duration-200">
          <div className="p-4">
            {/* Question Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Drag Handle */}
                <button
                  {...attributes}
                  {...listeners}
                  className="touch-none p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </button>

                {/* Question Number */}
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {question.type}
                  </span>
                  {question.required && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300">
                      Required
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(question);
                  }}
                  className="p-1.5 rounded-full text-gray-500 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 dark:hover:bg-[var(--color-primary)]/20"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(question.id); 
                  }}
                  className="p-1.5 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Question Content */}
            <div className="mb-4">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                {question.title || 'Untitled Question'}
              </h3>
              {question.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {question.description}
                </p>
              )}
            </div>

            {/* Question Preview */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <QuestionRenderer
                question={question}
                value={previewResponses[question.id]}
                onChange={(value) => onPreviewResponseChange(question.id, value) }
                disabled={false}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

interface CanvasAreaProps {
  readonly questions: Question[];
  readonly onSelectQuestion: (question: Question | null) => void;
  readonly selectedQuestion: Question | null;
  readonly onEditQuestion: (question: Question) => void;
  readonly onDeleteQuestion: (questionId: string) => void;
  readonly previewResponses: Record<string, RendererQuestionProps['value'] | undefined>;
  readonly onPreviewResponseChange: (questionId: string, value: RendererQuestionProps['value'] | undefined) => void;
}

export default function CanvasArea({
  questions,
  onSelectQuestion,
  selectedQuestion,
  onEditQuestion,
  onDeleteQuestion,
  previewResponses,
  onPreviewResponseChange,
}: CanvasAreaProps) {
  const { setNodeRef } = useDroppable({
    id: 'canvas-drop-zone',
  });

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Canvas
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Build your survey by adding and arranging questions
            </p>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {questions.length} question{questions.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>
      {/* Drop Zone */}
      <div 
        ref={setNodeRef}
        role="button"
        tabIndex={0}
        className="flex-1 overflow-y-auto p-4"
        onClick={() => onSelectQuestion(null)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onSelectQuestion(null); } }}
      >
        {questions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 mb-4 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Start Building Your Survey
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              Drag question types from the library on the left to add them to your survey
            </p>
          </div>
        ) : (
          <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {questions.map((question, index) => (
                <CanvasQuestion
                  key={question.id}
                  question={question}
                  index={index}
                  isSelected={selectedQuestion?.id === question.id}
                  onSelect={onSelectQuestion}
                  onEdit={onEditQuestion}
                  onDelete={onDeleteQuestion}
                  previewResponses={previewResponses}
                  onPreviewResponseChange={onPreviewResponseChange}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}