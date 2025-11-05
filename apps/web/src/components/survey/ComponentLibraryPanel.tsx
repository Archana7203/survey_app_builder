import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { FileText, CircleDot, Star } from 'lucide-react';
import Card from '../ui/Card';

interface QuestionType {
  readonly type: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly iconComponent?: React.ComponentType<{ className?: string }>;
  readonly category: string;
}

function DraggableQuestionType({ questionType }: { readonly questionType: QuestionType }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `new-${questionType.type}`,
    data: {
      type: 'question',
      questionType,
    },
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
          className="py-0.5 px-1 flex items-center gap-2"
        >
          <div className="text-lg group-hover:scale-110 transition-transform duration-200 flex items-center">
            {questionType.iconComponent ? (
              <questionType.iconComponent className="w-5 h-5" />
            ) : (
              questionType.icon
            )}
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {questionType.name}
            </h4>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface ComponentLibraryPanelProps {
  readonly questionTypes: QuestionType[];
}

export default function ComponentLibraryPanel({ 
  questionTypes,
}: ComponentLibraryPanelProps) {
  const categories = [
    { id: 'input', name: 'Text & Input', iconComponent: FileText },
    { id: 'choice', name: 'Choice', iconComponent: CircleDot },
    { id: 'rating', name: 'Rating', iconComponent: Star },
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
        <div className="space-y-5">
          {categories.map((category, index) => {
            const questions = groupedQuestions[category.id] || [];
            if (questions.length === 0) return null;

            const CategoryIcon = category.iconComponent;

            return (
              <div key={category.id}>
                {index > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
                )}
                <div className="flex items-center gap-2 mb-3">
                  {CategoryIcon && (
                    <CategoryIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  )}
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {category.name}
                  </span>
                </div>
                <div className="space-y-2">
                  {questions.map((questionType) => (
                    <DraggableQuestionType
                      key={questionType.type}
                      questionType={questionType}
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