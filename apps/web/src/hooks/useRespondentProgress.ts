import { useState, useEffect } from 'react';
import { loadConfig, getRespondentProgressPaginationConfig } from '../utils/config';
import { fetchRespondentProgressApi } from '../api-paths/surveysApi';

export interface RespondentProgress {
  email: string;
  status: string;
  startedAt: string;
  lastUpdated: string;
  progress: number;
  totalPages: number;
  timeSpent: number;
  pagesVisited: number[];
  completionPercentage: number;
}

export interface RespondentProgressData {
  survey: {
    id: string;
    title: string;
    totalPages: number;
    totalRespondents: number;
  };
  summary?: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  };
  respondentProgress: RespondentProgress[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const useRespondentProgress = (surveyId: string) => {
  const [data, setData] = useState<RespondentProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });

  const fetchProgress = async (page: number = 1, limit: number = 20) => {
    try {
      setLoading(true);
      const progressData = await fetchRespondentProgressApi(surveyId, page, limit);
      setData(progressData);

      if (progressData.pagination) {
        const paginationData = {
          page: progressData.pagination.page || page,
          limit: progressData.pagination.limit || limit,
          total: progressData.pagination.total || 0,
          totalPages: progressData.pagination.totalPages || 0,
          hasNext: progressData.pagination.hasNext || false,
          hasPrev: progressData.pagination.hasPrev || false
        };
        setPagination(paginationData);
      } else {
        setPagination(prev => ({
          ...prev,
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }));
        console.warn('No pagination data in response');
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
      setError(error.message || 'Error fetching progress data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (surveyId && surveyId !== 'new') {
      loadConfig().then(() => {
        const config = getRespondentProgressPaginationConfig();
        if (config) {
          const newPagination = {
            page: 1,
            limit: config.defaultLimit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          };
          setPagination(newPagination);
          fetchProgress(1, config.defaultLimit);
        } else {
          // fallback to 20 (matching config default)
          fetchProgress(1, 20);
        }
      });
    } else {
      setLoading(false);
    }
  }, [surveyId]);

  const handlePageChange = (newPage: number) => {
    fetchProgress(newPage, pagination.limit);
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      page: 1, 
      hasNext: false,
      hasPrev: false
    }));
    fetchProgress(1, newLimit);
  };

  return {
    data,
    loading,
    error,
    pagination,
    fetchProgress,
    handlePageChange,
    handleLimitChange,
    setError
  };
};

