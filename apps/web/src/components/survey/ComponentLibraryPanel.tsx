import { useDraggable } from '@dnd-kit/core';
import Card from '../ui/Card';

interface QuestionType {
  readonly type: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly category: string;
}

function DraggableQuestionType({ questionType, disabled = false }: { readonly questionType: QuestionType; readonly disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `new-${questionType.type}`,
    data: {
      type: 'question',
      questionType,
    },
    disabled,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        className={`
          relative cursor-grab active:cursor-grabbing transition-all duration-200 
          hover:shadow-md hover:-translate-y-0.5 group
          ${isDragging ? 'shadow-lg rotate-2' : 'shadow-sm'}
          bg-white dark:bg-gray-800
        `}
      >
        <div 
          {...attributes}
          {...listeners}
          className="p-2 flex items-center gap-3"
        >
          <div className="text-2xl group-hover:scale-110 transition-transform duration-200">
            {questionType.icon}
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {questionType.name}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              {questionType.description}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface ComponentLibraryPanelProps {
  readonly questionTypes: QuestionType[];
  readonly disabled?: boolean;
}

export default function ComponentLibraryPanel({ 
  questionTypes,
  disabled = false,
}: ComponentLibraryPanelProps) {
  const categories = [
    { id: 'input', name: 'Text & Input', icon: '📝' },
    { id: 'choice', name: 'Choice', icon: '🔘' },
    { id: 'rating', name: 'Rating', icon: '⭐' },
    { id: 'file', name: 'File Upload', icon: '📎' },
  ];

  // Group questions by category
  const groupedQuestions = questionTypes.reduce((acc, question) => {
    const category = question.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(question);
    return acc;
  }, {} as Record<string, QuestionType[]>);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Always show Question Library on the left */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Question Library
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {categories.map((category) => {
            const questions = groupedQuestions[category.id] || [];
            if (questions.length === 0) return null;

            return (
              <div key={category.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{category.icon}</span>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-white">
                    {category.name}
                  </h4>
                </div>
                <div className="space-y-2">
                  {questions.map((questionType) => (
                    <DraggableQuestionType
                      key={questionType.type}
                      questionType={questionType}
                      disabled={disabled}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}