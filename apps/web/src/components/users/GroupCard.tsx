import React from 'react';
import type { RespondentGroup } from '../../api-paths/respondentsApi';
import Button from '../ui/Button';

interface GroupCardProps {
  group: RespondentGroup;
  onEdit: (group: RespondentGroup) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onEdit, onDelete, onDuplicate }) => {
  const memberCount = Array.isArray(group.members) ? group.members.length : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 dark:text-green-400 text-xl">
                👥
              </span>
            </div>

            {/* Group Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                {group.name}
              </h3>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {memberCount} {memberCount === 1 ? 'member' : 'members'}
                </p>
                {group.description && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 truncate max-w-md">
                    {group.description}
                  </p>
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
            onClick={() => onEdit(group)}
            aria-label={`Edit ${group.name}`}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicate(group._id)}
            aria-label={`Duplicate ${group.name}`}
          >
            Duplicate
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(group._id)}
            aria-label={`Delete ${group.name}`}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;

