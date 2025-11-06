import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
// Use Web Crypto API in the browser instead of node:crypto

type ValueType = string | number | boolean;

interface VisibilityRule {
  questionId: string;
  condition: {
    operator:
      | 'equals'
      | 'not_equals'
      | 'contains'
      | 'not_contains'
      | 'greater_than'
      | 'less_than'
      | 'count_eq'
      | 'count_gt'
      | 'count_lt'
      | 'has_selected';
    value: ValueType
  };
  logical?: 'AND' | 'OR';
}

interface Question {
  id: string;
  type: string;
  title: string;
  options?: Array<{
    id: string;
    text: string;
    value?: string;
  }>;
  settings?: {
    maxRating?: number;
    scaleMin?: number;
    scaleMax?: number;
    scaleStep?: number;
  };
}

interface UICondition {
  id: string; // unique identifier for stable keys
  questionId: string; // depends on this (previous) question
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'greater_than'
    | 'less_than'
    | 'count_eq'
    | 'count_gt'
    | 'count_lt'
    | 'has_selected';
  value: string | number | boolean;
  logical?: 'AND' | 'OR';
}


interface VisibilityRulesModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly question: Question | null;
  readonly existingRules: VisibilityRule[];
  readonly candidateQuestions: Question[]; // only previous questions
  readonly onSave: (rules: VisibilityRule[]) => void;
}

function getValueInputType(depQ: Question | undefined) {
  if (!depQ) return 'text';
  switch (depQ.type) {
    case 'ratingNumber':
    case 'ratingStar':
    case 'ratingSmiley':
    case 'slider':
      return 'number';
    case 'email':
      return 'email';
    default:
      return 'text';
  }
}

function getValueOptions(depQ: Question | undefined) {
  if (!depQ?.options) return null;
  return depQ.options.map(option => ({
    value: option.id,
    label: option.text
  }));
}

function getValueInputMin(depQ: Question | undefined): number | undefined {
  if (!depQ) return undefined;

  switch (depQ.type) {
    case 'ratingNumber':
    case 'ratingStar':
      // Rating questions typically start from 1
      return 1;
    case 'ratingSmiley':
      // Smiley ratings use values 1-5
      return 1;
    case 'slider':
      // Get min from question settings
      return depQ.settings?.scaleMin ?? 0;
    default:
      return undefined;
  }
}

function getValueInputMax(depQ: Question | undefined): number | undefined {
  if (!depQ) return undefined;

  switch (depQ.type) {
    case 'ratingNumber':
    case 'ratingStar':
      return depQ.settings?.maxRating ?? 10;
    case 'ratingSmiley':
      return depQ.settings?.maxRating ?? 5;
    case 'slider':
      return depQ.settings?.scaleMax ?? 100;
    default:
      return undefined;
  }
}

