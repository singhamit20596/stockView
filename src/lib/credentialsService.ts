import type { DBCredentials, CredentialsFormData } from './types';

// Client-side credentials service using API routes
export class CredentialsService {
  // Get all credentials
  static async getAllCredentials(): Promise<DBCredentials[]> {
    try {
      const response = await fetch('/api/credentials');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
      throw error;
    }
  }

  // Get credentials by account name
  static async getCredentialsByAccount(accountName: string): Promise<DBCredentials | null> {
    try {
      const response = await fetch(`/api/credentials/${encodeURIComponent(accountName)}`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch credentials by account:', error);
      throw error;
    }
  }

  // Create new credentials
  static async createCredentials(credentials: CredentialsFormData): Promise<DBCredentials> {
    try {
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to create credentials:', error);
      throw error;
    }
  }

  // Update existing credentials
  static async updateCredentials(accountName: string, credentials: Partial<CredentialsFormData>): Promise<DBCredentials> {
    try {
      const response = await fetch(`/api/credentials/${encodeURIComponent(accountName)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to update credentials:', error);
      throw error;
    }
  }

  // Delete credentials
  static async deleteCredentials(accountName: string): Promise<void> {
    try {
      const response = await fetch(`/api/credentials/${encodeURIComponent(accountName)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to delete credentials:', error);
      throw error;
    }
  }

  // Check if account name exists
  static async accountExists(accountName: string): Promise<boolean> {
    try {
      const credentials = await this.getCredentialsByAccount(accountName);
      return !!credentials;
    } catch (error) {
      console.error('Failed to check account existence:', error);
      throw error;
    }
  }

  // Get credentials for scraping (converts DB format to Groww format)
  static async getCredentialsForScraping(accountName: string): Promise<{
    username: string;
    password: string;
    pin: string;
  } | null> {
    try {
      const credentials = await this.getCredentialsByAccount(accountName);
      
      if (!credentials) {
        return null;
      }

      return {
        username: credentials.email,
        password: credentials.password,
        pin: credentials.pin,
      };
    } catch (error) {
      console.error('Failed to get credentials for scraping:', error);
      throw error;
    }
  }
}
