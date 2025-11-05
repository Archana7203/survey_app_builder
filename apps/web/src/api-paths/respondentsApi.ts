import { buildApiUrl } from './apiConfig';

export interface Respondent {
  _id: string;
  azureId?: string;
  name: string;
  mail: string;
  gender: 'male' | 'female' | 'other';
  userPrincipalName?: string;
  accountEnabled?: boolean;
  employeeId?: string | null;
  createdBy: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RespondentGroup {
  _id: string;
  name: string;
  description?: string;
  members: Respondent[] | string[];
  createdBy: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AzureUser {
  azureId: string;
  name: string;
  mail: string;
  gender: 'male' | 'female' | 'other';
  userPrincipalName: string;
  accountEnabled: boolean;
  employeeId: string;
}

export interface PaginationResponse<T> {
  [key: string]: T[] | any;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Respondent APIs
export const fetchRespondentsApi = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  gender?: 'male' | 'female' | 'other';
  isArchived?: boolean;
}): Promise<PaginationResponse<Respondent>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.gender) queryParams.append('gender', params.gender);
    if (params?.isArchived !== undefined) queryParams.append('isArchived', params.isArchived.toString());

    const url = `/api/respondents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const res = await fetch(buildApiUrl(url), {
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to fetch respondents`)
      );
    }

    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error('Failed to fetch respondents:', error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const fetchRespondentByIdApi = async (id: string): Promise<Respondent> => {
  try {
    const res = await fetch(buildApiUrl(`/api/respondents/${id}`), {
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to fetch respondent `)
      );
    }

    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error('Failed to fetch respondent by ID:', error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const createRespondentApi = async (
  respondent: Omit<Respondent, '_id' | 'createdBy' | 'isArchived' | 'createdAt' | 'updatedAt'>
): Promise<Respondent> => {
  try {
    const res = await fetch(buildApiUrl('/api/respondents'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(respondent),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to create respondent `)
      );
    }

    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error('Failed to create respondent:', error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const updateRespondentApi = async (
  id: string,
  updates: Partial<Respondent>
): Promise<Respondent> => {
  try {
    const res = await fetch(buildApiUrl(`/api/respondents/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to update respondent`)
      );
    }

    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error('Failed to update respondent:', error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const deleteRespondentApi = async (id: string): Promise<{ message: string }> => {
  try {
    const res = await fetch(buildApiUrl(`/api/respondents/${id}`), {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to delete respondent `)
      );
    }

    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error('Failed to delete respondent:', error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const importAzureRespondentsApi = async (profiles: AzureUser[]): Promise<{
  upsertedCount: number;
  modifiedCount: number;
  message: string;
}> => {
  try {
    const res = await fetch(buildApiUrl('/api/respondents/import/azure'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ profiles }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to import Azure respondents`)
      );
    }

    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error('Failed to import Azure respondents:', error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

// Respondent Group APIs
export const fetchRespondentGroupsApi = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  isArchived?: boolean;
}): Promise<PaginationResponse<RespondentGroup>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isArchived !== undefined) queryParams.append('isArchived', params.isArchived.toString());

    const url = `/api/respondent-groups${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const res = await fetch(buildApiUrl(url), {
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to fetch groups`)
      );
    }

    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const fetchRespondentGroupByIdApi = async (id: string): Promise<RespondentGroup> => {
  try {
    const res = await fetch(buildApiUrl(`/api/respondent-groups/${id}`), {
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to fetch group`)
      );
    }

    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error('Failed to fetch group by ID:', error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const createRespondentGroupApi = async (group: {
  name: string;
  description?: string;
  members?: string[];
}): Promise<RespondentGroup> => {
  try {
    const res = await fetch(buildApiUrl('/api/respondent-groups'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(group),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to create group`)
      );
    }

    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error('Failed to create group:', error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const updateRespondentGroupApi = async (
  id: string,
  updates: Partial<RespondentGroup>
): Promise<RespondentGroup> => {
  try {
    const res = await fetch(buildApiUrl(`/api/respondent-groups/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to update group`)
      );
    }

    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error('Failed to update group:', error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const deleteRespondentGroupApi = async (id: string): Promise<{ message: string }> => {
  try {
    const res = await fetch(buildApiUrl(`/api/respondent-groups/${id}`), {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to delete group`)
      );
    }

    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error('Failed to delete group:', error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const addMembersToGroupApi = async (
  groupId: string,
  memberIds: string[]
): Promise<RespondentGroup> => {
  try {
    const res = await fetch(buildApiUrl(`/api/respondent-groups/${groupId}/members`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ memberIds }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to add members to group `)
      );
    }

    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error('Failed to add members to group:', error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const removeMembersFromGroupApi = async (
  groupId: string,
  memberIds: string[]
): Promise<RespondentGroup> => {
  try {
    const res = await fetch(buildApiUrl(`/api/respondent-groups/${groupId}/members`), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ memberIds }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to remove members from group`)
      );
    }

    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error('Failed to remove members from group:', error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const duplicateRespondentGroupApi = async (
  groupId: string,
  newName?: string
): Promise<RespondentGroup> => {
  try {
    const res = await fetch(buildApiUrl(`/api/respondent-groups/${groupId}/duplicate`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ newName }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to duplicate group`)
      );
    }

    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error('Failed to duplicate group:', error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

// Azure Users APIs
export const fetchAzureUsersApi = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{
  users: AzureUser[];
  pagination: {
    page: number;
    limit: number;
    hasNext?: boolean;
    nextLink?: string;
  };
}> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const url = `/api/azure-users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const res = await fetch(buildApiUrl(url), {
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to fetch Azure users`)
      );
    }

    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error('Failed to fetch Azure users:', error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

export const fetchAzureUserByIdApi = async (id: string): Promise<AzureUser> => {
  try {
    const res = await fetch(buildApiUrl(`/api/azure-users/${id}`), {
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Promise.reject(
        new Error(errorData.error || `Failed to fetch Azure user`)
      );
    }

    const data = await res.json();
    return Promise.resolve(data);
  } catch (error) {
    console.error('Failed to fetch Azure user by ID:', error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
};

