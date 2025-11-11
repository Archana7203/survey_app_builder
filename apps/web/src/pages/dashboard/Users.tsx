import React, { useEffect, useState } from 'react';
import { useRespondents } from '../../contexts/RespondentContext';
import type { Respondent, RespondentGroup } from '../../api-paths/respondentsApi';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ProfileList from '../../components/users/ProfileList';
import GroupList from '../../components/users/GroupList';
import CreateProfileModal from '../../components/modals/CreateProfileModal';
import EditProfileModal from '../../components/modals/EditProfileModal';
import CreateGroupModal from '../../components/modals/CreateGroupModal';
import EditGroupModal from '../../components/modals/EditGroupModal';
import ImportFromAzureModal from '../../components/modals/ImportFromAzureModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

const Users: React.FC = () => {
  const {
    respondents,
    respondentsLoading,
    respondentsPagination,
    fetchRespondents,
    createRespondent,
    updateRespondent,
    deleteRespondent,
    groups,
    groupsLoading,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    duplicateGroup,
  } = useRespondents();

  // Navigation filter state
  const [activeTab, setActiveTab] = useState<'profiles' | 'groups'>('profiles');
  
  // Separate search queries for profiles and groups
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  
  // Pagination state
  const [currentProfilePage, setCurrentProfilePage] = useState(1);
  const [currentGroupPage, setCurrentGroupPage] = useState(1);
  
  // Profile modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportAzureModalOpen, setIsImportAzureModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Respondent | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  
  // Group modal states
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<RespondentGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  // Fetch respondents with search query
  useEffect(() => {
    fetchRespondents({ page: currentProfilePage, limit: 10, search: profileSearchQuery });
  }, [currentProfilePage, fetchRespondents, profileSearchQuery]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    if (profileSearchQuery) {
      setCurrentProfilePage(1);
    }
  }, [profileSearchQuery]);

  // Fetch groups with search query
  useEffect(() => {
    fetchGroups({ page: currentGroupPage, limit: 10, search: groupSearchQuery });
  }, [currentGroupPage, fetchGroups, groupSearchQuery]);

  // Reset to page 1 when group search query changes
  useEffect(() => {
    if (groupSearchQuery) {
      setCurrentGroupPage(1);
    }
  }, [groupSearchQuery]);

  const handleCreateProfile = () => {
    setIsCreateModalOpen(true);
  };

  const showSuccessMessage = (message: string) => {
    showSuccessToast(message);
  };

  const showErrorMessage = (message: string) => {
    showErrorToast(message);
  };

  const handleCreateProfileSubmit = async (data: {
    name: string;
    mail: string;
    gender: 'male' | 'female' | 'other';
    employeeId?: string;
  }) => {
    try {
      await createRespondent({
        name: data.name,
        mail: data.mail,
        gender: data.gender,
        employeeId: data.employeeId || '',
        azureId: '', // Empty for manually created profiles
        userPrincipalName: data.mail,
        accountEnabled: true,
      });
      showSuccessMessage('Profile created successfully.');
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create profile:', error);
      showErrorMessage('Failed to create profile. Please try again.');
      throw error;
    }
  };

  const handleEditProfile = (profile: Respondent) => {
    setSelectedProfile(profile);
    setIsEditModalOpen(true);
  };

  const handleEditProfileSubmit = async (id: string, data: Partial<Respondent>) => {
    try {
      await updateRespondent(id, data);
      setIsEditModalOpen(false);
      setSelectedProfile(null);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  const handleDeleteProfile = (id: string) => {
    setProfileToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!profileToDelete) return;

    try {
      await deleteRespondent(profileToDelete);
      showSuccessMessage('Profile deleted successfully.');
      setIsDeleteModalOpen(false);
      setProfileToDelete(null);
    } catch (error) {
      console.error('Failed to delete profile:', error);
      showErrorMessage('Failed to delete profile. Please try again.');
    }
  };

  const handleImportFromAzure = () => {
    setIsImportAzureModalOpen(true);
  };

  // Group handlers
  const handleCreateGroup = () => {
    setIsCreateGroupModalOpen(true);
  };

  const handleCreateGroupSubmit = async (data: {
    name: string;
    description?: string;
    members?: string[];
  }) => {
    try {
      await createGroup(data);
      showSuccessMessage('Group created successfully.');
      setIsCreateGroupModalOpen(false);
    } catch (error) {
      console.error('Failed to create group:', error);
      showErrorMessage('Failed to create group. Please try again.');
      throw error;
    }
  };

  const handleEditGroup = (group: RespondentGroup) => {
    setSelectedGroup(group);
    setIsEditGroupModalOpen(true);
  };

  const handleEditGroupSubmit = async (id: string, data: Partial<RespondentGroup>) => {
    try {
      await updateGroup(id, data);
      setIsEditGroupModalOpen(false);
      setSelectedGroup(null);
    } catch (error) {
      console.error('Failed to update group:', error);
      throw error;
    }
  };

  const handleDeleteGroupClick = (id: string) => {
    setGroupToDelete(id);
    setIsDeleteGroupModalOpen(true);
  };

  const handleConfirmGroupDelete = async () => {
    if (!groupToDelete) return;

    try {
      await deleteGroup(groupToDelete);
      showSuccessMessage('Group deleted successfully.');
      setIsDeleteGroupModalOpen(false);
      setGroupToDelete(null);
    } catch (error) {
      console.error('Failed to delete group:', error);
      showErrorMessage('Failed to delete group. Please try again.');
    }
  };

  const handleDuplicateGroup = async (groupId: string) => {
    try {
      const group = groups.find(g => g._id === groupId);
      if (!group) return;
      
      const newName = `${group.name} (Copy)`;
      await duplicateGroup(groupId, newName);
      showSuccessMessage('Group duplicated successfully.');
    } catch (error) {
      console.error('Failed to duplicate group:', error);
      showErrorMessage('Failed to duplicate group. Please try again.');
    }
  };

  // Filter out archived items (backend should already handle search)
  const filteredRespondents = respondents.filter(r => !r.isArchived);
  const filteredGroups = groups.filter(g => !g.isArchived);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Users
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage survey respondents and groups for targeted survey distribution
          </p>
        </div>
      </div>

      {/* Navigation Filter Buttons */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('profiles')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'profiles'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          👥 Profiles ({respondentsPagination?.total || filteredRespondents.length})
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'groups'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          👥 Groups ({filteredGroups.length})
        </button>
      </div>

      {/* Profiles Section */}
      {activeTab === 'profiles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Profiles
            </h2>
            <div className="flex gap-3">
              <Button onClick={handleCreateProfile} variant="primary" size="sm">
                + Create Profile
              </Button>
              <Button onClick={handleImportFromAzure} variant="outline" size="sm">
                📥 Import from Azure
              </Button>
            </div>
          </div>

        {/* Search */}
        <div className="w-full">
          <Input
            type="text"
            placeholder="Search profiles..."
            value={profileSearchQuery}
            onChange={(e) => setProfileSearchQuery(e.target.value)}
          />
        </div>

        {/* Profile List */}
        <div>
          {/* Top Pagination */}
          {respondentsPagination && respondentsPagination.totalPages > 1 && (
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {filteredRespondents.length} profile{filteredRespondents.length !== 1 ? 's' : ''}
                {profileSearchQuery && ` matching "${profileSearchQuery}"`}
                {` (Total: ${respondentsPagination.total})`}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentProfilePage(p => Math.max(1, p - 1))}
                  disabled={!respondentsPagination.hasPrev || respondentsLoading}
                  className="px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                <span className="px-2 py-1 text-sm text-gray-600 dark:text-gray-400">
                  {respondentsPagination.page} / {respondentsPagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentProfilePage(p => p + 1)}
                  disabled={!respondentsPagination.hasNext || respondentsLoading}
                  className="px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            </div>
          )}
          
          {(!respondentsPagination || respondentsPagination.totalPages === 1) && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {filteredRespondents.length} profile{filteredRespondents.length !== 1 ? 's' : ''}
              {profileSearchQuery && ` matching "${profileSearchQuery}"`}
              {respondentsPagination && ` (Total: ${respondentsPagination.total})`}
            </div>
          )}

          <ProfileList
            profiles={filteredRespondents}
            loading={respondentsLoading}
            onEdit={handleEditProfile}
            onDelete={handleDeleteProfile}
          />

          {/* Bottom Pagination */}
          {respondentsPagination && respondentsPagination.totalPages > 1 && (
            <div className="flex items-center justify-end mt-4">
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentProfilePage(p => Math.max(1, p - 1))}
                  disabled={!respondentsPagination.hasPrev || respondentsLoading}
                  className="px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                <span className="px-2 py-1 text-sm text-gray-600 dark:text-gray-400">
                  {respondentsPagination.page} / {respondentsPagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentProfilePage(p => p + 1)}
                  disabled={!respondentsPagination.hasNext || respondentsLoading}
                  className="px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {/* Groups Section */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Groups
          </h2>
          <Button onClick={handleCreateGroup} variant="primary" size="sm">
            + Create Custom Group
          </Button>
        </div>

        {/* Search */}
        <div className="w-full">
          <Input
            type="text"
            placeholder="Search groups..."
            value={groupSearchQuery}
            onChange={(e) => setGroupSearchQuery(e.target.value)}
          />
        </div>

        {/* Group List */}
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {filteredGroups.length} group{filteredGroups.length !== 1 ? 's' : ''}
            {groupSearchQuery && ` matching "${groupSearchQuery}"`}
          </div>
          <GroupList
            groups={filteredGroups}
            loading={groupsLoading}
            onEdit={handleEditGroup}
            onDelete={handleDeleteGroupClick}
            onDuplicate={handleDuplicateGroup}
          />
        </div>
        </div>
      )}

      {/* Modals */}
      <CreateProfileModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProfileSubmit}
      />

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProfile(null);
        }}
        onSubmit={handleEditProfileSubmit}
        profile={selectedProfile}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProfileToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Profile"
        message="Are you sure you want to delete this profile? This action cannot be undone."
        action="Delete"
      />

      <ImportFromAzureModal
        isOpen={isImportAzureModalOpen}
        onClose={() => setIsImportAzureModalOpen(false)}
        onImportSuccess={showSuccessMessage}
        onImportError={showErrorMessage}
      />

      {/* Group Modals */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSubmit={handleCreateGroupSubmit}
      />

      <EditGroupModal
        isOpen={isEditGroupModalOpen}
        onClose={() => {
          setIsEditGroupModalOpen(false);
          setSelectedGroup(null);
        }}
        onSubmit={handleEditGroupSubmit}
        group={selectedGroup}
      />

      <ConfirmationModal
        isOpen={isDeleteGroupModalOpen}
        onClose={() => {
          setIsDeleteGroupModalOpen(false);
          setGroupToDelete(null);
        }}
        onConfirm={handleConfirmGroupDelete}
        title="Delete Group"
        message="Are you sure you want to delete this group? This action cannot be undone."
        action="Delete"
      />
    </div>
  );
};

export default Users;

