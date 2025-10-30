import React from 'react';
import type { Respondent } from '../../api-paths/respondentsApi';
import Card from '../ui/Card';
import ProfileCard from './ProfileCard';

interface ProfileListProps {
  profiles: Respondent[];
  loading: boolean;
  onEdit: (profile: Respondent) => void;
  onDelete: (id: string) => void;
}

const ProfileList: React.FC<ProfileListProps> = ({
  profiles,
  loading,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Loading profiles...
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">👤</div>
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No profiles found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create a profile or import from Azure to get started
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {profiles.map((profile) => (
        <ProfileCard
          key={profile._id}
          profile={profile}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default ProfileList;

