import { useState, useEffect, useMemo } from 'react';
import { fetchSurveyByIdApi } from '../../api-paths/surveysApi';
import { fetchRespondentResponseByEmail } from '../../api-paths/responsesApi';
import { fetchRespondentProgressApi } from '../../api-paths/surveysApi';

type QuestionType =
  | 'singleChoice'
  | 'multiChoice'
  | 'dropdown'
  | 'slider'
  | 'ratingStar'
  | 'ratingSmiley'
  | 'ratingNumber'
  | 'textShort'
  | 'textLong'
  | 'datePicker'
  | 'fileUpload'
  | 'email';

interface SurveyQuestion {
  id: string;
  title: string;
  type: QuestionType;
  options?: Array<{ id: string; text: string; value?: string }>;
}

interface RespondentAnswer {
  email: string;
  response?: any;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Props {
  readonly surveyId: string;
  readonly pagination: PaginationState;
  readonly onPaginationChange: (pagination: PaginationState) => void;
}

type TextFilter = 'Equals' | 'Not Equals' | 'Contains' | 'Not Contains';
type NumberFilter = 'Greater Than' | 'Lesser Than' | 'Equals' | 'Not Equals';
type MultiChoiceFilter = 'Has Selected' | 'Has Not Selected';
type SingleChoiceFilter = 'Has Selected';
type ChoiceFilter = MultiChoiceFilter | SingleChoiceFilter;

const getQuestionType = (type: QuestionType): 'text' | 'number' | 'choice' => {
  if (type === 'textShort' || type === 'textLong') return 'text';
  if (type === 'ratingStar' || type === 'ratingSmiley' || type === 'ratingNumber' || type === 'slider') return 'number';
  if (type === 'singleChoice' || type === 'multiChoice' || type === 'dropdown') return 'choice';
  return 'text'; // default
};

const renderAnswer = (question: SurveyQuestion, value: any): string => {
  if (value === null || value === undefined) return '-';
  
  const getOptionLabel = (raw: any): string => {
    if (!question.options || question.options.length === 0) return String(raw ?? '-');
    
    if (raw && typeof raw === 'object') {
      if ('text' in raw && typeof (raw as any).text === 'string') return (raw as any).text as string;
      if ('id' in raw && typeof (raw as any).id === 'string') {
        const byId = question.options.find(o => o.id === (raw as any).id);
        if (byId) return byId.text;
      }
      if ('value' in raw && typeof (raw as any).value === 'string') {
        const byVal = question.options.find(o => o.value === (raw as any).value);
        if (byVal) return byVal.text;
      }
    }
    
    const key = String(raw);
    const byId = question.options.find(o => o.id === key);
    if (byId) return byId.text;
    const byVal = question.options.find(o => o.value === key);
    if (byVal) return byVal.text;
    return key;
  };

  switch (question.type) {
    case 'ratingStar':
    case 'ratingSmiley':
    case 'ratingNumber':
    case 'slider':
      if (question.type === 'ratingSmiley' && typeof value === 'string') {
        return value
          .replace(/[_-]+/g, ' ')
          .trim()
          .split(/\s+/)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      }
      return String(value);
    case 'singleChoice':
    case 'dropdown': {
      if (Array.isArray(value)) {
        const first = value[0];
        return first === undefined ? '-' : getOptionLabel(first);
      }
      return getOptionLabel(value);
    }
    case 'multiChoice': {
      const items = Array.isArray(value) ? value : (value ? [value] : []);
      if (items.length === 0) return '-';
      return items.map(v => getOptionLabel(v)).join(', ');
    }
    case 'textShort':
    case 'textLong':
      return typeof value === 'string' ? value : JSON.stringify(value);
    case 'datePicker':
      return value ? new Date(value).toLocaleString() : '-';
    case 'fileUpload':
      return Array.isArray(value) ? `${value.length} file(s)` : (value ? '1 file' : '-');
    case 'email':
      return typeof value === 'string' ? value : '-';
    default:
      return String(value ?? '-');
  }
};

const applyTextFilter = (answer: string, filter: TextFilter, value: string): boolean => {
  const answerLower = answer.toLowerCase();
  const valueLower = value.toLowerCase();
  
  switch (filter) {
    case 'Equals':
      return answerLower === valueLower;
    case 'Not Equals':
      return answerLower !== valueLower;
    case 'Contains':
      return answerLower.includes(valueLower);
    case 'Not Contains':
      return !answerLower.includes(valueLower);
    default:
      return true;
  }
};

const applyNumberFilter = (answer: number, filter: NumberFilter, value: number): boolean => {
  switch (filter) {
    case 'Greater Than':
      return answer > value;
    case 'Lesser Than':
      return answer < value;
    case 'Equals':
      return answer === value;
    case 'Not Equals':
      return answer !== value;
    default:
      return true;
  }
};

const normalizeAnswerToIds = (answer: any, question: SurveyQuestion): string[] => {
  if (!question.options || question.options.length === 0) return [];
  
  const normalizeItem = (item: any): string | null => {
    if (item === null || item === undefined) return null;
  
      if (typeof item === 'object' && item !== null) {
      const id = (item as any).id;
      const value = (item as any).value;
      const text = (item as any).text;
      
      if (id && typeof id === 'string') {
        const option = question.options!.find(o => o.id === id);
        if (option) return option.id;
      }
      if (value && typeof value === 'string') {
        const option = question.options!.find(o => o.value === value);
        if (option) return option.id;
      }
      if (text && typeof text === 'string') {
        const option = question.options!.find(o => o.text === text);
        if (option) return option.id;
      }
      return null;
    }
    
    const str = String(item);
    const byId = question.options!.find(o => o.id === str);
    if (byId) return byId.id;
    const byValue = question.options!.find(o => o.value === str);
    if (byValue) return byValue.id;
    const byText = question.options!.find(o => o.text === str);
    if (byText) return byText.id;
    
    return null;
  };
  
  const items = Array.isArray(answer) ? answer : (answer !== null && answer !== undefined ? [answer] : []);
  return items.map(normalizeItem).filter((id): id is string => id !== null);
};

const applyChoiceFilter = (
  answer: any,
  selectedValues: string | string[],
  filter: ChoiceFilter,
  question: SurveyQuestion
): boolean => {
  if (!question.options || question.options.length === 0) return false;
  
  const isMultiChoice = question.type === 'multiChoice';
  const filterValues = Array.isArray(selectedValues) ? selectedValues : (selectedValues ? [selectedValues] : []);
  
  if (filterValues.length === 0) return true;
  
  if (isMultiChoice) {
    const answerIds = normalizeAnswerToIds(answer, question);
    
    if (filter === 'Has Selected') {
      return filterValues.some(id => answerIds.includes(id));
    } else if (filter === 'Has Not Selected') {
      return !filterValues.some(id => answerIds.includes(id));
    }
    return false;
  } else {
    // Single choice or dropdown
    if (filter !== 'Has Selected') return false;
    
    const selectedValue = filterValues[0];
    const selectedOption = question.options.find(
      opt => opt.id === selectedValue || opt.value === selectedValue || opt.text === selectedValue
    );
    if (!selectedOption) return false;
    
    const answerIds = normalizeAnswerToIds(answer, question);
    return answerIds.includes(selectedOption.id);
  }
};

export default function ViewQuestionWiseAnalyticsTab({ surveyId, pagination, onPaginationChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [filter, setFilter] = useState<TextFilter | NumberFilter | ChoiceFilter>('Equals');
  const [filterValue, setFilterValue] = useState<string | string[]>('');
  const [multiChoiceDropdownValue, setMultiChoiceDropdownValue] = useState<string>('');
  const [allRespondentAnswers, setAllRespondentAnswers] = useState<RespondentAnswer[]>([]);
  const [filteredAnswers, setFilteredAnswers] = useState<Array<{ email: string; answer: string }>>([]);
  const [questionSearchQuery, setQuestionSearchQuery] = useState('');
  const [isQuestionDropdownOpen, setIsQuestionDropdownOpen] = useState(false);

  const selectedQuestion = useMemo(() => {
    return questions.find(q => q.id === selectedQuestionId);
  }, [questions, selectedQuestionId]);

  const filteredQuestions = useMemo(() => {
    if (!questionSearchQuery.trim()) return questions;
    const query = questionSearchQuery.toLowerCase();
    return questions.filter(q => q.title.toLowerCase().includes(query));
  }, [questions, questionSearchQuery]);

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setQuestionSearchQuery('');
    setIsQuestionDropdownOpen(false);
  };

  const handleQuestionSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuestionSearchQuery(value);
    setIsQuestionDropdownOpen(true);
    // If user starts typing different text, clear selection
    if (selectedQuestion && value !== selectedQuestion.title) {
      setSelectedQuestionId('');
    }
  };

