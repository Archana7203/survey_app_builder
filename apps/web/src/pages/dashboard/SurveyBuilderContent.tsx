import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import ReorderableQuestions from "../../components/survey/ReorderableQuestions";
import VisibilityRulesModal from "../../components/modals/VisibilityRulesModal";
import AddQuestionModal from "../../components/modals/AddQuestionModal";
import ComponentLibraryPanel from "../../components/survey/ComponentLibraryPanel";
import { useSurveyTheme } from "../../contexts/SurveyThemeContext";
import PreviewArea from "../../components/survey/PreviewArea";
import QuestionSettingsPanel from "../../components/survey/QuestionSettingsPanel";
import PageNavigation from "../../components/survey/PageNavigation";
import SurveyDetailsCard from "../../components/survey/SurveyDetailsCard";
import ConfirmationModal from "../../components/modals/ConfirmationModal";
import PublishedModeView from "../../components/survey/PublishedModeView";
import RespondentProgress from "../../components/dashboard/RespondentProgress";
import type { Question } from "./SurveyBuilder";
import RespondentsModal from "../../components/modals/RespondentsModal";
import { sendSurveyInvitations } from "../../api-paths/surveysApi";
import {
  validateSurveyForPublish,
  prepareStatusUpdatePayload,
  getStatusSuccessMessage,
  validateSurveyForGoingLive,
} from "../../utils/surveyUtils";

const QUESTION_TYPES = [
  {
    type: "single_choice",
    name: "Single choice",
    description: "Single choice question",
    icon: "◯",
    category: "choice",
  },
  {
    type: "multi_choice",
    name: "Checkboxes",
    description: "Multiple choice question",
    icon: "☑",
    category: "choice",
  },
  {
    type: "dropdown",
    name: "Dropdown",
    description: "Dropdown selection",
    icon: "📋",
    category: "choice",
  },
  {
    type: "text_short",
    name: "Short text",
    description: "Short text input",
    icon: "✏️",
    category: "input",
  },
  {
    type: "text_long",
    name: "Long text",
    description: "Long text input",
    icon: "📝",
    category: "input",
  },
  {
    type: "rating_star",
    name: "Star rating",
    description: "Star rating question",
    icon: "⭐",
    category: "rating",
  },
  {
    type: "rating_smiley",
    name: "Smiley rating",
    description: "Smiley face rating",
    icon: "😊",
    category: "rating",
  },
  {
    type: "rating_number",
    name: "Number rating",
    description: "Number rating question",
    icon: "🔢",
    category: "rating",
  },
  {
    type: "slider",
    name: "Slider",
    description: "Slider question",
    icon: "🎯",
    category: "rating",
  },
] as const;

interface SurveyBuilderContentProps {
  survey: any;
  setSurvey: any;
  activeTab: string;
  setActiveTab: any;
  activePageIndex: number;
  setActivePageIndex: any;
  selectedQuestion: any;
  setSelectedQuestion: any;
  previewResponses: any;
  setPreviewResponses: any;
  error: string | null;
  setError: any;
  loading: boolean;
  saving: boolean;
  navigate: any;
  saveSurvey: any;
  addPage: any;
  deletePage: any;
  deleteQuestion: any;
  handleDragStart: any;
  handleDragEnd: any;
  activeDragId: string | null;
  sensors: any;
  closestCenter: any;
  currentPage: any;
  handleEditVisibility: any;
  isVisibilityModalOpen: boolean;
  setIsVisibilityModalOpen: any;
  isAddQuestionModalOpen: boolean;
  setIsAddQuestionModalOpen: any;
  editingQuestion: any;
  setEditingQuestion: any;
  addQuestion: any;
  updateQuestion: any;
  surveyId: string | undefined;
  openPreviewInNewTab: () => void;
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (isOpen: boolean) => void;
  handleDeleteSurvey: () => Promise<void>;
  copyLink: () => void;
}

