import { useState, useEffect, useCallback } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import crypto from 'node:crypto';

type ValueType = string | number | boolean;

interface BranchingRule {
  questionId: string;
  condition: {
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: ValueType;
  };
  logical?: 'AND' | 'OR';
  action: {
    type: 'skip_to_page' | 'end_survey';
    targetPageIndex?: number;
  };
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

// UI types to support chaining conditions within a single rule block
interface UICondition {
  id: string; // unique identifier for stable keys
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: ValueType;
  logical?: 'AND' | 'OR'; // join with next condition
}

interface UIRuleGroup {
  questionId: string;
  conditions: UICondition[];
  groupIndex: number;
  action: {
    type: 'skip_to_page' | 'end_survey';
    targetPageIndex?: number;
  };
}

interface BranchingModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly question: Question | null;
  readonly totalPages: number;
  readonly currentPageIndex: number;
  readonly existingRules: BranchingRule[];
  readonly onSave: (rules: BranchingRule[]) => void;
}

export default function BranchingModal({
  isOpen,
  onClose,
  question,
  totalPages,
  currentPageIndex,
  existingRules,
  onSave,
}: BranchingModalProps) {
  const [groups, setGroups] = useState<UIRuleGroup[]>([]);

  const generateConditionId = (): string => {
    const randomHex = crypto.randomBytes(4).toString('hex'); // 8 characters of secure randomness
    return `branch-cond-${Date.now()}-${randomHex}`;
  };

  // Build a default group for the question
  const createEmptyGroup = useCallback((questionId: string, groupIndex: number): UIRuleGroup => ({
    questionId,
    conditions: [
      {
        id: generateConditionId(),
        operator: 'equals',
        value: '',
        logical: 'OR',
      },
    ],
    groupIndex,
    action: {
      type: 'skip_to_page',
      targetPageIndex: Math.min(currentPageIndex + 1, totalPages - 1),
    },
  }), [currentPageIndex, totalPages]);

  // Initialize from existing flat rules by converting into a single group
  useEffect(() => {
    if (!question) return;
    const rulesForQuestion = existingRules.filter(r => r.questionId === question.id);

    if (rulesForQuestion.length === 0) {
      setGroups([createEmptyGroup(question.id, 0)]);
      return;
    }

    // Rebuild groups using saved groupIndex to avoid merging unrelated conditions
    type RuleWithMeta = BranchingRule & { groupIndex?: number };
    const byGroupIndex = new Map<number, UIRuleGroup>();
    let nextTempIndex = 1000000; // temporary indices for rules without groupIndex

    rulesForQuestion.forEach((rule) => {
      const groupIndex = (rule as RuleWithMeta).groupIndex ?? nextTempIndex++;
      const existing = byGroupIndex.get(groupIndex);
      if (existing) {
        existing.conditions.push({
          id: generateConditionId(),
          operator: rule.condition.operator,
          value: rule.condition.value,
          logical: rule.logical,
        });
      } else {
        byGroupIndex.set(groupIndex, {
          questionId: rule.questionId,
          conditions: [{
            id: generateConditionId(),
            operator: rule.condition.operator,
            value: rule.condition.value,
            logical: rule.logical,
          }],
          groupIndex,
          action: rule.action,
        });
      }
    });

    setGroups(Array.from(byGroupIndex.values()));
  }, [question, existingRules, createEmptyGroup]);

  const addCondition = useCallback((groupIndex: number) => {
    setGroups(prev => prev.map(group => {
      if (group.groupIndex === groupIndex) {
        return {
          ...group,
          conditions: [
            ...group.conditions,
            {
              id: generateConditionId(),
              operator: 'equals',
              value: '',
              logical: 'OR',
            },
          ],
        };
      }
      return group;
    }));
  }, []);

  const removeCondition = useCallback((groupIndex: number, conditionIndex: number) => {
    setGroups(prev => prev
      .map(group => processRemoveCondition(group, groupIndex, conditionIndex))
      .filter(Boolean) as UIRuleGroup[]
    );
  }, []);

  function processRemoveCondition(
    group: UIRuleGroup,
    targetGroupIndex: number,
    conditionIndex: number
  ): UIRuleGroup | null {
    if (group.groupIndex !== targetGroupIndex) return group;

    const newConditions = group.conditions.filter((_, index) => index !== conditionIndex);

    if (newConditions.length === 0) return null; // remove group if no conditions left

    return {
      ...group,
      conditions: newConditions,
    };
  }

  const updateCondition = useCallback((
    groupIndex: number,
    conditionIndex: number,
    field: keyof UICondition,
    value: string | number | boolean
  ) => {
    setGroups(prev =>
      prev.map(group => applyConditionUpdate(group, groupIndex, conditionIndex, field, value))
    );
  }, []);

  function applyConditionUpdate(
    group: UIRuleGroup,
    targetGroupIndex: number,
    conditionIndex: number,
    field: keyof UICondition,
    value: string | number | boolean
  ): UIRuleGroup {
    if (group.groupIndex !== targetGroupIndex) return group;

    const updatedConditions = group.conditions.map((condition, index) =>
      index === conditionIndex ? { ...condition, [field]: value } : condition
    );

    return {
      ...group,
      conditions: updatedConditions,
    };
  }

  const updateAction = useCallback((groupIndex: number, action: UIRuleGroup['action']) => {
    setGroups(prev => prev.map(group => {
      if (group.groupIndex === groupIndex) {
        return {
          ...group,
          action,
        };
      }
      return group;
    }));
  }, []);

  const addGroup = useCallback(() => {
    if (!question) return;
    const newGroupIndex = Math.max(...groups.map(g => g.groupIndex), -1) + 1;
    setGroups(prev => [...prev, createEmptyGroup(question.id, newGroupIndex)]);
  }, [question, groups, createEmptyGroup]);

  const removeGroup = useCallback((groupIndex: number) => {
    setGroups(prev => prev.filter(group => group.groupIndex !== groupIndex));
  }, []);

  const handleSave = useCallback(() => {
    if (!question) return;

    // Convert UI groups back to flat rules
    const rules: BranchingRule[] = [];
    groups.forEach(group => {
      group.conditions.forEach((condition, index) => {
        rules.push({
          questionId: group.questionId,
          condition: {
            operator: condition.operator,
            value: condition.value,
          },
          logical: index < group.conditions.length - 1 ? condition.logical : undefined,
          action: group.action,
        });
      });
    });

    try { onSave(rules); } catch (err) { console.error(err); }
    try { onClose(); } catch (err) { console.error(err); }
  }, [groups, question, onSave, onClose]);

  if (!question) return null;

  const getOperatorOptions = () => {
    if (question.type === 'single_choice' || question.type === 'multi_choice') {
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'contains', label: 'Contains' },
      ];
    }
    if (question.type === 'rating_number' || question.type === 'rating_star' || question.type === 'slider') {
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'greater_than', label: 'Greater than' },
        { value: 'less_than', label: 'Less than' },
      ];
    }
    return [
      { value: 'equals', label: 'Equals' },
      { value: 'contains', label: 'Contains' },
    ];
  };

  const getValueInput = (condition: UICondition, groupIndex: number, conditionIndex: number) => {
    if (question.type === 'single_choice' || question.type === 'multi_choice') {
      return (
        <Select
          value={String(condition.value)}
          onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
          options={question.options?.map(opt => ({ value: opt.value || opt.id, label: opt.text })) || []}
          placeholder="Select option"
        />
      );
    }
    if (question.type === 'rating_number' || question.type === 'rating_star' || question.type === 'slider') {
      return (
        <Input
          type="number"
          value={condition.value as number}
          onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', Number(e.target.value))}
          placeholder="Enter value"
        />
      );
    }
    return (
      <Input
        type="text"
        value={String(condition.value)}
        onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
        placeholder="Enter value"
      />
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Branching Logic">
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Question: {question.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure conditions to control survey flow based on this question's answer.
          </p>
        </div>

        {groups.map((group, groupIndex) => (
          <div key={group.groupIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Rule Group {groupIndex + 1}
              </h4>
              {groups.length > 1 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeGroup(group.groupIndex)}
                >
                  Remove Group
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {group.conditions.map((condition, conditionIndex) => (
                <div key={condition.id} className="flex items-center space-x-3">
                  {conditionIndex > 0 && (
                    <Select
                      value={condition.logical || 'OR'}
                      onChange={(e) => updateCondition(group.groupIndex, conditionIndex, 'logical', e.target.value as 'AND' | 'OR')}
                      options={[
                        { value: 'AND', label: 'AND' },
                        { value: 'OR', label: 'OR' },
                      ]}
                      className="w-20"
                    />
                  )}
                  
                  <Select
                    value={condition.operator}
                    onChange={(e) => updateCondition(group.groupIndex, conditionIndex, 'operator', e.target.value)}
                    options={getOperatorOptions()}
                    className="w-32"
                  />
                  
                  {getValueInput(condition, group.groupIndex, conditionIndex)}
                  
                  {group.conditions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(group.groupIndex, conditionIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => addCondition(group.groupIndex)}
                className="mt-2"
              >
                Add Condition
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Action</h5>
              <div className="flex items-center space-x-3">
                <Select
                  value={group.action.type}
                  onChange={(e) => updateAction(group.groupIndex, { ...group.action, type: e.target.value as 'skip_to_page' | 'end_survey' })}
                  options={[
                    { value: 'skip_to_page', label: 'Skip to page' },
                    { value: 'end_survey', label: 'End survey' },
                  ]}
                />
                
                {group.action.type === 'skip_to_page' && (
                  <Select
                    value={String(group.action.targetPageIndex || 0)}
                    onChange={(e) => updateAction(group.groupIndex, { ...group.action, targetPageIndex: Number(e.target.value) })}
                    options={Array.from({ length: totalPages }, (_, i) => ({
                      value: String(i),
                      label: `Page ${i + 1}`,
                    }))}
                  />
                )}
              </div>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          onClick={addGroup}
          className="w-full"
        >
          Add Rule Group
        </Button>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={() => { try { onClose(); } catch (err) { console.error(err); } }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Branching Rules
          </Button>
        </div>
      </div>
    </Modal>
  );
}