  const handleQuestionInputFocus = () => {
    setIsQuestionDropdownOpen(true);
    // Clear search query on focus to allow typing
    if (selectedQuestion) {
      setQuestionSearchQuery('');
    }
  };

  const handleQuestionInputBlur = () => {
    setTimeout(() => setIsQuestionDropdownOpen(false), 300);
  };

  const questionType = useMemo(() => {
    if (!selectedQuestion) return null;
    return getQuestionType(selectedQuestion.type);
  }, [selectedQuestion]);

  // Load all data when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const surveyData = await fetchSurveyByIdApi(surveyId);
        const surveyQuestions: SurveyQuestion[] = Array.isArray(surveyData?.pages)
          ? surveyData.pages.flatMap((p: any) => Array.isArray(p.questions) ? p.questions : [])
              .map((q: any) => ({ id: q.id, title: q.title, type: q.type, options: q.options }))
          : [];
        setQuestions(surveyQuestions);

        if (surveyQuestions.length > 0) {
          setSelectedQuestionId(surveyQuestions[0].id);
          setQuestionSearchQuery('');
        }

        // Fetch all respondent responses
        const progressData = await fetchRespondentProgressApi(surveyId, 1, 1000);
        const respondentEmails = progressData.respondentProgress?.map((r: any) => r.email) || [];

