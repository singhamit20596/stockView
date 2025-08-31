"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
exports.createScrapeSession = createScrapeSession;
exports.updateScrapeSession = updateScrapeSession;
exports.getScrapeSession = getScrapeSession;
exports.createAccount = createAccount;
exports.createStocks = createStocks;
exports.deleteStocksByAccount = deleteStocksByAccount;
exports.getAccountByName = getAccountByName;
exports.updateAccountSummary = updateAccountSummary;
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = require("../utils/logger");
// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
// Database operations
async function createScrapeSession(session) {
    logger_1.logger.info('💾 SUPABASE: Creating scrape session', {
        service: 'SUPABASE_DB',
        stage: 'CREATE_SESSION',
        flow: 'DATABASE_OPERATION',
        sessionId: session.id,
        accountName: session.account_name
    });
    const { data, error } = await exports.supabase
        .from('scrape_sessions')
        .insert(session)
        .select()
        .single();
    if (error) {
        logger_1.logger.error('💥 SUPABASE: Failed to create scrape session', {
            service: 'SUPABASE_DB',
            stage: 'CREATE_SESSION_ERROR',
            flow: 'DATABASE_OPERATION',
            sessionId: session.id,
            error
        });
        throw error;
    }
    logger_1.logger.info('✅ SUPABASE: Scrape session created successfully', {
        service: 'SUPABASE_DB',
        stage: 'CREATE_SESSION_SUCCESS',
        flow: 'DATABASE_OPERATION',
        sessionId: session.id
    });
    return data;
}
async function updateScrapeSession(id, updates) {
    logger_1.logger.info('💾 SUPABASE: Updating scrape session', {
        service: 'SUPABASE_DB',
        stage: 'UPDATE_SESSION',
        flow: 'DATABASE_OPERATION',
        sessionId: id,
        updates
    });
    const { data, error } = await exports.supabase
        .from('scrape_sessions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) {
        logger_1.logger.error('💥 SUPABASE: Failed to update scrape session', {
            service: 'SUPABASE_DB',
            stage: 'UPDATE_SESSION_ERROR',
            flow: 'DATABASE_OPERATION',
            sessionId: id,
            error
        });
        throw error;
    }
    logger_1.logger.info('✅ SUPABASE: Scrape session updated successfully', {
        service: 'SUPABASE_DB',
        stage: 'UPDATE_SESSION_SUCCESS',
        flow: 'DATABASE_OPERATION',
        sessionId: id
    });
    return data;
}
async function getScrapeSession(id) {
    const { data, error } = await exports.supabase
        .from('scrape_sessions')
        .select('*')
        .eq('id', id)
        .single();
    if (error && error.code !== 'PGRST116') {
        logger_1.logger.error('Failed to get scrape session', error);
        throw error;
    }
    return data;
}
async function createAccount(account) {
    const { data, error } = await exports.supabase
        .from('accounts')
        .insert(account)
        .select('id')
        .single();
    if (error) {
        logger_1.logger.error('Failed to create account', error);
        throw error;
    }
    return data;
}
async function createStocks(stocks) {
    const { data, error } = await exports.supabase
        .from('stocks')
        .insert(stocks)
        .select();
    if (error) {
        logger_1.logger.error('Failed to create stocks', error);
        throw error;
    }
    return data || [];
}
async function deleteStocksByAccount(accountId) {
    const { error } = await exports.supabase
        .from('stocks')
        .delete()
        .eq('account_id', accountId);
    if (error) {
        logger_1.logger.error('Failed to delete stocks', error);
        throw error;
    }
}
async function getAccountByName(name) {
    const { data, error } = await exports.supabase
        .from('accounts')
        .select('id')
        .eq('name', name)
        .single();
    if (error && error.code !== 'PGRST116') {
        logger_1.logger.error('Failed to get account by name', error);
        throw error;
    }
    return data;
}
async function updateAccountSummary(accountId) {
    // Calculate summary from stocks
    const { data: stocks, error: stocksError } = await exports.supabase
        .from('stocks')
        .select('invested_value, current_value, pnl')
        .eq('account_id', accountId);
    if (stocksError) {
        logger_1.logger.error('Failed to get stocks for summary', stocksError);
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
    const { error: updateError } = await exports.supabase
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
        logger_1.logger.error('Failed to update account summary', updateError);
        throw updateError;
    }
}
//# sourceMappingURL=database.js.map