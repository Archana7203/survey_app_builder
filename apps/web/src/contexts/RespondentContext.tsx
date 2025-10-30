import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type {
  Respondent,
  RespondentGroup,
  AzureUser,
} from '../api-paths/respondentsApi';
import {
  fetchRespondentsApi,
  fetchRespondentByIdApi,
  createRespondentApi,
  updateRespondentApi,
  deleteRespondentApi,
  importAzureRespondentsApi,
  fetchRespondentGroupsApi,
  fetchRespondentGroupByIdApi,
  createRespondentGroupApi,
  updateRespondentGroupApi,
  deleteRespondentGroupApi,
  addMembersToGroupApi,
  removeMembersFromGroupApi,
  duplicateRespondentGroupApi,
  fetchAzureUsersApi,
} from '../api-paths/respondentsApi';

interface RespondentContextValue {
  // Respondents
  respondents: Respondent[];
  respondentsLoading: boolean;
  respondentsPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  fetchRespondents: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    gender?: 'male' | 'female' | 'other';
    isArchived?: boolean;
  }) => Promise<void>;
  getRespondentById: (id: string) => Promise<Respondent>;
  createRespondent: (respondent: Omit<Respondent, '_id' | 'createdBy' | 'isArchived' | 'createdAt' | 'updatedAt'>) => Promise<Respondent>;
  updateRespondent: (id: string, updates: Partial<Respondent>) => Promise<Respondent>;
  deleteRespondent: (id: string) => Promise<void>;
  importAzureRespondents: (profiles: AzureUser[]) => Promise<{ upsertedCount: number; modifiedCount: number }>;

  // Respondent Groups
  groups: RespondentGroup[];
  groupsLoading: boolean;
  groupsPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  fetchGroups: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isArchived?: boolean;
  }) => Promise<void>;
  getGroupById: (id: string) => Promise<RespondentGroup>;
  createGroup: (group: { name: string; description?: string; members?: string[] }) => Promise<RespondentGroup>;
  updateGroup: (id: string, updates: Partial<RespondentGroup>) => Promise<RespondentGroup>;
  deleteGroup: (id: string) => Promise<void>;
  addMembersToGroup: (groupId: string, memberIds: string[]) => Promise<RespondentGroup>;
  removeMembersFromGroup: (groupId: string, memberIds: string[]) => Promise<RespondentGroup>;
  duplicateGroup: (groupId: string, newName?: string) => Promise<RespondentGroup>;

  // Azure Users
  azureUsers: AzureUser[];
  azureUsersLoading: boolean;
  fetchAzureUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => Promise<void>;

  // Utility
  refreshAll: () => Promise<void>;
}

const RespondentContext = createContext<RespondentContextValue | undefined>(undefined);

export const useRespondents = () => {
  const ctx = useContext(RespondentContext);
  if (!ctx) throw new Error('useRespondents must be used within RespondentProvider');
  return ctx;
};

