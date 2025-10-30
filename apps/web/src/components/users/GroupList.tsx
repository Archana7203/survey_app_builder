import React from 'react';
import type { RespondentGroup } from '../../api-paths/respondentsApi';
import Card from '../ui/Card';
import GroupCard from './GroupCard';

interface GroupListProps {
  groups: RespondentGroup[];
  loading: boolean;
  onEdit: (group: RespondentGroup) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const GroupList: React.FC<GroupListProps> = ({
  groups,
  loading,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Loading groups...
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">👥</div>
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No groups found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create a custom group to get started
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <GroupCard
          key={group._id}
          group={group}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      ))}
    </div>
  );
};

export default GroupList;

