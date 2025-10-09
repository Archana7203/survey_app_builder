import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SURVEYS_API } from '../../api-paths/surveysApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import NewSurveyModal from '../../components/modals/NewSurveyModal';
import RespondentsModal from '../../components/modals/RespondentsModal';
import { 
  exportSurveyToFile, 
  importSurveyFromFile, 
  uploadImportedSurvey, 
  duplicateSurvey 
} from '../../utils/surveyImportExport';
import { loadConfig, getSurveyPaginationConfig } from '../../utils/config';

interface Survey {
  id: string;
  title: string;
  description?: string;
  slug: string;
  status: 'draft' | 'published' | 'closed';
  closeDate?: string;
  createdAt: string;
  updatedAt: string;
  responseCount?: number;
  locked?: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const Surveys: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [respondentsModalOpen, setRespondentsModalOpen] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConfig().then(() => {
      const config = getSurveyPaginationConfig();
      if (config) {
        setPagination(prev => ({
          ...prev,
          limit: config.defaultLimit
        }));
      }
      fetchSurveys(1, config?.defaultLimit || 5);
    });
  }, []);

  const fetchSurveys = async (page: number = 1, limit: number = 5) => {
    try {
      setLoading(true);
      const response = await fetch(SURVEYS_API.LIST(page, limit), {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        setSurveys(data.surveys || data); // Handle both new paginated and old format
        if (data.pagination) {
          setPagination(data.pagination);
        } else {
          // Calculate pagination manually if API doesn't provide it
          const total = data.surveys ? data.surveys.length : data.length;
          const totalPages = Math.ceil(total / limit);
          setPagination(prev => ({
            ...prev,
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }));
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to load surveys';
        setError(errorMessage);
        console.error('Failed to fetch surveys:', errorMessage, response.status);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error loading surveys';
      setError('Error loading surveys');
      console.error('Error loading surveys:', errorMessage, error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchSurveys(newPage, pagination.limit);
  };

  const handleCreateSurvey = async (data: {
    title: string;
    description: string;
    closeDate: string;
  }) => {
    setSubmitting(true);
    setError(null); // Clear any previous errors
    try {
      
      const response = await fetch(SURVEYS_API.CREATE(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const newSurvey = await response.json();
        
        setSurveys(prev => [newSurvey, ...prev]);
        setIsModalOpen(false);
        
        // Update pagination to reflect the new total count
        setPagination(prev => ({
          ...prev,
          total: prev.total + 1,
          totalPages: Math.ceil((prev.total + 1) / prev.limit)
        }));
        
        // Refresh the surveys list to get updated pagination from server
        fetchSurveys(1, pagination.limit);
      } else {
        const errorText = await response.text();
        
        setError(`Failed to create survey (${response.status}): ${errorText}`);
      }
    } catch (err) {
      
      setError(`Error creating survey: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string, closeDate?: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      closed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    
    // Only show "Closed" status for draft surveys with close dates
    // Published surveys should never show as "Closed" even if they have close dates
    const displayStatus = status === 'draft' && closeDate ? 'Closed' : status;
    const displayColors = status === 'draft' && closeDate ? colors.closed : colors[status as keyof typeof colors];
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${displayColors}`}>
        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDuplicate = async (surveyId: string) => {
    setDuplicating(surveyId);
    setError(null);
    try {
      const newSurvey = await duplicateSurvey(surveyId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSurveys(prev => [newSurvey as any, ...prev]);
      
      // Update pagination to reflect the new total count
      setPagination(prev => ({
        ...prev,
        total: prev.total + 1,
        totalPages: Math.ceil((prev.total + 1) / prev.limit)
      }));
      
      // Refresh the surveys list to get updated pagination from server
      fetchSurveys(1, pagination.limit);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to duplicate survey');
    } finally {
      setDuplicating(null);
    }
  };

  const handleDelete = async (surveyId: string) => {
    setDeleting(surveyId);
    setError(null);
    try {
      const res = await fetch(SURVEYS_API.DELETE(surveyId), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to delete (${res.status}): ${txt}`);
      }
      setSurveys(prev => prev.filter(s => s.id !== surveyId));
      
      // Update pagination to reflect the reduced total count
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        totalPages: Math.ceil(Math.max(0, prev.total - 1) / prev.limit)
      }));
      
      // If we're on a page that no longer exists, go to the last available page
      const newTotalPages = Math.ceil(Math.max(0, pagination.total - 1) / pagination.limit);
      if (pagination.page > newTotalPages && newTotalPages > 0) {
        fetchSurveys(newTotalPages, pagination.limit);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete survey');
    } finally {
      setDeleting(null);
    }
  };

  const handlePublishToggle = async (survey: Survey) => {
    if (!survey?.id) {
      setError('Invalid survey data');
      return;
    }
    
    setPublishing(survey.id);
    setError(null);
    
    const updateData = { 
      status: survey.status === 'published' ? 'draft' : 'published'
      // Removed automatic closeDate setting when unpublishing
    };
    try {
      const res = await fetch(SURVEYS_API.UPDATE(survey.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to update status (${res.status}): ${txt}`);
      }
      const updated = await res.json();
      
      // Validate the response structure
      if (!updated.survey || typeof updated.survey.status !== 'string') {
        throw new Error('Invalid response format from server');
      }
      
      // Always refresh the surveys list to get the most up-to-date data
      // This ensures closeDate and other fields are properly updated
      fetchSurveys(pagination.page, pagination.limit);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update survey status');
    } finally {
      setPublishing(null);
    }
  };

  const handleExport = async (surveyId: string) => {
    setExporting(surveyId);
    setError(null);
    try {
      await exportSurveyToFile(surveyId);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to export survey');
    } finally {
      setExporting(null);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      const surveyData = await importSurveyFromFile(file);
      const newSurvey = await uploadImportedSurvey(surveyData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSurveys(prev => [newSurvey as any, ...prev]);
      
      // Update pagination to reflect the new total count
      setPagination(prev => ({
        ...prev,
        total: prev.total + 1,
        totalPages: Math.ceil((prev.total + 1) / prev.limit)
      }));
      
      // Refresh the surveys list to get updated pagination from server
      fetchSurveys(1, pagination.limit);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to import survey');
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading surveys...</div>
      </div>
    );
  }

  const getPublishIcon = (survey: Survey, publishingId: string | null) => {
    if (publishingId === survey.id) return '⏳';
    if (survey.status === 'published') return '🚫';
    return '✅';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Surveys</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-white">Create and manage your surveys</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            onClick={handleImportClick}
            title="Import survey - Upload a JSON file to restore a previously exported survey"
            className="text-sm"
          >
            📥 Import
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/dashboard/templates" className="w-full">
              <Button 
                variant="outline"
                title="Browse templates - Use pre-built survey templates to get started quickly"
                className="text-sm w-full"
              >
                📋 Templates
              </Button>
            </Link>
            <Link to="/dashboard/surveys/new" className="w-full">
              <Button 
                variant="primary"
                title="Create new survey - Start building a survey from scratch"
                className="text-sm w-full"
              >
                + Create Survey
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Survey List */}
      {surveys.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">No surveys yet</p>
            <p className="text-sm">Create your first survey to get started</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} surveys
            </div>
            {surveys.map((survey) => (
              <Card key={survey.id} className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {survey.title}
                    </h3>
                    {survey.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {survey.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{getStatusBadge(survey.status, survey.closeDate)}</span>
                    <span>{formatDate(survey.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-1 pt-2 border-t border-gray-200 dark:border-gray-700 flex-nowrap">
                    {!survey.locked && (
                      <Link to={`/dashboard/surveys/${survey.id}/edit`}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          title="Edit survey - Modify questions, settings, and design"
                          className="text-xs px-2 py-1"
                        >
                          ✏️
                        </Button>
                      </Link>
                    )}
                    {survey.locked && (
                      <Link to={`/dashboard/surveys/${survey.id}/view`}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          title="View survey - Read-only mode (survey is locked)"
                          className="text-xs px-2 py-1"
                        >
                          🔍
                        </Button>
                      </Link>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handlePublishToggle(survey)}
                      disabled={publishing === survey.id}
                      title={survey.status === 'published' 
                        ? 'Unpublish survey - Close to new responses and make it draft' 
                        : 'Publish survey - Make available to respondents'
                      }
                      className="text-xs px-2 py-1"
                    >
                      {getPublishIcon(survey, publishing)}
                    </Button>
                    <Link to={`/dashboard/results/${survey.id}`}>
                      <Button 
                        variant="ghost"
                        size="sm" 
                        title="View results & analytics - See responses, charts, and insights"
                        className="text-xs px-2 py-1"
                      >
                        📊
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDuplicate(survey.id)}
                      disabled={duplicating === survey.id}
                      title="Duplicate survey - Create a copy with all questions and settings"
                      className="text-xs px-2 py-1"
                    >
                      {duplicating === survey.id ? '⏳' : '📄'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleExport(survey.id)}
                      disabled={exporting === survey.id}
                      title="Export survey - Download as JSON file for backup or sharing"
                      className="text-xs px-2 py-1"
                    >
                      {exporting === survey.id ? '⏳' : '📤'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(survey.id)}
                      disabled={deleting === survey.id}
                      title="Delete survey - Permanently remove survey and all responses"
                      className="text-xs px-2 py-1 text-red-600"
                    >
                      {deleting === survey.id ? '⏳' : '🗑️'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        const surveyUrl = globalThis.location.hostname.includes('ngrok') 
                          ? `https://${globalThis.location.hostname}/s/${survey.slug}`
                          : `${globalThis.location.origin}/s/${survey.slug}`;
                        navigator.clipboard.writeText(surveyUrl);
                      }}
                      title="Copy survey link - Copy the public URL to clipboard"
                      className="text-xs px-2 py-1"
                    >
                      📋
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedSurveyId(survey.id);
                        setRespondentsModalOpen(true);
                      }}
                      title="Manage allowed respondents - Add or view who can respond"
                      className="text-xs px-2 py-1 flex items-center"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      👥
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden sm:block">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} surveys
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px] sm:min-w-[350px]">
                      Title
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px] sm:min-w-[100px]">
                      Status
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                      Close Date
                    </th>
                    <th className="hidden md:table-cell px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                      Created
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[300px] sm:min-w-[450px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {surveys.map((survey) => (
                    <tr key={survey.id} className="transition-colors">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-900">
                            {survey.title}
                          </div>
                          {survey.description && (
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                              {survey.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(survey.status, survey.closeDate)}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white text-center">
                        {survey.closeDate && survey.status === 'draft' ? (
                          <span className="text-red-600 dark:text-red-400">
                            {formatDate(survey.closeDate)} (Closed)
                          </span>
                        ) : '-'}
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">
                        {formatDate(survey.createdAt)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center justify-center sm:justify-between w-full gap-1 flex-nowrap">
                          {!survey.locked && (
                            <Link to={`/dashboard/surveys/${survey.id}/edit`}>
                              <Button 
                                variant="outline" 
                                size="sm"
                                title="Edit survey - Modify questions, settings, and design"
                                className="text-xs"
                              >
                                ✏️
                              </Button>
                            </Link>
                          )}
                          {survey.locked && (
                            <Link to={`/dashboard/surveys/${survey.id}/view`}>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                title="View survey - Read-only mode (survey is locked)"
                                className="text-xs"
                              >
                                🔍
                              </Button>
                            </Link>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handlePublishToggle(survey)}
                            disabled={publishing === survey.id}
                            title={survey.status === 'published' 
                              ? 'Unpublish survey - Close to new responses and make it draft' 
                              : 'Publish survey - Make available to respondents'
                            }
                            className="text-xs"
                          >
                            {getPublishIcon(survey, publishing)}
                          </Button>
                          <Link to={`/dashboard/results/${survey.id}`}>
                            <Button 
                              variant="ghost"
                              size="sm" 
                              title="View results & analytics - See responses, charts, and insights"
                              className="text-xs"
                            >
                              📊
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDuplicate(survey.id)}
                            disabled={duplicating === survey.id}
                            title="Duplicate survey - Create a copy with all questions and settings"
                            className="text-xs"
                          >
                            {duplicating === survey.id ? '⏳' : '📄'}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleExport(survey.id)}
                            disabled={exporting === survey.id}
                            title="Export survey - Download as JSON file for backup or sharing"
                            className="text-xs"
                          >
                            {exporting === survey.id ? '⏳' : '📤'}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(survey.id)}
                            disabled={deleting === survey.id}
                            title="Delete survey - Permanently remove survey and all responses"
                            className="text-xs text-red-600"
                          >
                            {deleting === survey.id ? '⏳' : '🗑️'}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              const surveyUrl = globalThis.location.hostname.includes('ngrok') 
                                ? `https://${globalThis.location.hostname}/s/${survey.slug}`
                                : `${globalThis.location.origin}/s/${survey.slug}`;
                              navigator.clipboard.writeText(surveyUrl);
                            }}
                            title="Copy survey link - Copy the public URL to clipboard"
                            className="text-xs"
                          >
                            📋
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedSurveyId(survey.id);
                              setRespondentsModalOpen(true);
                            }}
                            title="Manage allowed respondents - Add or view who can respond"
                            className="text-xs flex items-center"
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            👥
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm"
            >
              ← Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => {
                const pageNum = i + 1;
                
                // Show all pages if 5 or fewer, otherwise show smart pagination
                if (pagination.totalPages <= 5) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-all duration-200 ${
                        pageNum === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:ring-1 hover:ring-gray-300 dark:bg-gray-700 dark:text-gray-700 dark:hover:ring-gray-500'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                
                // Smart pagination for more than 5 pages
                if (pageNum === 1 || pageNum === pagination.totalPages || 
                    (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-all duration-200 ${
                        pageNum === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:ring-1 hover:ring-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:ring-gray-500'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                
                // Show ellipsis for gaps
                if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                  return (
                    <span key={pageNum} className="px-2 sm:px-3 py-1 text-xs text-gray-500">
                      ...
                    </span>
                  );
                }
                
                return null;
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm"
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      <NewSurveyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateSurvey}
        loading={submitting}
      />

      {selectedSurveyId && (
        <RespondentsModal
          isOpen={respondentsModalOpen}
          onClose={() => {
            setRespondentsModalOpen(false);
            setSelectedSurveyId(null);
          }}
          surveyId={selectedSurveyId}
        />
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default Surveys;