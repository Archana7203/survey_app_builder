import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
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

interface Props {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly surveyId: string;
  readonly respondentEmail: string;
}

const MAX_WORDS = 100;

const truncateWords = (text: string, maxWords: number) => {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return { truncated: text, isTruncated: false };
  return { truncated: words.slice(0, maxWords).join(' ') + '…', isTruncated: true };
};

export default function RespondentResponseModal({ isOpen, onClose, surveyId, respondentEmail }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseDoc, setResponseDoc] = useState<null | {
    respondentEmail?: string;
    responses: Array<{ questionId: string; value: any; pageIndex: number }>;
  }>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [respRes, surveyRes] = await Promise.all([
          fetchRespondentResponseByEmail(surveyId, respondentEmail),
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
      }
    };
    load();
  }, [isOpen, surveyId, respondentEmail]);

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
      // Secondary sort by pageIndex to keep consistent grouping if missing
      return (a.pageIndex ?? 0) - (b.pageIndex ?? 0);
    });
    return list;
  }, [responseDoc, questionOrderIndex]);

  const handleToggleExpand = (questionId: string) => {
    setExpanded((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
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
      // If object with text
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
      // If primitive string/number, match by id -> value -> text
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
          // prettify labels like very_happy -> Very Happy
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
          // Fallback if stored as array with single selection
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Responses: ${respondentEmail}`} size="xl">
      {loading ? (
        <div className="py-6 text-center text-gray-600 dark:text-gray-400">Loading responses…</div>
      ) : error ? (
        <div className="py-6 text-center text-red-600 dark:text-red-400">{error}</div>
      ) : !responseDoc ? (
        <div className="py-6 text-center text-gray-600 dark:text-gray-400">No response found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Question</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Answer</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedResponses.map((r) => {
                const q = questionById.get(r.questionId);
                return (
                  <tr key={r.questionId} className="align-top">
                    <td className="px-4 py-3 w-1/3 text-sm text-gray-900 dark:text-white">{q?.title ?? r.questionId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 break-words">
                      {renderAnswer(q, r.value)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}


