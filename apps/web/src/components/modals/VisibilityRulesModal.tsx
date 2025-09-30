import { useState, useEffect, useCallback } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
// Use Web Crypto API in the browser instead of node:crypto

type ValueType = string | number | boolean;

interface VisibilityRule {
  questionId: string;
  condition: {
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: ValueType
  };
  logical?: 'AND' | 'OR';
  groupIndex?: number;
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
}

interface UICondition {
  id: string; // unique identifier for stable keys
  questionId: string; // depends on this (previous) question
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number | boolean;
  logical?: 'AND' | 'OR';
}

interface UIRuleGroup {
  conditions: UICondition[];
  groupIndex: number;
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
      case 'datePicker':
        return 'date';
      case 'email':
        return 'email';
      default:
        return 'text';
    }
  }

  function getValueOptions(depQ: Question | undefined) {
    if (!depQ?.options) return null;
    return depQ.options.map(option => ({ value: option.value || option.text, label: option.text }));
  }

export default function VisibilityRulesModal({ isOpen, onClose, question, existingRules, candidateQuestions, onSave }: VisibilityRulesModalProps) {
  const [groups, setGroups] = useState<UIRuleGroup[]>([]);

  const firstCandidateId = candidateQuestions?.[0]?.id || '';

  // Generate unique IDs for conditions
  const generateConditionId = (): string => {
    // Prefer crypto.getRandomValues when available (browser), fallback to Math.random
    let randomPart = '';
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const bytes = new Uint8Array(4);
      window.crypto.getRandomValues(bytes);
      randomPart = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      randomPart = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
    }
    return `branch-cond-${Date.now()}-${randomPart}`;
  };

  const createEmptyGroup = useCallback((groupIndex: number): UIRuleGroup => ({
    conditions: [
      { id: generateConditionId(), questionId: firstCandidateId, operator: 'equals', value: '', logical: 'OR' },
    ],
    groupIndex,
  }), [firstCandidateId]);

  useEffect(() => {
    if (!question) return;
    const rulesForQuestion = (existingRules || []);
    if (rulesForQuestion.length === 0) {
      setGroups([createEmptyGroup(0)]);
      return;
    }

    type RuleWithMeta = VisibilityRule & { groupIndex?: number };
    const byGroupIndex = new Map<number, UIRuleGroup>();
    let nextTempIndex = 1000000;

    const rulesWithMeta: Array<{ idx: number; rule: RuleWithMeta }> = rulesForQuestion.map((r, idx) => ({ idx, rule: r as RuleWithMeta }));
    rulesWithMeta.sort((a, b) => {
      const ga = a.rule.groupIndex ?? Number.MAX_SAFE_INTEGER;
      const gb = b.rule.groupIndex ?? Number.MAX_SAFE_INTEGER;
      if (ga !== gb) return ga - gb;
      return a.idx - b.idx;
    });

    for (const { rule } of rulesWithMeta) {
      const key = rule.groupIndex ?? nextTempIndex++;
      let group = byGroupIndex.get(key);
      if (!group) {
        group = { groupIndex: key, conditions: [] } as UIRuleGroup;
        byGroupIndex.set(key, group);
      }
      group.conditions.push({
        id: generateConditionId(),
        questionId: rule.questionId,
        operator: rule.condition.operator,
        value: rule.condition.value as string | number | boolean,
        logical: rule.logical || 'OR',
      });
    }

    const grouped = Array.from(byGroupIndex.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, g]) => g);

    setGroups(grouped.length ? grouped : [createEmptyGroup(0)]);
  }, [question, existingRules, createEmptyGroup]);

  const operatorOptions = [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
  ];

  function updateCondition(
    groupIndex: number,
    conditionIndex: number,
    updates: Partial<UICondition>
  ) {
    setGroups(prev => prev.map((g, gi) => updateGroupCondition(g, gi, groupIndex, conditionIndex, updates)));
  }

  function updateGroupCondition(
    group: UIRuleGroup,
    gi: number,
    targetGroupIndex: number,
    conditionIndex: number,
    updates: Partial<UICondition>
  ): UIRuleGroup {
    if (gi !== targetGroupIndex) return group;

    return {
      ...group,
      conditions: group.conditions.map((c, ci) =>
        ci === conditionIndex ? { ...c, ...updates } : c
      ),
    };
  }


  function addCondition(groupIndex: number) {
    setGroups(prev => prev.map((g, gi) => (
      gi !== groupIndex
        ? g
        : { ...g, conditions: [...g.conditions, { id: generateConditionId(), questionId: firstCandidateId, operator: 'equals', value: '', logical: 'OR' }] }
    )));
  }

  function removeCondition(groupIndex: number, conditionIndex: number) {
    setGroups(prev => prev.map((g, gi) => updateGroupConditions(g, gi, groupIndex, conditionIndex)));
  }

  function updateGroupConditions(
    group: UIRuleGroup,
    gi: number,
    targetGroupIndex: number,
    conditionIndex: number
  ): UIRuleGroup {
    if (gi !== targetGroupIndex) return group;

    return {
      ...group,
      conditions: group.conditions.filter((_, ci) => ci !== conditionIndex),
    };
  }

  function addGroup() {
    if (!question) return;
    setGroups(prev => [...prev, createEmptyGroup(prev.length)]);
  }

  function handleSave() {
    if (!question) return;

    const flattened: VisibilityRule[] = [];
    for (const group of groups) {
      const validConds = group.conditions.filter(c => c.value !== '' && c.value !== undefined && c.value !== null);
      if (validConds.length === 0) continue;
      validConds.forEach((cond, condIndex) => {
        flattened.push({
          questionId: cond.questionId,
          condition: { operator: cond.operator, value: cond.value },
          ...(condIndex < validConds.length - 1 ? { logical: cond.logical || 'OR' } : {}),
          groupIndex: group.groupIndex,
        });
      });
    }

    try { onSave(flattened); } catch (err) { console.error(err); }
    try { onClose(); } catch (err) { console.error(err); }
  }

  function removeGroup(groupIndex: number) {
    setGroups(prev => prev.filter((_, i) => i !== groupIndex));
  }

  if (!question) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Visibility Rules: ${question.title}`} size="lg">
      <div className="space-y-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Show this question when any rule group below evaluates to true. Within a group, conditions are joined by AND/OR.
        </div>

        {groups.map((group, groupIndex) => (
          <div
            key={group.groupIndex}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Rule Group {groupIndex + 1}
              </h3>
              {groups.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeGroup(groupIndex)}
                  className="text-red-600"
                >
                  Remove Group
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {group.conditions.map((cond, condIndex) => {
                const depQ = candidateQuestions.find(q => q.id === cond.questionId);
                const valueOptions = getValueOptions(depQ);
                const valueInputType = getValueInputType(depQ);
                return (
                <div key={cond.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-4">
                    <Select
                      label={condIndex === 0 ? 'Based on question' : 'And also based on'}
                      options={candidateQuestions.map(q => ({ value: q.id, label: q.title }))}
                      value={cond.questionId}
                      onChange={(e) => updateCondition(groupIndex, condIndex, { questionId: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Select
                      label={condIndex === 0 ? 'If answer' : 'Then also'}
                      options={operatorOptions}
                      value={cond.operator}
                      onChange={(e) => updateCondition(groupIndex, condIndex, { operator: e.target.value as UICondition['operator'] })}
                    />
                  </div>
                  <div className="md:col-span-4">
                    {valueOptions ? (
                      <Select
                        label="Value"
                        options={valueOptions}
                        value={typeof cond.value === 'string' ? cond.value : String(cond.value || '')}
                        onChange={(e) => updateCondition(groupIndex, condIndex, { value: e.target.value })}
                        placeholder="Select an option"
                      />
                    ) : (
                      <Input
                        label="Value"
                        type={valueInputType}
                        value={typeof cond.value === 'string' ? cond.value : String(cond.value || '')}
                        onChange={(e) => updateCondition(groupIndex, condIndex, { value: e.target.value })}
                        placeholder="Enter value"
                      />
                    )}
                  </div>
                  <div className="md:col-span-1">
                    {group.conditions.length >= 2 && condIndex < group.conditions.length - 1 && (
                      <Select
                        label="Join"
                        options={[{ value: 'OR', label: 'OR' }, { value: 'AND', label: 'AND' }]}
                        value={cond.logical || 'OR'}
                        onChange={(e) => updateCondition(groupIndex, condIndex, { logical: e.target.value as 'AND' | 'OR' })}
                      />
                    )}
                  </div>
                  <div className="md:col-span-1">
                    {group.conditions.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeCondition(groupIndex, condIndex)} className="text-red-600">✕</Button>
                    )}
                  </div>
                </div>
              );})}
              <Button variant="outline" size="sm" onClick={() => addCondition(groupIndex)}>+ Add Condition</Button>
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addGroup} className="w-full">+ Add Another Rule Group</Button>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={() => { try { onClose(); } catch (err) { console.error(err); } }}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Visibility Rules</Button>
        </div>
      </div>
    </Modal>
  );
}


