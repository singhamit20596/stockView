import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types
export interface ScrapeSession {
  id: string;
  account_name: string;
  broker_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: { percent: number; stage: string };
  preview?: any;
  error?: string;
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

// Database operations
export async function createScrapeSession(session: Omit<ScrapeSession, 'created_at' | 'updated_at'>): Promise<ScrapeSession> {
  const { data, error } = await supabase
    .from('scrape_sessions')
    .insert(session)
    .select()
    .single();

  if (error) {
    logger.error('Failed to create scrape session', error);
    throw error;
  }

  return data;
}

export async function updateScrapeSession(id: string, updates: Partial<ScrapeSession>): Promise<ScrapeSession> {
  const { data, error } = await supabase
    .from('scrape_sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update scrape session', error);
    throw error;
  }

  return data;
}

export async function getScrapeSession(id: string): Promise<ScrapeSession | null> {
  const { data, error } = await supabase
    .from('scrape_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error('Failed to get scrape session', error);
    throw error;
  }

  return data;
}

export async function createAccount(account: { name: string }): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('accounts')
    .insert(account)
    .select('id')
    .single();

  if (error) {
    logger.error('Failed to create account', error);
    throw error;
  }

  return data;
}

export async function createStocks(stocks: Omit<Stock, 'id' | 'created_at' | 'updated_at'>[]): Promise<Stock[]> {
  const { data, error } = await supabase
    .from('stocks')
    .insert(stocks)
    .select();

  if (error) {
    logger.error('Failed to create stocks', error);
    throw error;
  }

  return data || [];
}

export async function deleteStocksByAccount(accountId: string): Promise<void> {
  const { error } = await supabase
    .from('stocks')
    .delete()
    .eq('account_id', accountId);

  if (error) {
    logger.error('Failed to delete stocks', error);
    throw error;
  }
}

export async function getAccountByName(name: string): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('id')
    .eq('name', name)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error('Failed to get account by name', error);
    throw error;
  }

  return data;
}

export async function updateAccountSummary(accountId: string): Promise<void> {
  // Calculate summary from stocks
  const { data: stocks, error: stocksError } = await supabase
    .from('stocks')
    .select('invested_value, current_value, pnl')
    .eq('account_id', accountId);

  if (stocksError) {
    logger.error('Failed to get stocks for summary', stocksError);
    throw stocksError;
  }

        const summary = stocks?.reduce((acc, stock) => {
        acc.invested_value += stock.invested_value;
        acc.current_value += stock.current_value;
        acc.pnl += stock.pnl;
        return acc;
      }, { invested_value: 0, current_value: 0, pnl: 0, pnl_percent: 0 }) || { invested_value: 0, current_value: 0, pnl: 0, pnl_percent: 0 };

      summary.pnl_percent = summary.invested_value > 0
        ? (summary.pnl / summary.invested_value) * 100
        : 0;

  // Update account
  const { error: updateError } = await supabase
    .from('accounts')
    .update({
      invested_value: summary.invested_value,
      current_value: summary.current_value,
      pnl: summary.pnl,
      pnl_percent: summary.pnl_percent,
      updated_at: new Date().toISOString()
    })
    .eq('id', accountId);

  if (updateError) {
    logger.error('Failed to update account summary', updateError);
    throw updateError;
  }
}
