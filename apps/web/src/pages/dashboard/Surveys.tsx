import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  listSurveysApi,
  createSurveyApi,
  deleteSurveyApi,
} from "../../api-paths/surveysApi";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import NewSurveyModal from "../../components/modals/NewSurveyModal";
import RespondentsModal from "../../components/modals/RespondentsModal";
import SurveyFilters from "../../components/survey/SurveyFilters";
import SurveyActionsDropdown from "../../components/survey/SurveyActionsDropdown";
import { useSurveyFilters } from "../../hooks/useSurveyFilters";
import {
  exportSurveyToFile,
  importSurveyFromFile,
  uploadImportedSurvey,
  duplicateSurvey,
} from "../../utils/surveyImportExport";
import { loadConfig, getSurveyPaginationConfig } from "../../utils/config";

interface Survey {
  id: string;
  title: string;
  description?: string;
  slug: string;
  status: "draft" | "published" | "closed" | "live" | "archived";
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error) {
      alert(error);
      setError(null);
    }
  }, [error]);

  // Use custom hook for filters
  const {
    filteredSurveys,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filterBy,
    setFilterBy,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    clearFilters,
    statusValue,
    setStatusValue,
  } = useSurveyFilters(surveys);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openDropdown]);

  useEffect(() => {
    loadConfig().then(() => {
      const config = getSurveyPaginationConfig();
      if (config) {
        setPagination((prev) => ({
          ...prev,
          limit: config.defaultLimit,
        }));
      }
      fetchSurveys(1, config?.defaultLimit || 5);
    });
  }, []);

  // Fetch when filters change (except search - handled by manual trigger)
  useEffect(() => {
    fetchSurveys(1, pagination.limit);
  }, [filterBy, statusValue, dateFrom, dateTo]); 

  const fetchSurveys = async (page: number, limit: number) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add status filter
      if (filterBy === "status" && statusValue) {
        params.append("status", statusValue);
      }

      // Add search filter
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      // Add date filters
      if (dateFrom && (filterBy === "createdAt" || filterBy === "closeDate")) {
        params.append("dateFrom", dateFrom);
        params.append("dateField", filterBy);
      }

      if (dateTo && (filterBy === "createdAt" || filterBy === "closeDate")) {
        params.append("dateTo", dateTo);
        params.append("dateField", filterBy);
      }

      const response = await listSurveysApi(params.toString());

      setSurveys(response.surveys);
      setPagination(response.pagination);
    } catch (error: any) {
      setError("Failed to fetch surveys");
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
    setError(null);

    try {
      const newSurvey = await createSurveyApi(data);

      setSurveys((prev) => [newSurvey, ...prev]);
      setIsModalOpen(false);

      setPagination((prev) => ({
        ...prev,
        total: prev.total + 1,
        totalPages: Math.ceil((prev.total + 1) / prev.limit),
      }));

      fetchSurveys(1, pagination.limit);
    } catch (err: any) {
      setError(`Error creating survey: ${err.message || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string, closeDate?: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      published:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      closed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      live: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      archived:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };

    const displayStatus = status === "draft" && closeDate ? "Closed" : status;
    const displayColors =
      status === "draft" && closeDate
        ? colors.closed
        : colors[status as keyof typeof colors];

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${displayColors}`}
      >
        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDuplicate = async (surveyId: string) => {
    setDuplicating(surveyId);
    setError(null);
    try {
      await duplicateSurvey(surveyId);
      fetchSurveys(1, pagination.limit);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to duplicate survey"
      );
    } finally {
      setDuplicating(null);
    }
  };

  const handleDelete = async (surveyId: string) => {
    setDeleting(surveyId);
    setError(null);
    try {
      await deleteSurveyApi(surveyId);
      // Calculate if current page will be empty after deletion
      const remainingOnCurrentPage = surveys.length - 1;      
      // If current page will be empty and it's not page 1, go to previous page
      if (remainingOnCurrentPage === 0 && pagination.page > 1) {
        fetchSurveys(pagination.page - 1, pagination.limit);
      } else {
        // Stay on current page and refetch to get next item
        fetchSurveys(pagination.page, pagination.limit);
      }
    } catch (error: any) {
      setError(error.message || "Failed to delete survey");
    } finally {
      setDeleting(null);
    }
  };


  const handleExport = async (surveyId: string) => {
    setExporting(surveyId);
    setError(null);
    try {
      await exportSurveyToFile(surveyId);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to export survey"
      );
    } finally {
      setExporting(null);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      const surveyData = await importSurveyFromFile(file);
      const newSurvey = await uploadImportedSurvey(surveyData);
      setSurveys((prev) => [newSurvey as any, ...prev]);

      setPagination((prev) => ({
        ...prev,
        total: prev.total + 1,
        totalPages: Math.ceil((prev.total + 1) / prev.limit),
      }));

      fetchSurveys(1, pagination.limit);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to import survey"
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">
          Loading surveys...
        </div>
      </div>
    );
  }
  const displaySurveys = filteredSurveys;
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Surveys
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-white">
            Create and manage your surveys
          </p>
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
          <Link to="/dashboard/surveys/archives">
            <Button
              variant="outline"
              title="View archived surveys"
              className="text-sm"
            >
              🗄️ Archives
            </Button>
          </Link>
          <Link to="/dashboard/surveys/new">
            <Button
              variant="primary"
              title="Create a new survey from scratch"
              className="text-sm"
            >
              + Create Survey
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filter Section */}
      <SurveyFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        filterBy={filterBy}
        setFilterBy={setFilterBy}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        onClearFilters={clearFilters}
        statusValue={statusValue} 
        setStatusValue={setStatusValue}
        onSearchTrigger={() => fetchSurveys(1, pagination.limit)}
      />

      {/* Survey List */}
      {displaySurveys.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            {searchQuery || filterBy !== "all" ? (
              <>
                <p className="text-lg mb-2">No surveys match your filters</p>
                <p className="text-sm">Try adjusting your search or filters</p>
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear All Filters
                </Button>
              </>
            ) : (
              <>
                <p className="text-lg mb-2">No surveys yet</p>
                <p className="text-sm">Create your first survey to get started</p>
              </>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Showing {displaySurveys.length} survey
              {displaySurveys.length !== 1 ? "s" : ""}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
            {displaySurveys.filter(survey => survey && survey.title).map((survey) => (
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
                          title="Edit survey"
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
                          title="View survey"
                          className="text-xs px-2 py-1"
                        >
                          🔍
                        </Button>
                      </Link>
                    )}
                    <Link to={`/dashboard/results/${survey.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="View results"
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
                      title="Duplicate survey"
                      className="text-xs px-2 py-1"
                    >
                      {duplicating === survey.id ? "⏳" : "📄"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport(survey.id)}
                      disabled={exporting === survey.id}
                      title="Export survey"
                      className="text-xs px-2 py-1"
                    >
                      {exporting === survey.id ? "⏳" : "📤"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(survey.id)}
                      disabled={deleting === survey.id}
                      title="Delete survey"
                      className="text-xs px-2 py-1 text-red-600"
                    >
                      {deleting === survey.id ? "⏳" : "🗑️"}
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
                Showing {displaySurveys.length} survey
                {displaySurveys.length !== 1 ? "s" : ""}
                {searchQuery && ` matching "${searchQuery}"`}
              </div>
            </div>
            <div>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px] sm:min-w-[350px]">
                      Title
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px] sm:min-w-[100px]">
                      Status
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                      Close Date
                    </th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                      Created
                    </th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {displaySurveys.filter(survey => survey && survey.title).map((survey) => (
                    <tr 
                      key={survey.id} 
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => {
                        if (!survey.locked) {
                          window.location.href = `/dashboard/surveys/${survey.id}/edit`;
                        } else {
                          window.location.href = `/dashboard/surveys/${survey.id}/view`;
                        }
                      }}
                    >
                      <td className="px-3 sm:px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {survey.title}
                          </div>
                          {survey.description && (
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                              {survey.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        {getStatusBadge(survey.status, survey.closeDate)}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 text-sm text-gray-500 dark:text-white">
                        {survey.closeDate && survey.status === "draft" ? (
                          <span className="text-red-600 dark:text-red-400">
                            {formatDate(survey.closeDate)} (Closed)
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-500 dark:text-white">
                        {formatDate(survey.createdAt)}
                      </td>
                      <td 
                        className="px-3 sm:px-6 py-4 text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setOpenDropdown(
                                openDropdown === survey.id ? null : survey.id
                              );
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Survey actions"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <circle cx="3" cy="10" r="2" />
                              <circle cx="10" cy="10" r="2" />
                              <circle cx="17" cy="10" r="2" />
                            </svg>
                          </button>

                          <SurveyActionsDropdown
                            survey={survey}
                            isOpen={openDropdown === survey.id}
                            onClose={() => setOpenDropdown(null)}
                            duplicating={duplicating}
                            exporting={exporting}
                            deleting={deleting}
                            onDuplicate={handleDuplicate}
                            onExport={handleExport}
                            onDelete={handleDelete}
                          />
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

                if (pagination.totalPages <= 5) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-all duration-200 ${
                        pageNum === pagination.page
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:ring-1 hover:ring-gray-300 dark:bg-gray-700 dark:text-gray-700 dark:hover:ring-gray-500"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }

                if (
                  pageNum === 1 ||
                  pageNum === pagination.totalPages ||
                  (pageNum >= pagination.page - 1 &&
                    pageNum <= pagination.page + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-all duration-200 ${
                        pageNum === pagination.page
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:ring-1 hover:ring-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:ring-gray-500"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }

                if (
                  pageNum === pagination.page - 2 ||
                  pageNum === pagination.page + 2
                ) {
                  return (
                    <span
                      key={pageNum}
                      className="px-2 sm:px-3 py-1 text-xs text-gray-500"
                    >
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

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        style={{ display: "none" }}
      />
    </div>
  );
};

export default Surveys;
