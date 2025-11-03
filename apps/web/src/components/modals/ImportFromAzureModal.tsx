import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useRespondents } from '../../contexts/RespondentContext';
import Button from '../ui/Button';

interface ImportFromAzureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportFromAzureModal: React.FC<ImportFromAzureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { azureUsers, azureUsersLoading, fetchAzureUsers, importAzureRespondents } = useRespondents();
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAzureUsers({ page: 1, limit: 100 });
      setSelectedIds(new Set());
      setSuccessMessage(null);
      setErrorMessage(null);
      setSearchQuery('');
    }
  }, [isOpen, fetchAzureUsers]);

  useEffect(() => {
    if (errorMessage) {
      alert(errorMessage);
      setErrorMessage(null);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (successMessage) {
      alert(successMessage);
      setSuccessMessage(null);
    }
  }, [successMessage]);

  const filteredUsers = azureUsers.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.mail.toLowerCase().includes(query) ||
      (user.employeeId && user.employeeId.toLowerCase().includes(query))
    );
  });

  const handleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map(u => u.azureId)));
    }
  };

  const handleToggleUser = (azureId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(azureId)) {
      newSelected.delete(azureId);
    } else {
      newSelected.add(azureId);
    }
    setSelectedIds(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      setErrorMessage('Please select at least one user to import');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const selectedUsers = azureUsers.filter(u => selectedIds.has(u.azureId));
      const result = await importAzureRespondents(selectedUsers);
      
      setSuccessMessage(
        `Successfully imported ${result.upsertedCount} profile(s). ${result.modifiedCount} existing profile(s) updated.`
      );
      
      // Auto-close after 2 seconds on success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to import profiles. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const allSelected = filteredUsers.length > 0 && selectedIds.size === filteredUsers.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredUsers.length;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl transition-all">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium text-gray-900 dark:text-white"
                  >
                    Import from Azure
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Select users from your Azure AD to import as respondents
                  </p>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                  {/* Search */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search users by name, email, or employee ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-2 focus:border-blue-500"
                    />
                  </div>

                  {/* Select All */}
                  <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate = someSelected;
                          }
                        }}
                        onChange={handleSelectAll}
                        disabled={azureUsersLoading || filteredUsers.length === 0}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Select All ({filteredUsers.length} users)
                      </span>
                    </label>
                  </div>

                  {/* User List */}
                  {azureUsersLoading ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Loading Azure users...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      {searchQuery ? 'No users found matching your search' : 'No Azure users available'}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                      {filteredUsers.map((user) => (
                        <label
                          key={user.azureId}
                          className="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(user.azureId)}
                            onChange={() => handleToggleUser(user.azureId)}
                            className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </p>
                              {user.accountEnabled && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {user.mail}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 capitalize">
                                {user.gender}
                              </span>
                              {user.employeeId && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  ID: {user.employeeId}
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Selected Count */}
                  {selectedIds.size > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        {selectedIds.size} user{selectedIds.size !== 1 ? 's' : ''} selected for import
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting || selectedIds.size === 0}
                  >
                    {isSubmitting ? 'Importing...' : `Import ${selectedIds.size > 0 ? `(${selectedIds.size})` : ''}`}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ImportFromAzureModal;