export default function VisibilityRulesModal({ isOpen, onClose, question, existingRules, candidateQuestions, onSave }: VisibilityRulesModalProps) {
  const [conditions, setConditions] = useState<UICondition[]>([]);

  const firstCandidateId = candidateQuestions?.[0]?.id || '';

  const getQuestionById = (id: string | undefined): Question | undefined =>
    candidateQuestions.find(q => q.id === id);

  const getDefaultOperatorForType = (type: string | undefined): UICondition['operator'] => {
    if (type === 'multiChoice') return 'count_eq';
    return 'equals';
  };

  // Generate unique IDs for conditions
  const generateConditionId = (): string => {
    // Prefer crypto.getRandomValues when available (browser), fallback to Math.random
    let randomPart = '';
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
      const bytes = new Uint8Array(4);
      globalThis.crypto.getRandomValues(bytes);
      randomPart = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      randomPart = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
    }
    return `branch-cond-${Date.now()}-${randomPart}`;
  };

  useEffect(() => {
    if (!question) return;
    const rulesForQuestion = (existingRules || []);
    if (rulesForQuestion.length === 0) {
      const depQ = getQuestionById(firstCandidateId);
      const defaultOp = getDefaultOperatorForType(depQ?.type);
      setConditions([
        { id: generateConditionId(), questionId: firstCandidateId, operator: defaultOp, value: '', logical: 'OR' },
      ]);
      return;
    }

    // Convert rules to flat list of conditions (ignore groupIndex)
    const convertedConditions: UICondition[] = rulesForQuestion.map((rule) => ({
      id: generateConditionId(),
      questionId: rule.questionId,
      operator: rule.condition.operator,
      value: rule.condition.value as string | number | boolean,
      logical: rule.logical || 'OR',
    }));

    setConditions(convertedConditions.length ? convertedConditions : [
      { id: generateConditionId(), questionId: firstCandidateId, operator: getDefaultOperatorForType(getQuestionById(firstCandidateId)?.type), value: '', logical: 'OR' },
    ]);
  }, [question, existingRules, firstCandidateId]);

  function getOperatorOptions(depQ: Question | undefined) {
    const textOps = [
      { value: 'equals', label: '=' },
      { value: 'not_equals', label: '!=' },
      { value: 'contains', label: 'Contains' },
      { value: 'not_contains', label: 'Not contains' },
    ];

    const checkboxOps = [
      { value: 'count_eq', label: 'Count() =' },
      { value: 'count_gt', label: 'Count() >' },
      { value: 'count_lt', label: 'Count() <' },
      { value: 'has_selected', label: 'Has Selected' },
    ];

    const choiceOps = [
      { value: 'has_selected', label: 'Has Selected' },
    ];

    const numberOps = [
      { value: 'equals', label: '=' },
      { value: 'not_equals', label: '!=' },
      { value: 'less_than', label: '<' },
      { value: 'greater_than', label: '>' },
    ];

    if (!depQ) return textOps;

    switch (depQ.type) {
      case 'textShort':
      case 'textLong':
      case 'email':
        return textOps;
      case 'singleChoice': 
      case 'dropdown':  
        return choiceOps;
      case 'multiChoice':
        return checkboxOps;
      case 'ratingNumber':
      case 'ratingStar':
      case 'ratingSmiley':
      case 'slider':
        return numberOps;
      default:
        return textOps;
    }
  }

  const isCountOperator = (operator: UICondition['operator']): boolean =>
    operator === 'count_eq' || operator === 'count_gt' || operator === 'count_lt';

  function updateCondition(
    conditionIndex: number,
    updates: Partial<UICondition>
  ) {
    setConditions(prev => prev.map((c, ci) =>
      ci === conditionIndex ? { ...c, ...updates } : c
    ));
  }

  function addCondition() {
    const depQ = getQuestionById(firstCandidateId);
    const defaultOp = getDefaultOperatorForType(depQ?.type);
    setConditions(prev => [...prev, { id: generateConditionId(), questionId: firstCandidateId, operator: defaultOp, value: '', logical: 'OR' }]);
  }

  function removeCondition(conditionIndex: number) {
    setConditions(prev => prev.filter((_, ci) => ci !== conditionIndex));
  }

  function handleSave() {
    if (!question) return;

    // Validate all numeric values are within range
    for (const cond of conditions) {
      if (cond.value === '' || cond.value === undefined || cond.value === null) continue;
      
      const depQ = candidateQuestions.find(q => q.id === cond.questionId);
      const min = getValueInputMin(depQ);
      const max = getValueInputMax(depQ);
      
      // Only validate if this is a numeric input (rating or slider)
      if (min !== undefined && max !== undefined) {
        const numValue = typeof cond.value === 'number' ? cond.value : Number(cond.value);
        if (!isNaN(numValue)) {
          if (numValue < min || numValue > max) {
            const questionTitle = depQ?.title || 'the selected question';
            alert(`Please enter a value between ${min} and ${max} for the question ${questionTitle}.`);
            return;
          }
        }
      }
    }

    // Convert conditions to rules (no groupIndex)
    const validConds = conditions.filter(c => (c.value !== '' && c.value !== undefined && c.value !== null));
    if (validConds.length === 0) {
      try { onSave([]); } catch (err) { console.error(err); }
      try { onClose(); } catch (err) { console.error(err); }
      return;
    }

    const rules: VisibilityRule[] = validConds.map((cond, condIndex) => ({
      questionId: cond.questionId,
      condition: { operator: cond.operator, value: cond.value },
      ...(condIndex < validConds.length - 1 ? { logical: cond.logical || 'OR' } : {}),
    }));

    try { onSave(rules); } catch (err) { console.error(err); }
    try { onClose(); } catch (err) { console.error(err); }
  }

  if (!question) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Visibility Rules: ${question.title}`} size="xl">
      <div className="space-y-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Show this question when the conditions below evaluate to true. Conditions are joined by AND/OR.
        </div>

        <div className="space-y-3">
          {conditions.map((cond, condIndex) => {
                const depQ = candidateQuestions.find(q => q.id === cond.questionId);
                const valueOptions = getValueOptions(depQ);
                const valueInputType = getValueInputType(depQ);
                const valueInputMin = getValueInputMin(depQ);
                const valueInputMax = getValueInputMax(depQ);
              const ops = getOperatorOptions(depQ);
                return (
                  <div key={cond.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-3">
                      <Select
                        label={condIndex === 0 ? 'Based on question' : 'And also based on'}
                        options={candidateQuestions.map(q => ({ value: q.id, label: q.title }))}
                        value={cond.questionId}
                        onChange={(e) => {
                          const nextQId = e.target.value;
                          const nextQ = getQuestionById(nextQId);
                          const nextOp = getDefaultOperatorForType(nextQ?.type);
                          const resetValue = isCountOperator(nextOp) ? '' : '';
                          updateCondition(condIndex, { questionId: nextQId, operator: nextOp, value: resetValue });
                        }}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Select
                        label={condIndex === 0 ? 'If answer' : 'Then also'}
                      options={ops}
                        value={cond.operator}
                        onChange={(e) => {
                          const nextOp = e.target.value as UICondition['operator'];
                          const nextVal = isCountOperator(nextOp) ? '' : cond.value;
                          updateCondition(condIndex, { operator: nextOp, value: nextVal });
                        }}
                      />
                    </div>
                  <div className="md:col-span-4">
                    {depQ?.options && !isCountOperator(cond.operator) ? (
                      <Select
                        label="Value"
                        options={valueOptions || []}
                        value={typeof cond.value === 'string' ? cond.value : String(cond.value || '')}
                        onChange={(e) => updateCondition(condIndex, { value: e.target.value })}
                        placeholder="Select an option"
                      />
                    ) : (
                      <div>
                        <Input
                          label="Value"
                          type={isCountOperator(cond.operator) ? 'number' : valueInputType}
                          value={typeof cond.value === 'string' ? cond.value : String(cond.value || '')}
                          onChange={(e) => updateCondition(condIndex, { value: e.target.value })}
                          placeholder={isCountOperator(cond.operator) ? 'Enter count' : 'Enter value'}
                          min={isCountOperator(cond.operator) ? 0 : valueInputMin}
                          max={isCountOperator(cond.operator) ? undefined : valueInputMax}
                        />
                      </div>
                    )}
                  </div>
                    <div className="md:col-span-2">
                      {conditions.length >= 2 && condIndex < conditions.length - 1 && (
                        <Select
                          label="Join"
                          options={[{ value: 'OR', label: 'OR' }, { value: 'AND', label: 'AND' }]}
                          value={cond.logical || 'OR'}
                          onChange={(e) => updateCondition(condIndex, { logical: e.target.value as 'AND' | 'OR' })}
                        />
                      )}
                    </div>
                    <div className="md:col-span-1">
                      {conditions.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeCondition(condIndex)} className="text-red-600">✕</Button>
                      )}
                    </div>
                  </div>
                );
              })}
              <Button variant="outline" size="sm" onClick={addCondition}>+ Add Condition</Button>
            </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={() => { try { onClose(); } catch (err) { console.error(err); } }}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Visibility Rules</Button>
        </div>
      </div>
    </Modal>
  );
}


