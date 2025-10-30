import React from 'react';
import type { Respondent } from '../../api-paths/respondentsApi';
import Button from '../ui/Button';

interface ProfileCardProps {
  profile: Respondent;
  onEdit: (profile: Respondent) => void;
  onDelete: (id: string) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onEdit, onDelete }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 dark:text-blue-400 font-medium text-lg">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                {profile.name}
              </h3>
              <div className="flex items-center gap-4 mt-1 flex-wrap">
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {profile.mail}
                </p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 capitalize">
                  {profile.gender}
                </span>
                {profile.employeeId && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    ID: {profile.employeeId}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(profile)}
            aria-label={`Edit ${profile.name}`}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(profile._id)}
            aria-label={`Delete ${profile.name}`}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;

