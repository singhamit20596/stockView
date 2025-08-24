import { Account, Stock, View } from './database';

// Mock data for development
export const mockAccounts: Account[] = [
  {
    id: '1',
    name: 'Demo Account 1',
    invested_value: 100000,
    current_value: 105000,
    pnl: 5000,
    pnl_percent: 5.0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Demo Account 2',
    invested_value: 75000,
    current_value: 78000,
    pnl: 3000,
    pnl_percent: 4.0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockStocks: Stock[] = [
  {
    id: '1',
    account_id: '1',
    stock_name: 'HDFC Bank',
    quantity: 100,
    avg_price: 1500,
    market_price: 1575,
    invested_value: 150000,
    current_value: 157500,
    pnl: 7500,
    pnl_percent: 5.0,
    sector: 'Banking',
    subsector: 'Private Banks',
    market_cap: 'Large',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    account_id: '1',
    stock_name: 'TCS',
    quantity: 50,
    avg_price: 3200,
    market_price: 3360,
    invested_value: 160000,
    current_value: 168000,
    pnl: 8000,
    pnl_percent: 5.0,
    sector: 'Technology',
    subsector: 'IT Services',
    market_cap: 'Large',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    account_id: '2',
    stock_name: 'Reliance Industries',
    quantity: 75,
    avg_price: 2000,
    market_price: 2080,
    invested_value: 150000,
    current_value: 156000,
    pnl: 6000,
    pnl_percent: 4.0,
    sector: 'Oil & Gas',
    subsector: 'Refineries',
    market_cap: 'Large',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockViews: View[] = [
  {
    id: '1',
    name: 'Portfolio View',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Mock database functions
export const mockDb = {
  async listAccounts(): Promise<Account[]> {
    return mockAccounts;
  },

  async getAccountByName(name: string): Promise<Account | null> {
    return mockAccounts.find(a => a.name.toLowerCase() === name.toLowerCase()) || null;
  },

  async createAccount(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    const newAccount: Account = {
      ...account,
      id: String(mockAccounts.length + 1),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockAccounts.push(newAccount);
    return newAccount;
  },

  async listStocksByAccount(accountId: string): Promise<Stock[]> {
    return mockStocks.filter(s => s.account_id === accountId);
  },

  async listViews(): Promise<View[]> {
    return mockViews;
  },

  async getViewByName(name: string): Promise<View | null> {
    return mockViews.find(v => v.name.toLowerCase() === name.toLowerCase()) || null;
  },

  async createView(view: Omit<View, 'id' | 'created_at' | 'updated_at'>): Promise<View> {
    const newView: View = {
      ...view,
      id: String(mockViews.length + 1),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockViews.push(newView);
    return newView;
  },

  async createScrapeSession(session: any): Promise<any> {
    return {
      id: 'mock-session-id',
      ...session,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  async updateScrapeSession(id: string, updates: any): Promise<any> {
    return {
      id,
      ...updates,
      updated_at: new Date().toISOString()
    };
  },

  async getScrapeSession(id: string): Promise<any> {
    return {
      id,
      status: 'completed',
      progress: { percent: 100, stage: 'Completed' },
      preview: {
        raw: mockStocks,
        processed: mockStocks
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};
