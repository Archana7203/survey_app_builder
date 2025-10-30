import { ConfidentialClientApplication, ClientCredentialRequest } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import log from '../logger';

// Azure User DTO matching the required format for Respondent model
export interface AzureUserDTO {
  azureId: string;
  name: string;
  mail: string;
  gender: 'male' | 'female' | 'other';
  userPrincipalName: string;
  accountEnabled: boolean;
  employeeId: string;
}

export class AzureGraphService {
  private cca: ConfidentialClientApplication;

  constructor() {
    const clientId = process.env.YOUR_CLIENT_ID;
    const clientSecret = process.env.YOUR_CLIENT_SECRET;
    const tenantId = process.env.YOUR_TENANT_ID;

    if (!clientId || !clientSecret || !tenantId) {
      const missingVars = [];
      if (!clientId) missingVars.push('YOUR_CLIENT_ID');
      if (!clientSecret) missingVars.push('YOUR_CLIENT_SECRET');
      if (!tenantId) missingVars.push('YOUR_TENANT_ID');
      
      log.error('Missing Azure AD configuration', 'AzureGraphService', {
        missingVars: missingVars.join(', ')
      });
      throw new Error(`Missing Azure AD configuration: ${missingVars.join(', ')}`);
    }

    const msalConfig = {
      auth: {
        clientId,
        clientSecret,
        authority: `https://login.microsoftonline.com/${tenantId}`,
      },
    };

    this.cca = new ConfidentialClientApplication(msalConfig);
    log.info('Azure Graph Service initialized', 'AzureGraphService');
  }

