import { createClient } from '@supabase/supabase-js';
import type { DBCredentials, CredentialsFormData } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

// Create Supabase client with service role key for server-side operations
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Server-side credentials service for direct database access
export class ServerCredentialsService {
  // Get credentials by account name (server-side)
  static async getCredentialsByAccount(accountName: string): Promise<DBCredentials | null> {
    if (!supabase) {
      throw new Error('Database connection not configured. Please check environment variables.');
    }

    try {
      const { data, error } = await supabase
        .from('credentials')
        .select('*')
        .eq('account_name', accountName)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching credentials:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch credentials by account:', error);
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
