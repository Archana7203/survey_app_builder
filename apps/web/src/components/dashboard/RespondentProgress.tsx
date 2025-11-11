import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useRespondentProgress } from '../../hooks/useRespondentProgress';
import { fetchRespondentProgressApi } from '../../api-paths/surveysApi';
import ViewResponseTab from './ViewResponseTab';
import ViewQuestionWiseAnalyticsTab from './ViewQuestionWiseAnalyticsTab';
import { loadConfig, getRespondentProgressPaginationConfig } from '../../utils/config';

type TabType = 'progress' | 'response' | 'analytics';

interface Props {
  readonly surveyId: string;
}

export default function RespondentProgress({ surveyId }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('progress');
  const [selectedRespondent, setSelectedRespondent] = useState<string>('');
  const [respondentEmails, setRespondentEmails] = useState<string[]>([]);
  
  // Single pagination state for all tabs - initialized with config default (20)
  const [commonPagination, setCommonPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });

  const {
    data,
    loading,
    error,
    pagination,
    fetchProgress,
    handlePageChange,
    handleLimitChange,
    setError
  } = useRespondentProgress(surveyId);

  // Initialize pagination limit from config
  useEffect(() => {
    if (surveyId && surveyId !== 'new') {
      loadConfig().then(() => {
        const config = getRespondentProgressPaginationConfig();
        if (config) {
          setCommonPagination(prev => ({
            ...prev,
            limit: config.defaultLimit
          }));
        }
      });
    }
  }, [surveyId]);

  // Sync commonPagination with hook's pagination when on progress tab
  useEffect(() => {
    if (activeTab === 'progress' && pagination) {
      setCommonPagination(pagination);
    }
  }, [activeTab, pagination]);

  // Load respondent emails for View Response tab
  useEffect(() => {
    if ((activeTab === 'response' || activeTab === 'analytics') && surveyId && surveyId !== 'new') {
      const loadRespondentEmails = async () => {
        try {
          const progressData = await fetchRespondentProgressApi(surveyId, 1, 1000);
          const emails = progressData.respondentProgress?.map((r: any) => r.email) || [];
          setRespondentEmails(emails);
          if (activeTab === 'response' && emails.length > 0 && !selectedRespondent) {
            setSelectedRespondent(emails[0]);
          }
        } catch (err) {
          console.error('Failed to load respondent emails:', err);
        }
      };
      loadRespondentEmails();
    }
  }, [activeTab, surveyId, selectedRespondent]);

  useEffect(() => {
    if (activeTab !== 'progress') {
      setCommonPagination(prev => ({
        ...prev,
        page: 1,
        hasNext: false,
        hasPrev: false
      }));
    }
  }, [activeTab]);

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

  if (error) {
    alert(error);
    setError(null);
  }

  if (!data) {
    if (loading) {
      return (
        <Card>
          <div className="p-6 text-center">
            <div className="text-gray-600 dark:text-gray-400">Loading respondent progress...</div>
          </div>
        </Card>
      );
    }
    return null;
  }

  const { survey, respondentProgress } = data;
  const totalCount = data.summary?.total ?? survey.totalRespondents;
  const completedCount = data.summary?.completed ?? respondentProgress.filter(r => r.status === 'Completed').length;
  const inProgressCount = data.summary?.inProgress ?? respondentProgress.filter(r => r.status === 'InProgress').length;
  const notStartedCount = data.summary?.notStarted ?? (totalCount - completedCount - inProgressCount);

  // Calculate pagination for current tab
  const getCurrentPageData = () => {
    if (activeTab === 'progress') {
      return respondentProgress;
    }
    return [];
  };

  const currentPageData = getCurrentPageData();
  const handleCommonPageChange = (newPage: number) => {
    if (activeTab === 'progress') {
      setCommonPagination(prev => ({ ...prev, page: newPage }));
      handlePageChange(newPage);
    } else {
      // For response and analytics tabs, update page and recalculate hasPrev/hasNext
      setCommonPagination(prev => {
        const totalPages = prev.totalPages || 1;
        const validPage = Math.max(1, Math.min(newPage, totalPages));
        return {
          ...prev,
          page: validPage,
          hasPrev: validPage > 1,
          hasNext: validPage < totalPages
        };
      });
    }
  };

  const handleCommonLimitChange = (newLimit: number) => {
    const totalPages = commonPagination.total > 0 ? Math.ceil(commonPagination.total / newLimit) : 0;
    const updatedPagination = {
      ...commonPagination,
      limit: newLimit,
      page: 1,
      totalPages,
      hasNext: totalPages > 1,
      hasPrev: false
    };
    
    setCommonPagination(updatedPagination);
    
    // If on progress tab, also update the hook
    if (activeTab === 'progress') {
      handleLimitChange(newLimit);
    }
  };

  const shouldShowPagination = () => {
    const currentPagination = getCurrentPagination();
    // Show pagination if there are items OR if we're on response tab with a selected respondent
    // (to keep pagination visible even when respondent hasn't answered)
    if (activeTab === 'response' && selectedRespondent) {
      return true;
    }
    return currentPagination.total > 0;
  };

  // Always use commonPagination for all tabs
  const getCurrentPagination = () => {
    return commonPagination;
  };

  const getPaginationLabel = () => {
    if (activeTab === 'progress') {
      return 'respondents';
    } else if (activeTab === 'response') {
      return 'responses';
    } else {
      return 'results';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalCount}</div>
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

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-6 pt-4">
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={() => setActiveTab('progress')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'progress'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Respondent Progress
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('response')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'response'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                View Response
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                View Question Wise Responses
              </button>
            </div>
            {activeTab === 'progress' && (
              <Button variant="outline" size="sm" onClick={() => fetchProgress(commonPagination.page, commonPagination.limit)}>
                Refresh
              </Button>
            )}
          </div>
        </div>

        <div className="p-6 min-h-[400px] max-h-[400px] overflow-y-auto">
          {/* Tab Content */}
          {activeTab === 'progress' && (
            <>
              {loading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Loading respondent progress...
                </div>
              ) : currentPageData.length === 0 ? (
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
                      {currentPageData.map((respondent) => (
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
            </>
          )}

          {activeTab === 'response' && (
            <ViewResponseTab
              surveyId={survey.id}
              selectedRespondent={selectedRespondent}
              respondentEmails={respondentEmails}
              onRespondentChange={(email) => {
                setSelectedRespondent(email);
                setCommonPagination(prev => ({ ...prev, page: 1 }));
              }}
              pagination={commonPagination}
              onPaginationChange={setCommonPagination}
            />
          )}

          {activeTab === 'analytics' && (
            <ViewQuestionWiseAnalyticsTab
              surveyId={survey.id}
              pagination={commonPagination}
              onPaginationChange={setCommonPagination}
            />
          )}
        </div>

        {/* Pagination Controls - Common for all tabs */}
        {shouldShowPagination() && (() => {
          const currentPagination = getCurrentPagination();
          const label = getPaginationLabel();
          // Calculate display values, handling the case when total is 0
          const start = currentPagination.total > 0 
            ? ((currentPagination.page - 1) * currentPagination.limit) + 1 
            : 0;
          const end = currentPagination.total > 0
            ? Math.min(currentPagination.page * currentPagination.limit, currentPagination.total)
            : 0;
          return (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentPagination.total > 0 
                      ? `Showing ${start} to ${end} of ${currentPagination.total} ${label}`
                      : `Showing 0 of 0 ${label}`
                    }
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <label htmlFor="page-no" className="text-sm text-gray-600 dark:text-gray-400">Show:</label>
                    <select
                      id="page-no"
                      value={commonPagination.limit}
                      onChange={(e) => handleCommonLimitChange(Number.parseInt(e.target.value))}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-gray-600 dark:text-gray-400">per page</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCommonPageChange(currentPagination.page - 1)}
                    disabled={!currentPagination.hasPrev}
                    className="px-3 py-1"
                  >
                    ← Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, currentPagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (currentPagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (currentPagination.page >= currentPagination.totalPages - 2) {
                        pageNum = currentPagination.totalPages - 4 + i;
                      } else {
                        pageNum = currentPagination.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handleCommonPageChange(pageNum)}
                          className={`px-3 py-1 text-sm rounded transition-all duration-200 ${
                            pageNum === currentPagination.page
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
                    onClick={() => handleCommonPageChange(currentPagination.page + 1)}
                    disabled={!currentPagination.hasNext}
                    className="px-3 py-1"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </Card>
    </div>
  );
}
