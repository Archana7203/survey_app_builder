import React, { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import type { Respondent } from '../../api-paths/respondentsApi';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface ProfileFormData {
  name: string;
  mail: string;
  gender: 'male' | 'female' | 'other';
  employeeId?: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: Partial<ProfileFormData>) => Promise<void>;
  profile: Respondent | null;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  profile,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: '',
      mail: '',
      gender: 'male',
      employeeId: '',
    },
  });

  useEffect(() => {
    if (profile && isOpen) {
      reset({
        name: profile.name,
        mail: profile.mail,
        gender: profile.gender,
        employeeId: profile.employeeId || '',
      });
    }
  }, [profile, isOpen, reset]);

  const handleFormSubmit = async (data: ProfileFormData) => {
    if (!profile) return;

    try {
      await onSubmit(profile._id, data);
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!profile) return null;

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl transition-all">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium text-gray-900 dark:text-white"
                  >
                    Edit Profile
                  </Dialog.Title>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(handleFormSubmit)} className="px-6 py-4">
                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <Input
                        label="Name"
                        placeholder="Enter full name"
                        {...register('name', {
                          required: 'Name is required',
                          minLength: {
                            value: 2,
                            message: 'Name must be at least 2 characters',
                          },
                        })}
                        error={errors.name?.message}
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <Input
                        label="Mail"
                        type="email"
                        placeholder="Enter email address"
                        {...register('mail', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                          },
                        })}
                        error={errors.mail?.message}
                        required
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-6">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            value="male"
                            {...register('gender', { required: 'Gender is required' })}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Male
                          </span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            value="female"
                            {...register('gender', { required: 'Gender is required' })}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Female
                          </span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            value="other"
                            {...register('gender', { required: 'Gender is required' })}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Other
                          </span>
                        </label>
                      </div>
                      {errors.gender && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.gender.message}
                        </p>
                      )}
                    </div>

                    {/* Employee ID */}
                    <div>
                      <Input
                        label="Employee ID"
                        placeholder="Enter employee ID"
                        {...register('employeeId')}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSubmitting}>
                      {isSubmitting ? 'Updating...' : 'Update Profile'}
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

export default EditProfileModal;

