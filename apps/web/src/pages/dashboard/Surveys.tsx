import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { listSurveysApi } from "../../api-paths/surveysApi";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import NewSurveyModal from "../../components/modals/NewSurveyModal";
import RespondentsModal from "../../components/modals/RespondentsModal";
import SurveyFilters from "../../components/survey/SurveyFilters";
import SurveyActionsDropdown from "../../components/survey/SurveyActionsDropdown";
import { useSurveyFilters } from "../../hooks/useSurveyFilters";
import { duplicateSurvey } from "../../utils/surveyImportExport";
import {
  handleCreateSurvey as handleCreateSurveyUtil,
  handleDeleteSurvey as handleDeleteSurveyUtil,
  handleExportSurvey as handleExportSurveyUtil,
  handleImportSurvey as handleImportSurveyUtil,
  type SurveySummary,
  type PaginationState,
} from "../../utils/surveyUtils";
import { loadConfig, getSurveyPaginationConfig } from "../../utils/config";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from "lucide-react";
import ImportSurveyModal from "../../components/modals/ImportSurveyModal";
import { showErrorToast, showSuccessToast } from "../../utils/toast";

type Survey = SurveySummary;

type PaginationInfo = PaginationState;

type SortableField = "title" | "status" | "closeDate" | "createdAt";

type FetchOptions = {
  isInitial?: boolean;
};