  /**
   * Get access token using client credentials flow (app-only)
   */
  private async getAccessToken(): Promise<string> {
    log.debug('Acquiring access token', 'getAccessToken');
    
    const tokenRequest: ClientCredentialRequest = {
      scopes: ['https://graph.microsoft.com/.default'],
    };

    try {
      const response = await this.cca.acquireTokenByClientCredential(tokenRequest);
      
      if (!response || !response.accessToken) {
        log.error('No access token received', 'getAccessToken');
        throw new Error('Failed to acquire access token');
      }

      log.debug('Access token acquired successfully', 'getAccessToken');
      return response.accessToken;
    } catch (error: any) {
      log.error('Error acquiring token', 'getAccessToken', {
        error: error.message || 'Unknown error',
        errorCode: error.errorCode,
      });
      throw new Error(`Failed to acquire access token: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Initialize Graph Client with access token
   */
  private getGraphClient(accessToken: string): Client {
    return Client.init({
      authProvider: (done: (error: any, token: string | null) => void) => {
        done(null, accessToken);
      },
    });
  }

  /**
   * Normalize gender values to match our enum
   */
  private normalizeGender(gender: string | null | undefined): 'male' | 'female' | 'other' {
    if (!gender) return 'other';
    
    const normalized = gender.toLowerCase().trim();
    if (normalized === 'male' || normalized === 'm') return 'male';
    if (normalized === 'female' || normalized === 'f') return 'female';
    return 'other';
  }

  /**
   * Fetch all users from Azure AD / O365 directory
   * Returns users in format compatible with Respondent model
   */
  async fetchAzureUsers(): Promise<AzureUserDTO[]> {
    log.info('Fetching all users from Azure AD', 'fetchAzureUsers');

    try {
      const accessToken = await this.getAccessToken();
      const client = this.getGraphClient(accessToken);

      // Get users with specific fields matching Respondent model
      const response = await client
        .api('/users')
        .select('id,displayName,mail,userPrincipalName,accountEnabled,employeeId,gender')
        .top(999) // Get up to 999 users per request
        .get();

      if (!response || !response.value) {
        log.warn('No users returned from Azure AD', 'fetchAzureUsers');
        return [];
      }

      // Transform to match Respondent model format
      const transformedUsers: AzureUserDTO[] = response.value
        .filter((user: any) => user.mail || user.userPrincipalName) // Filter out users without email
        .map((user: any) => ({
          azureId: user.id,
          name: user.displayName || 'Unknown',
          mail: (user.mail || user.userPrincipalName || '').toLowerCase(),
          gender: this.normalizeGender(user.gender),
          userPrincipalName: user.userPrincipalName || '',
          accountEnabled: user.accountEnabled !== false, // Default to true if undefined
          employeeId: user.employeeId || user.id, // Fallback to Azure ID if no employeeId
        }));

      log.info('Successfully fetched users from Azure AD', 'fetchAzureUsers', {
        count: transformedUsers.length,
        totalReturned: response.value.length,
      });

      return transformedUsers;
    } catch (error: any) {
      log.error('Error fetching users from Azure AD', 'fetchAzureUsers', {
        error: error.message || 'Unknown error',
        stack: error.stack,
      });
      throw new Error(`Failed to fetch Azure users: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Retrieve single user by Azure ID
   */
  async getAzureUserById(userId: string): Promise<AzureUserDTO> {
    log.info('Fetching user by ID from Azure AD', 'getAzureUserById', { userId });

    if (!userId || userId.trim() === '') {
      log.warn('Invalid user ID provided', 'getAzureUserById', { userId });
      throw new Error('User ID is required');
    }

    try {
      const accessToken = await this.getAccessToken();
      const client = this.getGraphClient(accessToken);

      const user = await client
        .api(`/users/${userId}`)
        .select('id,displayName,mail,userPrincipalName,accountEnabled,employeeId,gender')
        .get();

      if (!user) {
        log.warn('User not found in Azure AD', 'getAzureUserById', { userId });
        throw new Error('User not found');
      }

      // Transform to match Respondent model format
      const transformedUser: AzureUserDTO = {
        azureId: user.id,
        name: user.displayName || 'Unknown',
        mail: (user.mail || user.userPrincipalName || '').toLowerCase(),
        gender: this.normalizeGender(user.gender),
        userPrincipalName: user.userPrincipalName || '',
        accountEnabled: user.accountEnabled !== false,
        employeeId: user.employeeId || user.id,
      };

      log.info('Successfully fetched user from Azure AD', 'getAzureUserById', {
        userId,
        name: transformedUser.name,
      });

      return transformedUser;
    } catch (error: any) {
      log.error('Error fetching user from Azure AD', 'getAzureUserById', {
        userId,
        error: error.message || 'Unknown error',
        statusCode: error.statusCode,
      });

      // Provide more specific error messages
      if (error.statusCode === 404) {
        throw new Error(`User not found in Azure AD: ${userId}`);
      }
      if (error.statusCode === 401 || error.statusCode === 403) {
        throw new Error('Unauthorized to access Azure AD. Check credentials and permissions.');
      }
      
      throw new Error(`Failed to fetch Azure user: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Fetch users with pagination support
   * Useful for large directories
   */
  async fetchAzureUsersPaginated(pageSize = 100, skipToken?: string): Promise<{
    users: AzureUserDTO[];
    nextLink?: string;
    hasMore: boolean;
  }> {
    log.info('Fetching paginated users from Azure AD', 'fetchAzureUsersPaginated', {
      pageSize,
      hasSkipToken: !!skipToken,
    });

    try {
      const accessToken = await this.getAccessToken();
      const client = this.getGraphClient(accessToken);

      let request = client
        .api('/users')
        .select('id,displayName,mail,userPrincipalName,accountEnabled,employeeId,gender')
        .top(pageSize);

      // If skipToken provided, continue from that point
      if (skipToken) {
        request = request.skipToken(skipToken);
      }

      const response = await request.get();

      if (!response || !response.value) {
        log.warn('No users returned from Azure AD', 'fetchAzureUsersPaginated');
        return { users: [], hasMore: false };
      }

      // Transform users
      const transformedUsers: AzureUserDTO[] = response.value
        .filter((user: any) => user.mail || user.userPrincipalName)
        .map((user: any) => ({
          azureId: user.id,
          name: user.displayName || 'Unknown',
          mail: (user.mail || user.userPrincipalName || '').toLowerCase(),
          gender: this.normalizeGender(user.gender),
          userPrincipalName: user.userPrincipalName || '',
          accountEnabled: user.accountEnabled !== false,
          employeeId: user.employeeId || user.id,
        }));

      log.info('Successfully fetched paginated users', 'fetchAzureUsersPaginated', {
        count: transformedUsers.length,
        hasNextLink: !!response['@odata.nextLink'],
      });

      return {
        users: transformedUsers,
        nextLink: response['@odata.nextLink'],
        hasMore: !!response['@odata.nextLink'],
      };
    } catch (error: any) {
      log.error('Error fetching paginated users from Azure AD', 'fetchAzureUsersPaginated', {
        error: error.message || 'Unknown error',
      });
      throw new Error(`Failed to fetch paginated Azure users: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Search for users by query string
   * Searches in displayName, mail, and userPrincipalName
   */
  async searchAzureUsers(query: string): Promise<AzureUserDTO[]> {
    log.info('Searching users in Azure AD', 'searchAzureUsers', { query });

    if (!query || query.trim() === '') {
      log.warn('Empty search query provided', 'searchAzureUsers');
      return [];
    }

    try {
      const accessToken = await this.getAccessToken();
      const client = this.getGraphClient(accessToken);

      // Search using filter (Note: Advanced query requires ConsistencyLevel: eventual header)
      const response = await client
        .api('/users')
        .select('id,displayName,mail,userPrincipalName,accountEnabled,employeeId,gender')
        .filter(
          `startswith(displayName,'${query}') or startswith(mail,'${query}') or startswith(userPrincipalName,'${query}')`
        )
        .top(50)
        .get();

      if (!response || !response.value) {
        log.info('No users found matching query', 'searchAzureUsers', { query });
        return [];
      }

      // Transform users
      const transformedUsers: AzureUserDTO[] = response.value
        .filter((user: any) => user.mail || user.userPrincipalName)
        .map((user: any) => ({
          azureId: user.id,
          name: user.displayName || 'Unknown',
          mail: (user.mail || user.userPrincipalName || '').toLowerCase(),
          gender: this.normalizeGender(user.gender),
          userPrincipalName: user.userPrincipalName || '',
          accountEnabled: user.accountEnabled !== false,
          employeeId: user.employeeId || user.id,
        }));

      log.info('Successfully searched users in Azure AD', 'searchAzureUsers', {
        query,
        count: transformedUsers.length,
      });

      return transformedUsers;
    } catch (error: any) {
      log.error('Error searching users in Azure AD', 'searchAzureUsers', {
        query,
        error: error.message || 'Unknown error',
      });
      throw new Error(`Failed to search Azure users: ${error.message || 'Unknown error'}`);
    }
  }
}

