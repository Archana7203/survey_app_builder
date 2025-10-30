import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import type { RespondentGroup, Respondent } from '../../api-paths/respondentsApi';
import { fetchRespondentsApi } from '../../api-paths/respondentsApi';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import MemberSelector from '../users/MemberSelector';

interface GroupFormData {
  name: string;
  description: string;
}

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: Partial<GroupFormData & { members?: string[] }>) => Promise<void>;
  group: RespondentGroup | null;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  group,
}) => {
  const [allRespondents, setAllRespondents] = useState<Respondent[]>([]);
  const [respondentsLoading, setRespondentsLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<GroupFormData>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Fetch all respondents when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadAllRespondents = async () => {
        setRespondentsLoading(true);
        try {
          // Fetch all respondents with a high limit to get all users
          const data = await fetchRespondentsApi({ 
            page: 1, 
            limit: 1000, // High limit to get all respondents
            isArchived: false // Only active respondents
          });
          setAllRespondents(data.respondents || []);
        } catch (error) {
          console.error('Failed to fetch all respondents:', error);
          setAllRespondents([]);
        } finally {
          setRespondentsLoading(false);
        }
      };
      
      loadAllRespondents();
    }
  }, [isOpen]);

  useEffect(() => {
    if (group && isOpen) {
      reset({
        name: group.name,
        description: group.description || '',
      });
      
      // Extract member IDs
      const memberIds = Array.isArray(group.members)
        ? group.members.map(m => typeof m === 'string' ? m : m._id)
        : [];
      setSelectedMembers(memberIds);
    }
  }, [group, isOpen, reset]);

  const handleFormSubmit = async (data: GroupFormData) => {
    if (!group) return;

    try {
      await onSubmit(group._id, {
        name: data.name,
        description: data.description || undefined,
        members: selectedMembers,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update group:', error);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!group) return null;

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
                    Edit Group
                  </Dialog.Title>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(handleFormSubmit)} className="px-6 py-4">
                  <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                    {/* Name */}
                    <div>
                      <Input
                        label="Name"
                        placeholder="Enter group name"
                        {...register('name', {
                          required: 'Group name is required',
                          minLength: {
                            value: 2,
                            message: 'Name must be at least 2 characters',
                          },
                        })}
                        error={errors.name?.message}
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <TextArea
                        label="Description"
                        placeholder="Enter group description (optional)"
                        rows={3}
                        {...register('description')}
                      />
                    </div>

                    {/* Member Selector */}
                    {respondentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Loading respondents...
                        </div>
                      </div>
                    ) : (
                      <MemberSelector
                        availableRespondents={allRespondents}
                        selectedMemberIds={selectedMembers}
                        onMembersChange={setSelectedMembers}
                        label="Add Members"
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSubmitting}>
                      {isSubmitting ? 'Updating...' : 'Update Group'}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditGroupModal;

