import { useState, useEffect, useMemo } from 'react';
import { fetchRespondentResponseByEmail } from '../../api-paths/responsesApi';
import { buildApiUrl } from '../../api-paths/apiConfig';

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

type SurveyQuestion = {
  id: string;
  title: string;
  type: QuestionType;
  options?: Array<{ id: string; text: string; value?: string }>;
};

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
  readonly selectedRespondent: string;
  readonly respondentEmails: string[];
  readonly onRespondentChange: (email: string) => void;
  readonly pagination: PaginationState;
  readonly onPaginationChange: (pagination: PaginationState) => void;
}

const MAX_WORDS = 100;

const truncateWords = (text: string, maxWords: number) => {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return { truncated: text, isTruncated: false };
  return { truncated: words.slice(0, maxWords).join(' ') + '…', isTruncated: true };
};

export default function ViewResponseTab({ 
  surveyId, 
  selectedRespondent, 
  respondentEmails, 
  onRespondentChange,
  pagination,
  onPaginationChange 
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [responseDoc, setResponseDoc] = useState<null | {
    respondentEmail?: string;
    responses: Array<{ questionId: string; value: any; pageIndex: number }>;
  }>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [respondentSearchQuery, setRespondentSearchQuery] = useState('');
  const [isRespondentDropdownOpen, setIsRespondentDropdownOpen] = useState(false);

  useEffect(() => {
    if (!selectedRespondent) {
      setResponseDoc(null);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [respRes, surveyRes] = await Promise.all([
          fetchRespondentResponseByEmail(surveyId, selectedRespondent),
          fetch(buildApiUrl(`/api/surveys/${surveyId}`), { credentials: 'include' }),
        ]);
        const surveyData = surveyRes.ok ? await surveyRes.json() : null;
        const surveyQuestions: SurveyQuestion[] = Array.isArray(surveyData?.pages)
          ? surveyData.pages.flatMap((p: any) => Array.isArray(p.questions) ? p.questions : [])
              .map((q: any) => ({ id: q.id, title: q.title, type: q.type, options: q.options }))
          : [];
        setQuestions(surveyQuestions);
        setResponseDoc(respRes);
      } catch (e: any) {
        setError(e?.message || 'Failed to load responses');
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };
    load();
  }, [surveyId, selectedRespondent]);

  const questionById = useMemo(() => {
    const map = new Map<string, SurveyQuestion>();
    questions.forEach((q) => map.set(q.id, q));
    return map;
  }, [questions]);

  const questionOrderIndex = useMemo(() => {
    const indexMap = new Map<string, number>();
    questions.forEach((q, idx) => indexMap.set(q.id, idx));
    return indexMap;
  }, [questions]);

  const sortedResponses = useMemo(() => {
    if (!responseDoc) return [] as { questionId: string; value: any; pageIndex: number }[];
    const list = [...responseDoc.responses];
    list.sort((a, b) => {
      const ai = questionOrderIndex.get(a.questionId);
      const bi = questionOrderIndex.get(b.questionId);
      const aIdx = typeof ai === 'number' ? ai : Number.POSITIVE_INFINITY;
      const bIdx = typeof bi === 'number' ? bi : Number.POSITIVE_INFINITY;
      if (aIdx !== bIdx) return aIdx - bIdx;
      return (a.pageIndex ?? 0) - (b.pageIndex ?? 0);
    });
    return list;
  }, [responseDoc, questionOrderIndex]);

  // Paginate responses
  const paginatedResponses = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    return sortedResponses.slice(start, end);
  }, [sortedResponses, pagination.page, pagination.limit]);

  // Update pagination when responses change
  useEffect(() => {
    const total = sortedResponses.length;
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
  }, [sortedResponses.length, pagination.limit]);

  const handleToggleExpand = (questionId: string) => {
    setExpanded((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const filteredRespondents = useMemo(() => {
    if (!respondentSearchQuery.trim()) return respondentEmails;
    const query = respondentSearchQuery.toLowerCase();
    return respondentEmails.filter(email => email.toLowerCase().includes(query));
  }, [respondentEmails, respondentSearchQuery]);

  const handleRespondentSelect = (email: string) => {
    onRespondentChange(email);
    onPaginationChange({ ...pagination, page: 1 });
    setRespondentSearchQuery('');
    setIsRespondentDropdownOpen(false);
  };

  const handleRespondentSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRespondentSearchQuery(value);
    setIsRespondentDropdownOpen(true);
    // If user starts typing different text, clear selection
    if (selectedRespondent && value !== selectedRespondent) {
      onRespondentChange('');
    }
  };

  const handleRespondentInputFocus = () => {
    setIsRespondentDropdownOpen(true);
    // Clear search query on focus to allow typing
    if (selectedRespondent) {
      setRespondentSearchQuery('');
    }
  };

  const handleRespondentInputBlur = () => {
    setTimeout(() => setIsRespondentDropdownOpen(false), 300);
  };

  const renderAnswer = (q: SurveyQuestion | undefined, value: any) => {
    if (!q) return '-';
    const toPretty = (s: string): string => {
      return s
        .replace(/[_-]+/g, ' ')
        .trim()
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    };

    const getOptionLabel = (raw: any): string => {
      if (!q.options || q.options.length === 0) return String(raw ?? '-');
      if (raw && typeof raw === 'object') {
        if ('text' in raw && typeof (raw as any).text === 'string') return (raw as any).text as string;
        if ('id' in raw && typeof (raw as any).id === 'string') {
          const byId = q.options.find(o => o.id === (raw as any).id);
          if (byId) return byId.text;
        }
        if ('value' in raw && typeof (raw as any).value === 'string') {
          const byVal = q.options.find(o => o.value === (raw as any).value);
          if (byVal) return byVal.text;
        }
      }
      const key = String(raw);
      const byId = q.options.find(o => o.id === key);
      if (byId) return byId.text;
      const byVal = q.options.find(o => o.value === key);
      if (byVal) return byVal.text;
      const byText = q.options.find(o => o.text === key);
      if (byText) return byText.text;
      return toPretty(key);
    };
    switch (q.type) {
      case 'ratingStar':
      case 'ratingSmiley':
      case 'ratingNumber':
      case 'slider':
        if (q.type === 'ratingSmiley' && typeof value === 'string') {
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
      case 'textLong': {
        const text = typeof value === 'string' ? value : JSON.stringify(value);
        const { truncated, isTruncated } = truncateWords(text, MAX_WORDS);
        const isOpen = expanded[q.id];
        if (!isTruncated || isOpen) return text;
        return (
          <span>
            {truncated}{' '}
            <button
              type="button"
              onClick={() => handleToggleExpand(q.id)}
              className="text-blue-600 hover:underline focus:outline-none"
            >
              View more
            </button>
          </span>
        );
      }
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

  // Show loading during initial load or when actually loading
  if (initialLoad || loading || (selectedRespondent && !responseDoc)) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Loading responses…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600 dark:text-red-400">{error}</div>
    );
  }

  if (!selectedRespondent) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Select a respondent to view their responses.
      </div>
    );
  }

  if (!responseDoc) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No response found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="respondent-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Respondent
        </label>
        <div className="relative">
          <input
            id="respondent-select"
            type="text"
            placeholder="Search or select a respondent..."
            value={selectedRespondent && !respondentSearchQuery ? selectedRespondent : respondentSearchQuery}
            onChange={handleRespondentSearchChange}
            onFocus={handleRespondentInputFocus}
            onBlur={handleRespondentInputBlur}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search or select a respondent"
          />
          {isRespondentDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredRespondents.length > 0 ? (
                filteredRespondents.map((email) => (
                  <button
                    key={email}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRespondentSelect(email);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer ${
                      email === selectedRespondent ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {email}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {respondentEmails.length === 0 
                    ? 'No respondents available' 
                    : 'No respondents found matching your search'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {selectedRespondent && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Question</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Answer</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedResponses.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    No responses found
                  </td>
                </tr>
              ) : (
                paginatedResponses.map((r) => {
                  const q = questionById.get(r.questionId);
                  return (
                    <tr key={r.questionId} className="align-top">
                      <td className="px-4 py-3 w-1/3 text-sm text-gray-900 dark:text-white">{q?.title ?? r.questionId}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 break-words">
                        {renderAnswer(q, r.value)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

