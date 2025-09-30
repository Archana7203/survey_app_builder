import { useState, useEffect } from 'react';
import { buildApiUrl } from '../../utils/apiConfig';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import { loadConfig, getRespondentProgressPaginationConfig } from '../../utils/config';

interface RespondentProgress {
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

interface RespondentProgressData {
  survey: {
    id: string;
    title: string;
    totalPages: number;
    totalRespondents: number;
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

interface Props {
  readonly surveyId: string;
}

export default function RespondentProgress({ surveyId }: Props) {
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

  console.log('RespondentProgress component rendered with surveyId:', surveyId);

  useEffect(() => {
    if (surveyId && surveyId !== 'new') {
      loadConfig().then(() => {
        const config = getRespondentProgressPaginationConfig();
        console.log('Config loaded:', config);
        if (config) {
          const newPagination = {
            page: 1,
            limit: config.defaultLimit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          };
          console.log('Setting initial pagination:', newPagination);
          setPagination(newPagination);
          fetchProgress(1, config.defaultLimit);
        } else {
          fetchProgress(1, 5); // fallback to 5
        }
      });
    } else {
      setLoading(false);
    }
  }, [surveyId]);

  const fetchProgress = async (page: number = 1, limit: number = 20) => {
    try {
      console.log('Fetching progress for surveyId:', surveyId);
      setLoading(true);
      const response = await fetch(buildApiUrl(`/api/surveys/${surveyId}/respondent-progress?page=${page}&limit=${limit}`), {
        credentials: 'include',
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const progressData = await response.json();
        console.log('Progress data received:', progressData);
        setData(progressData);
        if (progressData.pagination) {
          console.log('Setting pagination:', progressData.pagination);
          // Ensure pagination data is properly formatted
          const paginationData = {
            page: progressData.pagination.page || 1,
            limit: progressData.pagination.limit || 5,
            total: progressData.pagination.total || 0,
            totalPages: progressData.pagination.totalPages || 0,
            hasNext: progressData.pagination.hasNext || false,
            hasPrev: progressData.pagination.hasPrev || false
          };
          console.log('Formatted pagination data:', paginationData);
          setPagination(paginationData);
        } else {
          console.warn('No pagination data in response');
        }
        console.log('Total respondents:', progressData.respondentProgress?.length);
        console.log('Pagination data:', progressData.pagination);
      } else {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        setError('Failed to fetch respondent progress');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Error fetching progress data');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchProgress(newPage, pagination.limit);
  };

  const handleLimitChange = (newLimit: number) => {
    const config = getRespondentProgressPaginationConfig();
    const limit = Math.min(newLimit, config?.maxLimit || 200);
    setPagination(prev => ({ ...prev, limit }));
    fetchProgress(1, limit);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'InProgress': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (surveyId === 'new') {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="text-gray-600 dark:text-gray-400">
            Save your survey first to track respondent progress
          </div>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="text-gray-600 dark:text-gray-400">Loading respondent progress...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="error" onClose={() => setError(null)}>
        {error}
      </Alert>
    );
  }

  if (!data) return null;

  const { survey, respondentProgress } = data;
  const completedCount = respondentProgress.filter(r => r.status === 'Completed').length;
  const inProgressCount = respondentProgress.filter(r => r.status === 'InProgress').length;
  const notStartedCount = survey.totalRespondents - completedCount - inProgressCount;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{survey.totalRespondents}</div>
            <div className="text-sm text-gray-600 dark:text-white">Total Respondents</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</div>
            <div className="text-sm text-gray-600 dark:text-white">Completed</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{inProgressCount}</div>
            <div className="text-sm text-gray-600 dark:text-white">In Progress</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{notStartedCount}</div>
            <div className="text-sm text-gray-600 dark:text-white">Not Started</div>
          </div>
        </Card>
      </div>

      {/* Progress Table */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Respondent Progress
            </h3>
            <Button variant="outline" size="sm" onClick={() => fetchProgress(pagination.page, pagination.limit)}>
              Refresh
            </Button>
          </div>
          
          {respondentProgress.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No responses yet. Share your survey link to start collecting responses!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Respondent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Time Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {respondentProgress.map((respondent) => (
                    <tr key={respondent.email} className="text-gray-700 hover:ring-1 hover:ring-gray-200 dark:text-gray-300 dark:hover:ring-gray-600 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {respondent.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(respondent.status)}`}>
                          {respondent.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${respondent.completionPercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-white">
                            {respondent.progress}/{respondent.totalPages} ({respondent.completionPercentage}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-white">
                        {respondent.timeSpent > 0 ? formatTime(respondent.timeSpent) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-white">
                        {respondent.lastUpdated ? new Date(respondent.lastUpdated).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Controls - Integrated into the same card */}
        {pagination.total > pagination.limit && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} respondents
                </span>
                
                <div className="flex items-center space-x-2">
                  <label htmlFor="page-no" className="text-sm text-gray-600 dark:text-gray-400">Show:</label>
                  <select
                    value={pagination.limit}
                    onChange={(e) => handleLimitChange(Number.parseInt(e.target.value))}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value={5}>5</option>
                  </select>
                  <span className="text-sm text-gray-600 dark:text-gray-400">per page</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1"
                >
                  ← Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 text-sm rounded transition-all duration-200 ${
                          pageNum === pagination.page
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-500'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1"
                >
                  Next →
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>


    </div>
  );
}