export default function SurveyBuilderContent({
  survey,
  setSurvey,
  activeTab,
  setActiveTab,
  activePageIndex,
  setActivePageIndex,
  selectedQuestion,
  setSelectedQuestion,
  previewResponses,
  setPreviewResponses,
  error,
  setError,
  loading,
  saving,
  saveSurvey,
  addPage,
  deletePage,
  deleteQuestion,
  handleDragStart,
  handleDragEnd,
  activeDragId,
  sensors,
  closestCenter,
  currentPage,
  handleEditVisibility,
  isVisibilityModalOpen,
  setIsVisibilityModalOpen,
  isAddQuestionModalOpen,
  setIsAddQuestionModalOpen,
  editingQuestion,
  setEditingQuestion,
  addQuestion,
  updateQuestion,
  openPreviewInNewTab,
  handleDeleteSurvey,
  copyLink,
  surveyId,
}: Readonly<SurveyBuilderContentProps>) {
  const { setSurveyTheme } = useSurveyTheme();
  const navigate = useNavigate();
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [respondentsModalOpen, setRespondentsModalOpen] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const isToday = (date: Date): boolean => {
    const today = new Date();
    const compareDate = new Date(date);
    return (
      today.getFullYear() === compareDate.getFullYear() &&
      today.getMonth() === compareDate.getMonth() &&
      today.getDate() === compareDate.getDate()
    );
  };

  const formatToLocalDatetime = (dateStr: string | undefined) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleStatusChangeLocal = async (newStatus: string): Promise<void> => {
    if (!surveyId) {
      setError("Survey ID is missing");
      return;
    }

    setStatusChanging(true);
    setError(null);
    setValidationError(null);

    try {
      const freshResponse = await fetch(`/api/surveys/${surveyId}`, {
        credentials: "include",
      });

      if (!freshResponse.ok) {
        throw new Error("Failed to fetch survey data");
      }

      const freshSurvey = await freshResponse.json();
      setSurvey(freshSurvey);
      console.log("Fetched fresh survey data:", freshSurvey);

      if (newStatus === "published") {
        const validation = validateSurveyForPublish(freshSurvey);
        if (!validation.valid) {
          setValidationError(validation.error || "Validation error");
          setIsConfirmModalOpen(false);
          setStatusChanging(false);
          return;
        }
      }

      if (newStatus === "live") {
        const validation = validateSurveyForGoingLive(freshSurvey);
        if (!validation.valid) {
          setValidationError(validation.error || "Cannot go live");
          setIsConfirmModalOpen(false);
          setStatusChanging(false);
          return;
        }
      }

      const updatePayload = prepareStatusUpdatePayload(
        newStatus,
        freshSurvey.status
      );

      console.log(
        "Updating survey:",
        surveyId,
        "currentStatus:",
        freshSurvey.status,
        "newStatus:",
        newStatus,
        "payload:",
        updatePayload
      );

      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatePayload),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        let errorData: any;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`Server error ${response.status}: ${errorText}`);
        }
        throw new Error(
          errorData.error || `Failed to update survey (${response.status})`
        );
      }

      const result = await response.json();
      console.log("Survey updated:", result);
      setSurvey(result.survey);
      if (
        newStatus === "live" &&
        result.survey.allowedRespondents?.length > 0
      ) {
        try {
          const inviteResult = await sendSurveyInvitations(surveyId);
          console.log("✅ Invitations sent:", inviteResult.message);
        } catch (inviteErr) {
          console.error("❌ Error in main:", inviteErr);
        }
      }

      const successMessage = getStatusSuccessMessage(result.survey.status);
      if (successMessage) {
        console.log(successMessage);
      }
    } catch (err: any) {
      console.error("Status change error:", err);
      setError(err.message || "Failed to update survey");
    } finally {
      setStatusChanging(false);
      setIsConfirmModalOpen(false);
    }
  };

  useEffect(() => {
    if (survey?.theme) {
      setSurveyTheme(survey.theme);
    }
  }, [survey?.theme, setSurveyTheme]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">
          Loading survey...
        </div>
      </div>
    );
  }

  if (!survey?.pages || !Array.isArray(survey.pages)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">
          Failed to load survey or survey data is invalid
        </div>
      </div>
    );
  }

  const page = currentPage || { questions: [], branching: [] };

  const surveyStatus = survey.status || "draft";

  const openConfirmation = (action: string) => {
    setConfirmAction(action);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      switch (confirmAction) {
        case "delete":
          await handleDeleteSurvey();
          break;
        case "publish":
          await handleStatusChangeLocal("published");
          break;
        case "live":
          await handleStatusChangeLocal("live");
          break;
        case "close":
          await handleStatusChangeLocal("closed");
          break;
        case "archive":
          await handleStatusChangeLocal("archived");
          break;
        default:
          break;
      }
    } catch (err) {
      console.error("Confirm action error:", err);
      setError(
        `Error performing action: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsConfirmModalOpen(false);
      setConfirmAction(null);
    }
  };

  const modalProps = (() => {
    switch (confirmAction) {
      case "delete":
        return {
          title: "Delete Survey",
          message:
            "Are you sure you want to delete this survey? This action cannot be undone.",
          actionText: "Delete",
        };
      case "publish":
        return {
          title: "Publish Survey",
          message:
            "Once published, your survey will move to Published state. Proceed?",
          actionText: "Publish",
        };
      case "live":
        return {
          title: "Go Live",
          message:
            "Going live will make the survey accessible to respondents. Continue?",
          actionText: "Go Live",
        };
      case "close":
        return {
          title: "Close Survey",
          message: "Closing the survey will prevent new responses. Continue?",
          actionText: "Close",
        };
      case "archive":
        return {
          title: "Archive Survey",
          message:
            "Archiving will remove this survey from the active list but keep it for record. Continue?",
          actionText: "Archive",
        };
      default:
        return { title: "", message: "", actionText: "Confirm" };
    }
  })();

  const renderHeader = () => {
    const showDates = surveyStatus === "draft" || surveyStatus === "published";

    return (
      <div className="flex flex-col space-y-2 flex-1">
        {/* Title & Description */}
        {surveyStatus === "draft" ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Survey Builder
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Build and customize your survey
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {survey.title || "Untitled Survey"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {survey.description || "No description provided"}
            </p>
          </>
        )}

        {/* Dates row (only for draft/published) */}
        {showDates && (
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-1 text-sm text-gray-700 dark:text-gray-300">
              Start <span className="text-red-500">*</span>
              <input
                type="datetime-local"
                value={formatToLocalDatetime(survey.startDate)}
                onChange={async (e) => {
                  const isoDate = new Date(e.target.value).toISOString();
                  setSurvey({ ...survey, startDate: isoDate });
                  try {
                    const res = await fetch(`/api/surveys/${surveyId}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ startDate: isoDate }),
                    });
                    console.log(res);
                  } catch (err) {
                    console.error("Failed to save start date", err);
                  }
                }}
                className="w-48 px-2 py-1 border rounded-md dark:bg-gray-700 dark:text-white"
                required
              />
            </label>

            <label className="flex items-center space-x-1 text-sm text-gray-700 dark:text-gray-300">
              End <span className="text-red-500">*</span>
              <input
                type="datetime-local"
                value={formatToLocalDatetime(survey.endDate)}
                onChange={async (e) => {
                  const isoDate = new Date(e.target.value).toISOString();
                  setSurvey({ ...survey, endDate: isoDate });
                  try {
                    const res = await fetch(`/api/surveys/${surveyId}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ endDate: isoDate }),
                    });
                    console.log(res);
                  } catch (err) {
                    console.error("Failed to save end date", err);
                  }
                }}
                className="w-48 px-2 py-1 border rounded-md dark:bg-gray-700 dark:text-white"
                required
              />
            </label>
          </div>
        )}
      </div>
    );
  };

  const renderActionButtons = () => {
    let Buttons: React.ReactNode;

    switch (surveyStatus) {
      case "draft":
        Buttons = (
          <>
            <Button
              variant="primary"
              onClick={() => openConfirmation("publish")}
              disabled={statusChanging || !survey.startDate || !survey.endDate}
              title={
                !survey.startDate || !survey.endDate
                  ? "Please set start and end dates first"
                  : ""
              }
            >
              {statusChanging ? "Publishing..." : "Publish"}
            </Button>
            <Button variant="secondary" onClick={openPreviewInNewTab}>
              Preview
            </Button>
            <Button variant="outline" onClick={saveSurvey} disabled={saving}>
              {saving ? "Saving..." : "Save Survey"}
            </Button>
            <Button variant="danger" onClick={() => openConfirmation("delete")}>
              Delete
            </Button>
          </>
        );
        break;

      case "published":
        Buttons = (
          <>
            <Button
              variant="primary"
              onClick={() => openConfirmation("live")}
              disabled={statusChanging}
            >
              {statusChanging ? "Processing..." : "Go Live"}
            </Button>
            <Button variant="secondary" onClick={openPreviewInNewTab}>
              Preview
            </Button>
            <Button
              variant="secondary"
              onClick={() => setRespondentsModalOpen(true)}
            >
              Add Respondents
            </Button>
          </>
        );
        break;

      case "live":
        Buttons = (
          <>
            <Button
              variant="danger"
              onClick={() => openConfirmation("close")}
              disabled={statusChanging}
            >
              {statusChanging ? "Closing..." : "Close Survey"}
            </Button>
            <Button variant="secondary" onClick={openPreviewInNewTab}>
              Preview
            </Button>
            <Button
              variant="secondary"
              onClick={() => setRespondentsModalOpen(true)}
            >
              Add Respondents
            </Button>
            <Button variant="secondary" onClick={copyLink}>
              Copy Link
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/dashboard/results/${surveyId}`)}
            >
              Analytics
            </Button>
          </>
        );
        break;

      case "closed":
        Buttons = (
          <>
            <Button
              variant="primary"
              onClick={() => openConfirmation("archive")}
              disabled={statusChanging}
            >
              {statusChanging ? "Archiving..." : "Archive"}
            </Button>
            <Button variant="secondary" onClick={openPreviewInNewTab}>
              Preview
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/dashboard/results/${surveyId}`)}
            >
              Analytics
            </Button>
          </>
        );
        break;

      case "archived":
      default:
        Buttons = null;
    }

    return (
      <div className="flex justify-end items-start space-x-3 overflow-x-auto">
        {Buttons}
      </div>
    );
  };

  const renderMainContent = () => {
    switch (surveyStatus) {
      case "draft":
        return (
          <>
            <SurveyDetailsCard
              survey={survey}
              setSurvey={setSurvey}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />

            <PageNavigation
              pages={survey.pages}
              activePageIndex={activePageIndex}
              onPageChange={setActivePageIndex}
              onAddPage={addPage}
              onDeletePage={deletePage}
            />

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              onDragStart={handleDragStart}
            >
              <div className="grid grid-cols-12 gap-6 h-[600px]">
                <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                  <div className="p-4">
                    <ComponentLibraryPanel
                      questionTypes={[...QUESTION_TYPES]}
                    />
                  </div>
                </div>

                <div className="col-span-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-y-auto">
                  <div className="p-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Question Order
                    </h2>
                    {!page.questions || page.questions.length === 0 ? (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        Drag and drop questions here to add them to your survey
                      </div>
                    ) : (
                      <ReorderableQuestions
                        questions={page.questions}
                        onDeleteQuestion={deleteQuestion}
                        onSelectQuestion={setSelectedQuestion}
                      />
                    )}
                  </div>
                </div>

                <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                  <div className="p-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Question Settings
                    </h2>
                    <QuestionSettingsPanel
                      selectedQuestion={selectedQuestion}
                      survey={survey}
                      setSurvey={setSurvey}
                      activePageIndex={activePageIndex}
                      setSelectedQuestion={setSelectedQuestion}
                      onEditVisibility={handleEditVisibility}
                    />
                  </div>
                </div>
              </div>

              <DragOverlay>
                {activeDragId ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {survey.pages
                        ?.flatMap((p: any) => p.questions)
                        .find((q: Question) => q.id === activeDragId)?.title ||
                        "New Question"}
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            <Card className="mt-6">
              <div className="p-0">
                <div className="h-[600px] w-full bg-white light">
                  <PreviewArea
                    survey={survey}
                    previewResponses={previewResponses}
                    onPreviewResponseChange={(questionId, value) =>
                      setPreviewResponses((prev: Record<string, unknown>) => ({
                        ...prev,
                        [questionId]: value,
                      }))
                    }
                    activePageIndex={activePageIndex}
                  />
                </div>
              </div>
            </Card>
          </>
        );

      case "published":
        return <PublishedModeView startDate={survey.startDate} />;

      case "live":
      case "closed":
      case "archived":
        return surveyId ? <RespondentProgress surveyId={surveyId} /> : null;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="flex items-center justify-between">
        {renderHeader()}
        <div className="flex items-center space-x-3">
          {renderActionButtons()}
        </div>
      </div>
      {validationError && (
        <Alert variant="error" onClose={() => setValidationError(null)}>
          {validationError}
        </Alert>
      )}
      {renderMainContent()}

      <VisibilityRulesModal
        isOpen={isVisibilityModalOpen}
        onClose={() => {
          setIsVisibilityModalOpen(false);
          setSelectedQuestion(null);
        }}
        question={selectedQuestion}
        candidateQuestions={(function () {
          if (!selectedQuestion) return [];
          const candidates: Question[] = [];
          for (let p = 0; p < activePageIndex; p++) {
            candidates.push(...survey.pages[p].questions);
          }
          const currentQs = survey.pages[activePageIndex].questions || [];
          const selIdx = currentQs.findIndex(
            (q: Question) => q.id === selectedQuestion.id
          );
          if (selIdx > 0) {
            candidates.push(...currentQs.slice(0, selIdx));
          }
          return candidates;
        })()}
        existingRules={
          selectedQuestion?.settings?.visibleWhen ||
          selectedQuestion?.visibilityRules ||
          []
        }
        onSave={(rules) => {
          if (!survey || !selectedQuestion) return;
          const updatedPages = [...survey.pages];
          const qIndex = updatedPages[activePageIndex].questions.findIndex(
            (q: Question) => q.id === selectedQuestion.id
          );
          if (qIndex !== -1) {
            const q = updatedPages[activePageIndex].questions[qIndex];
            const newSettings = { ...q.settings, visibleWhen: rules };
            updatedPages[activePageIndex].questions[qIndex] = {
              ...q,
              settings: newSettings,
            };
            setSurvey({ ...survey, pages: updatedPages });
          }
          setIsVisibilityModalOpen(false);
          setSelectedQuestion(null);
        }}
      />

      <AddQuestionModal
        isOpen={isAddQuestionModalOpen}
        onClose={() => {
          setIsAddQuestionModalOpen(false);
          setEditingQuestion(null);
        }}
        onSubmit={editingQuestion ? updateQuestion : addQuestion}
        editingQuestion={editingQuestion}
      />

      {/* Single dynamic confirmation modal for all actions */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmAction}
        title={modalProps.title}
        message={modalProps.message}
        {...{ action: modalProps.actionText }}
      />
      <RespondentsModal
        isOpen={respondentsModalOpen}
        onClose={() => setRespondentsModalOpen(false)}
        surveyId={surveyId || ""}
      />
    </div>
  );
}
