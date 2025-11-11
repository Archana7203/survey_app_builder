import React, { useEffect, useMemo, useRef } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import type { TemplateDetails, TemplateQuestionSummary } from '../../types/templates';
import VerticalScrollControls from '../common/VerticalScrollControls';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: TemplateDetails | null;
  isLoading: boolean;
  error: string | null;
  onUseTemplate: () => void;
  isInstantiating: boolean;
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'singleChoice':
    case 'single_choice':
      return 'Single Choice';
    case 'multiChoice':
    case 'multi_choice':
      return 'Multiple Choice';
    case 'dropdown':
      return 'Dropdown';
    case 'slider':
      return 'Slider';
    case 'ratingStar':
      return 'Star Rating';
    case 'ratingNumber':
      return 'Number Rating';
    case 'textShort':
      return 'Short Text';
    case 'textLong':
      return 'Long Text';
    default:
      return type.replace(/([a-z])([A-Z])/g, '$1 $2');
  }
};

const renderChoiceOptions = (question: TemplateQuestionSummary) => {
  if (!question.options?.length) {
    return <p className="text-sm text-gray-500">No choices configured.</p>;
  }

  return (
    <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600">
      {question.options.map((option) => (
        <li key={option.id}>{option.text}</li>
      ))}
    </ul>
  );
};

const renderRatingSettings = (question: TemplateQuestionSummary) => {
  const settings = question.settings ?? {};
  const min = (settings.scaleMin as number) ?? 0;
  const max =
    (settings.scaleMax as number) ??
    (settings.maxRating as number) ??
    (settings.max as number);
  const step = (settings.scaleStep as number) ?? (settings.step as number) ?? 1;

  return (
    <p className="text-sm text-gray-600">
      Range: {min} to {max} (step {step})
    </p>
  );
};

const renderTextSettings = (question: TemplateQuestionSummary) => {
  const settings = question.settings ?? {};
  const maxWords =
    (settings.maxWords as number) ??
    (settings.wordLimit as number) ??
    (settings.maxLength as number);

  if (!maxWords) {
    return <p className="text-sm text-gray-600">Textbox</p>;
  }

  return (
    <p className="text-sm text-gray-600">
      Textbox (limit {maxWords})
    </p>
  );
};

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  template,
  isLoading,
  error,
  onUseTemplate,
  isInstantiating,
}) => {
  const questions = useMemo(() => {
    if (!template?.pages) return [];
    return template.pages.flatMap((page) => page.questions || []);
  }, [template]);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isOpen, template?.id]);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Template Preview">
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : template ? (
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="max-h-[70vh] overflow-y-auto pr-2 space-y-6"
          >
          <section className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {template.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {template.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {template.category}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                {template.estimatedTime}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
              </span>
            </div>
          </section>

          <section className="space-y-4">
            {questions.length === 0 ? (
              <p className="text-sm text-gray-500">
                This template does not contain any questions yet.
              </p>
            ) : (
              <ul className="space-y-4">
                {questions.map((question, index) => {
                  const typeLabel = getTypeLabel(question.type);
                  const questionKey = `${question.id}-${index}`;

                  const normalizedType = question.type.toLowerCase();
                  const isChoiceQuestion = ['singlechoice', 'single_choice', 'multichoice', 'multi_choice', 'dropdown'].includes(
                    normalizedType,
                  );
                  const isRatingQuestion = ['slider', 'ratingstar', 'ratingnumber'].includes(
                    normalizedType,
                  );
                  const isTextQuestion = ['textshort', 'textlong'].includes(normalizedType);

                  return (
                    <li
                      key={questionKey}
                      className="rounded-lg border border-gray-200 p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {index + 1}. {question.title}
                          </p>
                          {question.description ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {question.description}
                            </p>
                          ) : null}
                        </div>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          {typeLabel}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {isChoiceQuestion && renderChoiceOptions(question)}
                        {isRatingQuestion && renderRatingSettings(question)}
                        {isTextQuestion && !question.settings && (
                          <p className="text-sm text-gray-600">Textbox</p>
                        )}
                        {isTextQuestion && question.settings && renderTextSettings(question)}
                        {!isChoiceQuestion && !isRatingQuestion && !isTextQuestion ? (
                          <p className="text-sm text-gray-600">
                            No additional details for this question type.
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="flex justify-end border-t border-gray-200 pt-4">
            <Button onClick={onUseTemplate} disabled={isInstantiating}>
              {isInstantiating ? 'Creating...' : 'Use Template'}
            </Button>
          </div>
          </div>

          <VerticalScrollControls
            targetRef={scrollContainerRef}
            refreshKey={`${template?.id ?? 'unknown'}-${questions.length}`}
          />
        </div>
      ) : null}
    </Modal>
  );
};

export default TemplatePreviewModal;

