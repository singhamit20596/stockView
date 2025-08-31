export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export interface ScrapeSession {
    id: string;
    account_name: string;
    broker_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: {
        percent: number;
        stage: string;
    };
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
export declare function createScrapeSession(session: Omit<ScrapeSession, 'created_at' | 'updated_at'>): Promise<ScrapeSession>;
export declare function updateScrapeSession(id: string, updates: Partial<ScrapeSession>): Promise<ScrapeSession>;
export declare function getScrapeSession(id: string): Promise<ScrapeSession | null>;
export declare function createAccount(account: {
    name: string;
}): Promise<{
    id: string;
}>;
export declare function createStocks(stocks: Omit<Stock, 'id' | 'created_at' | 'updated_at'>[]): Promise<Stock[]>;
export declare function deleteStocksByAccount(accountId: string): Promise<void>;
export declare function getAccountByName(name: string): Promise<{
    id: string;
} | null>;
export declare function updateAccountSummary(accountId: string): Promise<void>;
//# sourceMappingURL=database.d.ts.map