        const responseMap = new Map<string, any>();
        for (const email of respondentEmails) {
          try {
            const response = await fetchRespondentResponseByEmail(surveyId, email);
            if (response?.responses) {
              responseMap.set(email, response);
            }
          } catch (err) {
            console.warn(`Failed to fetch response for ${email}:`, err);
          }
        }

        const answers: Array<{ email: string; response: any }> = [];
        responseMap.forEach((response, email) => {
          answers.push({ email, response });
        });

        setAllRespondentAnswers(answers);
      } catch (e: any) {
        setError(e?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [surveyId]);

  useEffect(() => {
    if (!selectedQuestion) {
      setFilter('Equals');
      setFilterValue('');
      return;
    }

    const type = getQuestionType(selectedQuestion.type);
    if (type === 'text') {
      setFilter('Equals' as TextFilter);
      setFilterValue('');
    } else if (type === 'number') {
      setFilter('Equals' as NumberFilter);
      setFilterValue('');
    } else if (type === 'choice') {
      if (selectedQuestion.type === 'multiChoice') {
        setFilter('Has Selected' as MultiChoiceFilter);
        // Set default to "All" - use special marker
        setFilterValue('__ALL__');
        setMultiChoiceDropdownValue('__ALL__');
      } else {
        setFilter('Has Selected' as SingleChoiceFilter);
        setFilterValue('');
        setMultiChoiceDropdownValue('');
      }
    }
    setFilteredAnswers([]);
  }, [selectedQuestion]);

  // Filter responses when question or filter changes
  useEffect(() => {
    if (!selectedQuestion || allRespondentAnswers.length === 0) {
      setFilteredAnswers([]);
      return;
    }

    const answers: Array<{ email: string; answer: string }> = [];
    
    for (const respondentData of allRespondentAnswers) {
      const response = respondentData.response;
      if (response?.responses) {
        const questionResponse = response.responses.find((r: any) => r.questionId === selectedQuestion.id);
        if (questionResponse) {
          const answerValue = questionResponse.value;
          const renderedAnswer = renderAnswer(selectedQuestion, answerValue);
          
          // Check if filter should be applied
          const hasFilterValue = Array.isArray(filterValue) 
            ? filterValue.length > 0 
            : typeof filterValue === 'string' && filterValue.trim().length > 0;
          
          // For multiChoice, '__ALL__' means filter with all options, so we still apply filter
          const shouldApplyFilter = hasFilterValue || (selectedQuestion.type === 'multiChoice' && filterValue === '__ALL__');
          
          if (!shouldApplyFilter) {
            answers.push({ email: respondentData.email, answer: renderedAnswer });
          } else {
            // Otherwise apply filter
            let matches = false;
            
            if (questionType === 'text') {
              matches = applyTextFilter(renderedAnswer, filter as TextFilter, filterValue as string);
            } else if (questionType === 'number') {
              const numValue = Number.parseFloat(filterValue as string);
              const numAnswer = Number.parseFloat(String(answerValue));
              if (!Number.isNaN(numValue) && !Number.isNaN(numAnswer)) {
                matches = applyNumberFilter(numAnswer, filter as NumberFilter, numValue);
              }
            } else if (questionType === 'choice') {
              // For multiChoice with "All", use all option IDs
              let filterValueToUse = filterValue;
              if (selectedQuestion.type === 'multiChoice' && filterValue === '__ALL__') {
                filterValueToUse = selectedQuestion.options?.map(opt => opt.id) || [];
              }
              matches = applyChoiceFilter(answerValue, filterValueToUse, filter as ChoiceFilter, selectedQuestion);
            }
            
            if (matches) {
              answers.push({ email: respondentData.email, answer: renderedAnswer });
            }
          }
        }
      }
    }

    setFilteredAnswers(answers);
  }, [selectedQuestion, filter, filterValue, allRespondentAnswers, questionType]);

  // Paginate filtered answers
  const paginatedAnswers = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    return filteredAnswers.slice(start, end);
  }, [filteredAnswers, pagination.page, pagination.limit]);

  // Update pagination when filtered answers change
  useEffect(() => {
    const total = filteredAnswers.length;
    if (total > 0) {
      const totalPages = Math.ceil(total / pagination.limit);
      const currentPage = pagination.page > totalPages ? 1 : pagination.page;
      
      onPaginationChange({
        ...pagination,
        total,
        totalPages,
        page: currentPage,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      });
    } else {
      onPaginationChange({
        ...pagination,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredAnswers.length, pagination.limit]);

  // Reset to page 1 when question or filter changes
  useEffect(() => {
    onPaginationChange({ ...pagination, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuestionId, filter, filterValue]);

  const textFilterOptions: TextFilter[] = ['Equals', 'Not Equals', 'Contains', 'Not Contains'];
  const numberFilterOptions: NumberFilter[] = ['Greater Than', 'Lesser Than', 'Equals', 'Not Equals'];

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600 dark:text-red-400">{error}</div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Question Searchable Dropdown */}
      <div className="flex items-center gap-3">
        <label htmlFor="question-select" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap w-20">
          Question:
        </label>
        <div className="flex-1 relative">
          <input
            id="question-select"
            type="text"
            placeholder="Search or select a question..."
            value={selectedQuestion && !questionSearchQuery ? selectedQuestion.title : questionSearchQuery}
            onChange={handleQuestionSearchChange}
            onFocus={handleQuestionInputFocus}
            onBlur={handleQuestionInputBlur}
            className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search or select a question"
          />
          {isQuestionDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuestionSelect(q.id);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer ${
                      q.id === selectedQuestionId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {q.title}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {questions.length === 0 
                    ? 'No questions available' 
                    : 'No questions found matching your search'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter and Value */}
      {selectedQuestion && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <label htmlFor="filter-select" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap w-20">
                Filter:
              </label>
              <select
                id="filter-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                disabled={questionType === 'choice' && selectedQuestion.type !== 'multiChoice'}
                className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Filter type"
              >
                {questionType === 'text' && textFilterOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                {questionType === 'number' && numberFilterOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                {questionType === 'choice' && selectedQuestion.type === 'multiChoice' && (
                  <>
                    <option value="Has Selected">Has Selected</option>
                    <option value="Has Not Selected">Has Not Selected</option>
                  </>
                )}
                {questionType === 'choice' && selectedQuestion.type !== 'multiChoice' && (
                  <option value="Has Selected">Has Selected</option>
                )}
              </select>
            </div>
            <div className="flex items-center gap-3 flex-1">
              <label htmlFor="filter-value" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap w-20">
                Value:
              </label>
              {questionType === 'choice' && selectedQuestion.type === 'multiChoice' ? (
                <select
                  id="filter-value"
                  value={multiChoiceDropdownValue}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (!selectedId) return;
                    
                    if (selectedId === '__ALL__') {
                      setFilterValue('__ALL__');
                      setMultiChoiceDropdownValue('__ALL__');
                    } else {
                      const currentValues = Array.isArray(filterValue) ? filterValue : [];
                      // If currently "All", start fresh with just this option
                      if (filterValue === '__ALL__') {
                        setFilterValue([selectedId]);
                      } else if (!currentValues.includes(selectedId)) {
                        setFilterValue([...currentValues, selectedId]);
                      }
                      setMultiChoiceDropdownValue('');
                    }
                  }}
                  className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Select an option to add"
                >
                  {filterValue === '__ALL__' ? (
                    <>
                      <option value="__ALL__">All</option>
                      {selectedQuestion.options?.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.text}
                        </option>
                      ))}
                    </>
                  ) : (
                    <>
                      <option value="">Select a choice</option>
                      <option value="__ALL__">All</option>
                      {selectedQuestion.options?.filter(opt => {
                        const currentValues = Array.isArray(filterValue) ? filterValue : [];
                        return !currentValues.includes(opt.id);
                      }).map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.text}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              ) : questionType === 'choice' ? (
                <select
                  id="filter-value"
                  value={typeof filterValue === 'string' ? filterValue : ''}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Select a choice"
                >
                  <option value="">Select a choice</option>
                  {selectedQuestion.options?.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.text}
                    </option>
                  ))}
                </select>
              ) : questionType === 'number' ? (
                <input
                  id="filter-value"
                  type="number"
                  value={typeof filterValue === 'string' ? filterValue : ''}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter number"
                  aria-label="Filter number value"
                />
              ) : (
                <input
                  id="filter-value"
                  type="text"
                  value={typeof filterValue === 'string' ? filterValue : ''}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter text"
                  aria-label="Filter text value"
                />
              )}
            </div>
          </div>
          {/* Chips display below value dropdown for multiChoice */}
          {questionType === 'choice' && selectedQuestion.type === 'multiChoice' && Array.isArray(filterValue) && filterValue.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-20"></div>
              <div className="flex-1 flex flex-wrap gap-2">
                {filterValue.map((val) => {
                  const option = selectedQuestion.options?.find(o => o.id === val);
                  if (!option) return null;
                  return (
                    <span
                      key={val}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm"
                    >
                      <span>{option.text}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const currentValues = Array.isArray(filterValue) ? filterValue : [];
                          const newValues = currentValues.filter(v => v !== val);
                          // If no values left, set to "All"
                          setFilterValue(newValues.length > 0 ? newValues : '__ALL__');
                          if (newValues.length === 0) {
                            setMultiChoiceDropdownValue('__ALL__');
                          }
                        }}
                        className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 focus:outline-none"
                        aria-label={`Remove ${option.text}`}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            const currentValues = Array.isArray(filterValue) ? filterValue : [];
                            const newValues = currentValues.filter(v => v !== val);
                            setFilterValue(newValues.length > 0 ? newValues : '__ALL__');
                            if (newValues.length === 0) {
                              setMultiChoiceDropdownValue('__ALL__');
                            }
                          }
                        }}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Table */}
      {selectedQuestion && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Respondent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Answer
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedAnswers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {(Array.isArray(filterValue) && filterValue.length > 0) || (typeof filterValue === 'string' && filterValue.trim()) || (selectedQuestion.type === 'multiChoice' && filterValue === '__ALL__')
                      ? 'No matching responses found' 
                      : 'No responses found for this question'}
                  </td>
                </tr>
              ) : (
                paginatedAnswers.map((item) => (
                  <tr key={item.email} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 break-words">
                      {item.answer}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

