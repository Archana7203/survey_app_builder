import React from "react";
import { Link } from "react-router-dom";

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

interface SurveyActionsDropdownProps {
  survey: Survey;
  isOpen: boolean;
  onClose: () => void;
  duplicating: string | null;
  exporting: string | null;
  deleting: string | null;
  onDuplicate: (surveyId: string) => void;
  onExport: (surveyId: string) => void;
  onDelete: (surveyId: string) => void;
}

const SurveyActionsDropdown: React.FC<SurveyActionsDropdownProps> = ({
  survey,
  isOpen,
  onClose,
  duplicating,
  exporting,
  deleting,
  onDuplicate,
  onExport,
  onDelete,
}) => {
  if (!isOpen) return null;

  // Common actions for most modes
  const renderCommonActions = () => (
    <>
      <Link
        to={`/dashboard/surveys/${survey.id}/edit`}
        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={onClose}
      >
        {survey.status === "draft" ? "✏️ Edit" : "🔍 View"}
      </Link>
      <button
        onClick={() => {
          onExport(survey.id);
          onClose();
        }}
        disabled={exporting === survey.id}
        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
      >
        {exporting === survey.id ? "⏳" : "📤"} Export
      </button>
      <button
        onClick={() => {
          onDuplicate(survey.id);
          onClose();
        }}
        disabled={duplicating === survey.id}
        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
      >
        {duplicating === survey.id ? "⏳" : "📄"} Duplicate
      </button>
    </>
  );

  // Draft mode adds Delete
  if (survey.status === "draft") {
    return (
      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
        {renderCommonActions()}
        <button
          onClick={() => {
            onDelete(survey.id);
            onClose();
          }}
          disabled={deleting === survey.id}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
        >
          {deleting === survey.id ? "⏳" : "🗑️"} Delete
        </button>
      </div>
    );
  }

  // Live mode adds Copy Link
  if (survey.status === "live") {
    return (
      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
        {renderCommonActions()}
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/s/${survey.slug}`);
            onClose();
          }}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          📋 Copy Link
        </button>
      </div>
    );
  }

  // Published, Closed, Archived: just common actions
  if (
    survey.status === "published" ||
    survey.status === "closed" ||
    survey.status === "archived"
  ) {
    return (
      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
        {renderCommonActions()}
      </div>
    );
  }

  return null;
};

export default SurveyActionsDropdown;
