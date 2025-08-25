import { createClient } from '@supabase/supabase-js';
import { Decimal } from 'decimal.js';
import { mockDb } from './mockData';

// Types
export interface Account {
  id: string;
  name: string;
  invested_value: number;
  current_value: number;
  pnl: number;
  pnl_percent: number;
  created_at: string;
  updated_at: string;
}

export interface Stock {
  id: string;
  account_id: string;
  stock_name: string;
  quantity: number;
  avg_price: number;
  market_price: number;
  invested_value: number;
  current_value: number;
  pnl: number;
  pnl_percent: number;
  sector: string | null;
  subsector: string | null;
  market_cap: string | null;
  created_at: string;
  updated_at: string;
}

export interface View {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ViewAccount {
  view_id: string;
  account_id: string;
}

export interface ScrapeSession {
  id: string;
  account_name: string;
  broker_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: { percent: number; stage: string };
  preview?: any;
  error?: string;
  created_at: string;
  updated_at: string;
}

// Check if Supabase is configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Force use of Supabase if environment variables are set
let useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || !supabaseUrl || !supabaseAnonKey;

// Override to force Supabase usage for production
const forceSupabase = supabaseUrl && supabaseAnonKey && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'false';

// If we have Supabase credentials and explicitly want to use production data, force Supabase
if (forceSupabase) {
  useMockData = false;
}

console.log('[DB CONFIG] Environment check:', {
  supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
  supabaseAnonKey: supabaseAnonKey ? 'SET' : 'NOT SET',
  NEXT_PUBLIC_USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA,
  useMockData
});

// Supabase client (only if configured)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database operations
export const db = {
  // Accounts
  async listAccounts(): Promise<Account[]> {
    if (useMockData && !forceSupabase) {
      return mockDb.listAccounts();
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createAccount(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    if (useMockData) {
      return mockDb.createAccount(account);
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('accounts')
      .insert(account)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    if (useMockData) {
      // Mock implementation
      return { id, ...updates, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Account;
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('accounts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteAccount(id: string): Promise<void> {
    if (useMockData) {
      // Mock implementation - remove from mock data
      return;
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getAccountByName(name: string): Promise<Account | null> {
    if (useMockData) {
      return mockDb.getAccountByName(name);
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('name', name)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  },

  // Stocks
  async listStocksByAccount(accountId: string): Promise<Stock[]> {
    if (useMockData) {
      return mockDb.listStocksByAccount(accountId);
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('account_id', accountId)
      .order('stock_name');
    
    if (error) throw error;
    return data || [];
  },

  async createStocks(stocks: Omit<Stock, 'id' | 'created_at' | 'updated_at'>[]): Promise<Stock[]> {
    if (useMockData) {
      // Mock implementation
      return stocks.map((stock, index) => ({
        ...stock,
        id: String(index + 1),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('stocks')
      .insert(stocks)
      .select();
    
    if (error) throw error;
    return data || [];
  },

  async deleteStocksByAccount(accountId: string): Promise<void> {
    if (useMockData) {
      // Mock implementation
      return;
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('stocks')
      .delete()
      .eq('account_id', accountId);
    
    if (error) throw error;
  },

  async updateStockPrices(accountId: string, stockUpdates: { stock_name: string; market_price: number }[]): Promise<void> {
    if (useMockData) {
      // Mock implementation
      return;
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    for (const update of stockUpdates) {
      const { error } = await supabase
        .from('stocks')
        .update({ 
          market_price: update.market_price,
          updated_at: new Date().toISOString()
        })
        .eq('account_id', accountId)
        .eq('stock_name', update.stock_name);
      
      if (error) throw error;
    }
  },

  // Views
  async listViews(): Promise<View[]> {
    if (useMockData) {
      return mockDb.listViews();
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('views')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createView(view: Omit<View, 'id' | 'created_at' | 'updated_at'>): Promise<View> {
    if (useMockData) {
      return mockDb.createView(view);
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('views')
      .insert(view)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteView(id: string): Promise<void> {
    if (useMockData) {
      // Mock implementation
      return;
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('views')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getViewByName(name: string): Promise<View | null> {
    if (useMockData) {
      return mockDb.getViewByName(name);
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('views')
      .select('*')
      .eq('name', name)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // View Accounts
  async addAccountToView(viewId: string, accountId: string): Promise<void> {
    if (useMockData) {
      // Mock implementation
      return;
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('view_accounts')
      .insert({ view_id: viewId, account_id: accountId });
    
    if (error) throw error;
  },

  async removeAccountFromView(viewId: string, accountId: string): Promise<void> {
    if (useMockData) {
      // Mock implementation
      return;
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('view_accounts')
      .delete()
      .eq('view_id', viewId)
      .eq('account_id', accountId);
    
    if (error) throw error;
  },

  async getViewAccounts(viewId: string): Promise<ViewAccount[]> {
    if (useMockData) {
      // Mock implementation - return empty array for now
      return [];
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('view_accounts')
      .select('*')
      .eq('view_id', viewId);
    
    if (error) throw error;
    return data || [];
  },

  // Scrape Sessions
  async createScrapeSession(session: Omit<ScrapeSession, 'id' | 'created_at' | 'updated_at'>): Promise<ScrapeSession> {
    if (useMockData) {
      return mockDb.createScrapeSession(session);
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('scrape_sessions')
      .insert(session)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateScrapeSession(id: string, updates: Partial<ScrapeSession>): Promise<ScrapeSession> {
    if (useMockData) {
      return mockDb.updateScrapeSession(id, updates);
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('scrape_sessions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getScrapeSession(id: string): Promise<ScrapeSession | null> {
    if (useMockData) {
      return mockDb.getScrapeSession(id);
    }
    
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('scrape_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Utility functions
  async calculateAccountSummary(accountId: string): Promise<{ invested_value: number; current_value: number; pnl: number; pnl_percent: number }> {
    const stocks = await this.listStocksByAccount(accountId);
    
    const summary = stocks.reduce((acc, stock) => {
      acc.invested_value += stock.invested_value;
      acc.current_value += stock.current_value;
      acc.pnl += stock.pnl;
      return acc;
    }, { invested_value: 0, current_value: 0, pnl: 0, pnl_percent: 0 });
    
    summary.pnl_percent = summary.invested_value > 0 
      ? (summary.pnl / summary.invested_value) * 100 
      : 0;
    
    return summary;
  },

  async updateAccountSummary(accountId: string): Promise<void> {
    const summary = await this.calculateAccountSummary(accountId);
    await this.updateAccount(accountId, summary);
  }
};

// Helper function to convert Decimal.js to number for Supabase
export function decimalToNumber(decimal: Decimal): number {
  return parseFloat(decimal.toFixed(2));
}

// Helper function to convert number to Decimal.js
export function numberToDecimal(num: number): Decimal {
  return new Decimal(num);
}