const Surveys: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [allSurveys, setAllSurveys] = useState<Survey[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
  } = useSurveyFilters(allSurveys);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openDropdown]);

  const buildQueryParams = useCallback(
    (pageValue: number, limitValue: number) => {
      const params = new URLSearchParams({
        page: pageValue.toString(),
        limit: limitValue.toString(),
      });

      if (filterBy === "status" && statusValue) {
        params.append("status", statusValue);
      }

      if (dateFrom && (filterBy === "createdAt" || filterBy === "closeDate")) {
        params.append("dateFrom", dateFrom);
        params.append("dateField", filterBy);
      }

      if (dateTo && (filterBy === "createdAt" || filterBy === "closeDate")) {
        params.append("dateTo", dateTo);
        params.append("dateField", filterBy);
      }

      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      return params;
    },
    [filterBy, statusValue, dateFrom, dateTo, sortBy, sortOrder]
  );

  const fetchSurveys = useCallback(
    async (page: number, limit: number, options: FetchOptions = {}) => {
      const { isInitial = false } = options;
      if (isInitial) {
        setInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }
      try {
        setError(null);

        const params = buildQueryParams(page, limit);
        const response = await listSurveysApi(params.toString());
        const currentSurveys = Array.isArray(response?.surveys)
          ? (response.surveys as Survey[])
          : [];

        setSurveys(currentSurveys);
        setPagination(response.pagination);

        const isFirstPage = page === 1;
        let aggregatedSurveys: Survey[] = currentSurveys;

        if (isFirstPage) {
          const { totalPages } = response.pagination;

          if (totalPages > 1) {
            try {
              const additionalResponses = await Promise.all(
                Array.from({ length: totalPages - 1 }, (_, index) => {
                  const nextPage = index + 2;
                  const nextParams = buildQueryParams(nextPage, limit);
                  return listSurveysApi(nextParams.toString());
                })
              );

              aggregatedSurveys = additionalResponses.reduce<Survey[]>(
                (accumulator, currentResponse) => {
                  if (Array.isArray(currentResponse?.surveys) && currentResponse.surveys.length) {
                    return accumulator.concat(currentResponse.surveys as Survey[]);
                  }
                  return accumulator;
                },
                [...aggregatedSurveys]
              );
            } catch (additionalError: any) {
              setError(
                additionalError instanceof Error
                  ? additionalError.message
                  : "Failed to load complete survey list"
              );
            }
          }

          const uniqueSurveys = Array.from(
            new Map(aggregatedSurveys.map((survey) => [survey.id, survey])).values()
          );
          setAllSurveys(uniqueSurveys);
        } else {
          setAllSurveys((previousSurveys) => {
            if (!previousSurveys.length) {
              return aggregatedSurveys;
            }

            const surveysById = new Map(
              previousSurveys.map((survey) => [survey.id, survey])
            );
            aggregatedSurveys.forEach((survey) => {
              surveysById.set(survey.id, survey);
            });

            return Array.from(surveysById.values());
          });
        }
      } catch (error: any) {
        setError("Failed to fetch surveys");
      } finally {
        if (isInitial) {
          setInitialLoading(false);
        }
        setIsRefreshing(false);
      }
    },
    [buildQueryParams]
  );

  useEffect(() => {
    loadConfig().then(() => {
      const config = getSurveyPaginationConfig();
      if (config) {
        setPagination((prev) => ({
          ...prev,
          limit: config.defaultLimit,
        }));
      }
      fetchSurveys(1, config?.defaultLimit || 5, { isInitial: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch when filters change
  useEffect(() => {
    fetchSurveys(1, pagination.limit);
  }, [filterBy, statusValue, dateFrom, dateTo, fetchSurveys, pagination.limit]);

  // Fetch when sort changes
  useEffect(() => {
    fetchSurveys(1, pagination.limit);
  }, [sortBy, sortOrder, fetchSurveys, pagination.limit]);

  const handlePageChange = (newPage: number) => {
    fetchSurveys(newPage, pagination.limit);
  };

  const handleCreateSurvey = (data: {
    title: string;
    description: string;
    closeDate: string;
  }) =>
    handleCreateSurveyUtil({
      formData: data,
      pagination,
      setSubmitting,
      setError,
      setSurveys,
      setAllSurveys,
      setIsModalOpen,
      setPagination,
      fetchSurveys,
    });

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
      showSuccessToast("Survey duplicated successfully.");
      fetchSurveys(1, pagination.limit);
    } catch (error) {
      showErrorToast("Failed to duplicate survey. Please try again.");
      setError(
        error instanceof Error ? error.message : "Failed to duplicate survey"
      );
    } finally {
      setDuplicating(null);
    }
  };

  const handleDelete = (survey: Survey) =>
    handleDeleteSurveyUtil({
      surveyId: survey.id,
      setDeleting,
      setError,
      surveys,
      pagination,
      fetchSurveys,
      setAllSurveys,
    });


  const handleExport = (surveyId: string) =>
    handleExportSurveyUtil({
      surveyId,
      setExporting,
      setError,
    });

  const handleImportClick = () => {
    setImportSuccess(false);
    setIsImportModalOpen(true);
  };

  const handleFileImport = async (file: File) => {
    if (!file) {
      return false;
    }

    setIsImporting(true);
    setImportSuccess(false);

    const wasSuccessful = await handleImportSurveyUtil({
      file,
      setError,
      setSurveys,
      setAllSurveys,
      setPagination,
      pagination,
      fetchSurveys,
    });

    setIsImporting(false);

    if (wasSuccessful) {
      setImportSuccess(true);
    }
    return wasSuccessful;
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setIsImporting(false);
    setImportSuccess(false);
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">
          Loading surveys...
        </div>
      </div>
    );
  }
  const isSearching = searchQuery.trim().length > 0;
  const displaySurveys = isSearching
    ? filteredSurveys
    : surveys.filter((survey) => survey && survey.title);
  const totalMatchingCount = isSearching
    ? filteredSurveys.length
    : pagination.total || displaySurveys.length;
  const sortableColumns: Array<{ field: SortableField; label: string }> = [
    { field: "title", label: "Title" },
    { field: "status", label: "Status" },
    { field: "closeDate", label: "Close Date" },
    { field: "createdAt", label: "Created" },
  ];

  const handleSortChange = (field: SortableField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      return;
    }

    setSortBy(field);
    setSortOrder(field === "title" ? "asc" : "desc");
  };

  const handleSortKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    field: SortableField
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSortChange(field);
    }
  };

  const getSortIcon = (field: SortableField) => {
    const baseClasses = "h-3.5 w-3.5";

    if (sortBy === field && isRefreshing) {
      return (
        <Loader2
          className={`${baseClasses} animate-spin text-blue-600`}
          aria-hidden="true"
        />
      );
    }

    if (sortBy !== field) {
      return (
        <ArrowUpDown
          className={`${baseClasses} text-gray-400`}
          aria-hidden="true"
        />
      );
    }

    if (sortOrder === "asc") {
      return (
        <ArrowUp
          className={`${baseClasses} text-blue-600`}
          aria-hidden="true"
        />
      );
    }

    return (
      <ArrowDown
        className={`${baseClasses} text-blue-600`}
        aria-hidden="true"
      />
    );
  };
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
      <div className="relative">
        <SurveyFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterBy={filterBy}
          setFilterBy={setFilterBy}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          onClearFilters={clearFilters}
          statusValue={statusValue} 
          setStatusValue={setStatusValue}
        />
      </div>

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
              {isSearching ? (
                <>
                  Showing {displaySurveys.length} result
                  {displaySurveys.length !== 1 ? "s" : ""} matching "
                  {searchQuery.trim()}"
                </>
              ) : (
                <>
                  Showing {displaySurveys.length} of {totalMatchingCount} survey
                  {totalMatchingCount !== 1 ? "s" : ""}
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {sortableColumns.map(({ field, label }) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => handleSortChange(field)}
                  onKeyDown={(event) => handleSortKeyDown(event, field)}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    sortBy === field
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700"
                  }`}
                  aria-label={`Sort by ${label} ${sortBy === field ? (sortOrder === "asc" ? "ascending" : "descending") : ""}`}
                  aria-busy={isRefreshing && sortBy === field}
                  tabIndex={0}
                >
                  <span>{label}</span>
                  <span className="flex items-center">{getSortIcon(field)}</span>
                </button>
              ))}
            </div>
            {displaySurveys.filter(survey => survey && survey.title).map((survey) => (
              <Card key={survey.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {survey.title}
                      </h3>
                      {survey.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {survey.description}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
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
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{getStatusBadge(survey.status, survey.closeDate)}</span>
                    <span>{formatDate(survey.createdAt)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden sm:block">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isSearching ? (
                  <>
                    Showing {displaySurveys.length} result
                    {displaySurveys.length !== 1 ? "s" : ""} matching "
                    {searchQuery.trim()}"
                  </>
                ) : (
                  <>
                    Showing {displaySurveys.length} of {totalMatchingCount} survey
                    {totalMatchingCount !== 1 ? "s" : ""}
                  </>
                )}
              </div>
            </div>
            <div>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[260px] max-w-[260px] sm:min-w-[320px] sm:max-w-[320px]">
                      <button
                        type="button"
                        onClick={() => handleSortChange("title")}
                        onKeyDown={(event) => handleSortKeyDown(event, "title")}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Sort by Title ${sortBy === "title" ? (sortOrder === "asc" ? "ascending" : "descending") : ""}`}
                    aria-busy={isRefreshing && sortBy === "title"}
                        tabIndex={0}
                      >
                        <span>Title</span>
                        <span className="flex items-center">{getSortIcon("title")}</span>
                      </button>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px] sm:min-w-[100px]">
                      <button
                        type="button"
                        onClick={() => handleSortChange("status")}
                        onKeyDown={(event) => handleSortKeyDown(event, "status")}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Sort by Status ${sortBy === "status" ? (sortOrder === "asc" ? "ascending" : "descending") : ""}`}
                    aria-busy={isRefreshing && sortBy === "status"}
                        tabIndex={0}
                      >
                        <span>Status</span>
                        <span className="flex items-center">{getSortIcon("status")}</span>
                      </button>
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                      <button
                        type="button"
                        onClick={() => handleSortChange("closeDate")}
                        onKeyDown={(event) => handleSortKeyDown(event, "closeDate")}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Sort by Close Date ${sortBy === "closeDate" ? (sortOrder === "asc" ? "ascending" : "descending") : ""}`}
                    aria-busy={isRefreshing && sortBy === "closeDate"}
                        tabIndex={0}
                      >
                        <span>Close Date</span>
                        <span className="flex items-center">{getSortIcon("closeDate")}</span>
                      </button>
                    </th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                      <button
                        type="button"
                        onClick={() => handleSortChange("createdAt")}
                        onKeyDown={(event) => handleSortKeyDown(event, "createdAt")}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Sort by Created ${sortBy === "createdAt" ? (sortOrder === "asc" ? "ascending" : "descending") : ""}`}
                    aria-busy={isRefreshing && sortBy === "createdAt"}
                        tabIndex={0}
                      >
                        <span>Created</span>
                        <span className="flex items-center">{getSortIcon("createdAt")}</span>
                      </button>
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
                        <div className="max-w-[260px] sm:max-w-[320px]">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {survey.title}
                          </div>
                          {survey.description && (
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-white truncate">
                              {survey.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        {getStatusBadge(survey.status, survey.closeDate)}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 text-sm text-gray-500 dark:text-white">
                        {(() => {
                          const closeDateValue = survey.closeDate ?? survey.endDate;
                          if (!closeDateValue) {
                            return "-";
                          }

                          const isClosed = survey.status === "closed";
                          return (
                            <span
                              className={
                                isClosed
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-gray-600 dark:text-gray-200"
                              }
                            >
                              {formatDate(closeDateValue)}
                            </span>
                          );
                        })()}
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
      {!isSearching && pagination.totalPages > 1 && (
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

      <ImportSurveyModal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        onFileSelected={handleFileImport}
        isUploading={isImporting}
        isSuccess={importSuccess}
      />
    </div>
  );
};

export default Surveys;
