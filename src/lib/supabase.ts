import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          name: string;
          invested_value: number;
          current_value: number;
          pnl: number;
          pnl_percent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invested_value?: number;
          current_value?: number;
          pnl?: number;
          pnl_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invested_value?: number;
          current_value?: number;
          pnl?: number;
          pnl_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      stocks: {
        Row: {
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
        };
        Insert: {
          id?: string;
          account_id: string;
          stock_name: string;
          quantity: number;
          avg_price: number;
          market_price: number;
          invested_value: number;
          current_value: number;
          pnl: number;
          pnl_percent: number;
          sector?: string | null;
          subsector?: string | null;
          market_cap?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          stock_name?: string;
          quantity?: number;
          avg_price?: number;
          market_price?: number;
          invested_value?: number;
          current_value?: number;
          pnl?: number;
          pnl_percent?: number;
          sector?: string | null;
          subsector?: string | null;
          market_cap?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      views: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      view_accounts: {
        Row: {
          view_id: string;
          account_id: string;
        };
        Insert: {
          view_id: string;
          account_id: string;
        };
        Update: {
          view_id?: string;
          account_id?: string;
        };
      };
    };
  };
}

// Helper functions
export const db = {
  accounts: {
    async list() {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async create(account: Database['public']['Tables']['accounts']['Insert']) {
      const { data, error } = await supabase
        .from('accounts')
        .insert(account)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Database['public']['Tables']['accounts']['Update']) {
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    }
  },

  stocks: {
    async listByAccount(accountId: string) {
      const { data, error } = await supabase
        .from('stocks')
        .select('*')
        .eq('account_id', accountId)
        .order('stock_name');
      
      if (error) throw error;
      return data;
    },

    async createMany(stocks: Database['public']['Tables']['stocks']['Insert'][]) {
      const { data, error } = await supabase
        .from('stocks')
        .insert(stocks)
        .select();
      
      if (error) throw error;
      return data;
    },

    async deleteByAccount(accountId: string) {
      const { error } = await supabase
        .from('stocks')
        .delete()
        .eq('account_id', accountId);
      
      if (error) throw error;
    }
  },

  views: {
    async list() {
      const { data, error } = await supabase
        .from('views')
        .select(`
          *,
          view_accounts (
            account_id,
            accounts (*)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async create(view: Database['public']['Tables']['views']['Insert']) {
      const { data, error } = await supabase
        .from('views')
        .insert(view)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('views')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    }
  }
};
