import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface TemplateEditModalProps {
  isOpen: boolean;
  templateTitle: string | null;
  category: string;
  estimatedTime: string;
  onCategoryChange: (value: string) => void;
  onEstimatedTimeChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}

const TemplateEditModal: React.FC<TemplateEditModalProps> = ({
  isOpen,
  templateTitle,
  category,
  estimatedTime,
  onCategoryChange,
  onEstimatedTimeChange,
  onClose,
  onSave,
  saving,
  error,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Template" size="sm">
      {templateTitle ? (
        <div className="w-[420px] space-y-5">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Template name
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{templateTitle}</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Category
              <input
                type="text"
                value={category}
                onChange={(event) => onCategoryChange(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Customer Feedback"
                disabled={saving}
              />
            </label>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Estimated time
              <input
                type="text"
                value={estimatedTime}
                onChange={(event) => onEstimatedTimeChange(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 5 min"
                disabled={saving}
              />
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Include the time label (for example, &ldquo;5 min&rdquo;).
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default TemplateEditModal;