export const RespondentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Respondents state
  const [respondents, setRespondents] = useState<Respondent[]>([]);
  const [respondentsLoading, setRespondentsLoading] = useState(false);
  const [respondentsPagination, setRespondentsPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);

  // Groups state
  const [groups, setGroups] = useState<RespondentGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsPagination, setGroupsPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);

  // Azure users state
  const [azureUsers, setAzureUsers] = useState<AzureUser[]>([]);
  const [azureUsersLoading, setAzureUsersLoading] = useState(false);

  // Respondent methods
  const fetchRespondents = useCallback(async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    gender?: 'male' | 'female' | 'other';
    isArchived?: boolean;
  }) => {
    setRespondentsLoading(true);
    try {
      const data = await fetchRespondentsApi(params);
      setRespondents(data.respondents || []);
      setRespondentsPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch respondents:', error);
      setRespondents([]);
    } finally {
      setRespondentsLoading(false);
    }
  }, []);

  const getRespondentById = useCallback(async (id: string): Promise<Respondent> => {
    // Check cache first
    const cached = respondents.find(r => r._id === id);
    if (cached) return cached;

    // Fetch from API
    const respondent = await fetchRespondentByIdApi(id);
    
    // Update cache
    setRespondents(prev => {
      const exists = prev.find(r => r._id === id);
      if (exists) return prev;
      return [...prev, respondent];
    });

    return respondent;
  }, [respondents]);

  const createRespondent = useCallback(async (respondent: Omit<Respondent, '_id' | 'createdBy' | 'isArchived' | 'createdAt' | 'updatedAt'>): Promise<Respondent> => {
    const created = await createRespondentApi(respondent);
    
    // Add to cache
    setRespondents(prev => [created, ...prev]);
    
    // Update pagination total
    if (respondentsPagination) {
      setRespondentsPagination(prev => prev ? { ...prev, total: prev.total + 1 } : null);
    }

    return created;
  }, [respondentsPagination]);

  const updateRespondent = useCallback(async (id: string, updates: Partial<Respondent>): Promise<Respondent> => {
    const updated = await updateRespondentApi(id, updates);
    
    // Update cache
    setRespondents(prev => prev.map(r => r._id === id ? updated : r));

    return updated;
  }, []);

  const deleteRespondent = useCallback(async (id: string): Promise<void> => {
    await deleteRespondentApi(id);
    
    // Remove from cache (soft delete sets isArchived=true)
    setRespondents(prev => prev.map(r => r._id === id ? { ...r, isArchived: true } : r));
    
    // Update pagination total
    if (respondentsPagination) {
      setRespondentsPagination(prev => prev ? { ...prev, total: Math.max(0, prev.total - 1) } : null);
    }
  }, [respondentsPagination]);

  const importAzureRespondents = useCallback(async (profiles: AzureUser[]) => {
    const result = await importAzureRespondentsApi(profiles);
    
    // Refresh respondents list after import
    await fetchRespondents();

    return result;
  }, [fetchRespondents]);

  // Group methods
  const fetchGroups = useCallback(async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isArchived?: boolean;
  }) => {
    setGroupsLoading(true);
    try {
      const data = await fetchRespondentGroupsApi(params);
      setGroups(data.groups || []);
      setGroupsPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  const getGroupById = useCallback(async (id: string): Promise<RespondentGroup> => {
    // Check cache first
    const cached = groups.find(g => g._id === id);
    if (cached) return cached;

    // Fetch from API
    const group = await fetchRespondentGroupByIdApi(id);
    
    // Update cache
    setGroups(prev => {
      const exists = prev.find(g => g._id === id);
      if (exists) return prev;
      return [...prev, group];
    });

    return group;
  }, [groups]);

  const createGroup = useCallback(async (group: { name: string; description?: string; members?: string[] }): Promise<RespondentGroup> => {
    const created = await createRespondentGroupApi(group);
    
    // Add to cache
    setGroups(prev => [created, ...prev]);
    
    // Update pagination total
    if (groupsPagination) {
      setGroupsPagination(prev => prev ? { ...prev, total: prev.total + 1 } : null);
    }

    return created;
  }, [groupsPagination]);

  const updateGroup = useCallback(async (id: string, updates: Partial<RespondentGroup>): Promise<RespondentGroup> => {
    const updated = await updateRespondentGroupApi(id, updates);
    
    // Update cache
    setGroups(prev => prev.map(g => g._id === id ? updated : g));

    return updated;
  }, []);

  const deleteGroup = useCallback(async (id: string): Promise<void> => {
    await deleteRespondentGroupApi(id);
    
    // Remove from cache (soft delete sets isArchived=true)
    setGroups(prev => prev.map(g => g._id === id ? { ...g, isArchived: true } : g));
    
    // Update pagination total
    if (groupsPagination) {
      setGroupsPagination(prev => prev ? { ...prev, total: Math.max(0, prev.total - 1) } : null);
    }
  }, [groupsPagination]);

  const addMembersToGroup = useCallback(async (groupId: string, memberIds: string[]): Promise<RespondentGroup> => {
    const updated = await addMembersToGroupApi(groupId, memberIds);
    
    // Update cache
    setGroups(prev => prev.map(g => g._id === groupId ? updated : g));

    return updated;
  }, []);

  const removeMembersFromGroup = useCallback(async (groupId: string, memberIds: string[]): Promise<RespondentGroup> => {
    const updated = await removeMembersFromGroupApi(groupId, memberIds);
    
    // Update cache
    setGroups(prev => prev.map(g => g._id === groupId ? updated : g));

    return updated;
  }, []);

  const duplicateGroup = useCallback(async (groupId: string, newName?: string): Promise<RespondentGroup> => {
    const duplicated = await duplicateRespondentGroupApi(groupId, newName);
    
    // Add to cache
    setGroups(prev => [duplicated, ...prev]);
    
    // Update pagination total
    if (groupsPagination) {
      setGroupsPagination(prev => prev ? { ...prev, total: prev.total + 1 } : null);
    }

    return duplicated;
  }, [groupsPagination]);

  // Azure users methods
  const fetchAzureUsers = useCallback(async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    setAzureUsersLoading(true);
    try {
      const data = await fetchAzureUsersApi(params);
      setAzureUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch Azure users:', error);
      setAzureUsers([]);
    } finally {
      setAzureUsersLoading(false);
    }
  }, []);

  // Utility methods
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchRespondents(),
      fetchGroups(),
    ]);
  }, [fetchRespondents, fetchGroups]);

  // Memoize context value
  const contextValue = useMemo(
    () => ({
      // Respondents
      respondents,
      respondentsLoading,
      respondentsPagination,
      fetchRespondents,
      getRespondentById,
      createRespondent,
      updateRespondent,
      deleteRespondent,
      importAzureRespondents,

      // Groups
      groups,
      groupsLoading,
      groupsPagination,
      fetchGroups,
      getGroupById,
      createGroup,
      updateGroup,
      deleteGroup,
      addMembersToGroup,
      removeMembersFromGroup,
      duplicateGroup,

      // Azure Users
      azureUsers,
      azureUsersLoading,
      fetchAzureUsers,

      // Utility
      refreshAll,
    }),
    [
      respondents,
      respondentsLoading,
      respondentsPagination,
      fetchRespondents,
      getRespondentById,
      createRespondent,
      updateRespondent,
      deleteRespondent,
      importAzureRespondents,
      groups,
      groupsLoading,
      groupsPagination,
      fetchGroups,
      getGroupById,
      createGroup,
      updateGroup,
      deleteGroup,
      addMembersToGroup,
      removeMembersFromGroup,
      duplicateGroup,
      azureUsers,
      azureUsersLoading,
      fetchAzureUsers,
      refreshAll,
    ]
  );

  return (
    <RespondentContext.Provider value={contextValue}>
      {children}
    </RespondentContext.Provider>
  );
};

