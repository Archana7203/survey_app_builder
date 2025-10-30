import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { listSurveysApi } from "../../api-paths/surveysApi";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import SurveyActionsDropdown from "../../components/survey/SurveyActionsDropdown";
import {
  exportSurveyToFile,
  duplicateSurvey,
} from "../../utils/surveyImportExport";

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

const ArchivedSurveys: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchArchivedSurveys();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openDropdown]);

  const fetchArchivedSurveys = async () => {
    try {
      setLoading(true);
      // Query with status=archived parameter to get archived surveys from backend
      const params = new URLSearchParams({
        page: "1",
        limit: "100",
        status: "archived"
      });
      const data = await listSurveysApi(params.toString());
      setSurveys(data.surveys || []);
    } catch (error: any) {
      setError(error.message || "Error loading archived surveys");
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (surveyId: string) => {
    setDuplicating(surveyId);
    setError(null);
    try {
      await duplicateSurvey(surveyId);
      fetchArchivedSurveys();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to duplicate survey"
      );
    } finally {
      setDuplicating(null);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = () => {
    const colors = {
      archived:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${colors.archived}`}
      >
        Archived
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">
          Loading archived surveys...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Same as Surveys.tsx */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Archived Surveys
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-white">
            View and manage your archived surveys
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Link to="/dashboard/surveys">
            <Button variant="outline" className="text-sm">
              ← Back to Surveys
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Survey List - Same structure as Surveys.tsx */}
      {surveys.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">No archived surveys</p>
            <p className="text-sm">
              Surveys you archive will appear here
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Showing {surveys.length} survey
              {surveys.length !== 1 ? "s" : ""}
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
                    <span>{getStatusBadge()}</span>
                    <span>{formatDate(survey.createdAt)}</span>
                  </div>

                  <div className="flex items-center justify-center gap-1 pt-2 border-t border-gray-200 dark:border-gray-700 flex-nowrap">
                    <Link to={`/dashboard/surveys/${survey.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="View survey"
                        className="text-xs px-2 py-1"
                      >
                        🔍
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
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table View - Same as Surveys.tsx */}
          <Card className="hidden sm:block">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {surveys.length} survey
                {surveys.length !== 1 ? "s" : ""}
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
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                      Created
                    </th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {surveys.map((survey) => (
                    <tr key={survey.id} className="transition-colors">
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
                        {getStatusBadge()}
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-500 dark:text-white">
                        {formatDate(survey.createdAt)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm font-medium">
                        <div className="relative flex justify-end">
                          <button
                            onClick={(e) => {
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
                            deleting={null}
                            onDuplicate={handleDuplicate}
                            onExport={handleExport}
                            onDelete={() => {}}
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
    </div>
  );
};

export default ArchivedSurveys;
