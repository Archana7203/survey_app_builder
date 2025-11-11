import React, { useEffect, useRef, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { ClipboardCheck } from "lucide-react";

interface ImportSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelected: (file: File) => Promise<boolean>;
  isUploading: boolean;
  isSuccess: boolean;
  modalTitle?: string;
  inputLabel?: string;
  helperText?: string;
  uploadButtonLabel?: string;
  successTitle?: string;
  successSubtitle?: string;
}

const ImportSurveyModal: React.FC<ImportSurveyModalProps> = ({
  isOpen,
  onClose,
  onFileSelected,
  isUploading,
  isSuccess,
  modalTitle = "Import Survey",
  inputLabel = "Choose a survey JSON file",
  helperText = "Upload a survey file exported from this app (.json).",
  uploadButtonLabel = "Upload",
  successTitle = "Survey imported successfully!",
  successSubtitle = "You can close this window or import another survey.",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isSuccess && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [isSuccess]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleUploadClick = async () => {
    if (!selectedFile || isUploading) {
      return;
    }

    const wasSuccessful = await onFileSelected(selectedFile);
    if (wasSuccessful) {
      setSelectedFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleClose = () => {
    if (isUploading) {
      return;
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      size="sm"
    >
      <div className="space-y-6 w-[450px]">
        {!isSuccess ? (
          <>
            <div className="space-y-2">
              <label
                htmlFor="survey-import-input"
                className="text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                {inputLabel}
              </label>
              <input
                id="survey-import-input"
                ref={inputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                disabled={isUploading}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-600 hover:file:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
              {selectedFile && (
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Selected: <span className="font-semibold">{selectedFile.name}</span>
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {helperText}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUploadClick}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? "Uploading..." : uploadButtonLabel}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3 py-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-inner">
              <ClipboardCheck className="h-12 w-12 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {successTitle}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {successSubtitle}
              </p>
            </div>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImportSurveyModal;

