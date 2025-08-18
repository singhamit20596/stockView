import Decimal from 'decimal.js';
import { D, toString, safeDivide } from './decimal';
import type { Stock, ViewStock, ViewSummary } from './types';

export function computeStockDerivedFields(input: { quantity: string; avgPrice?: string | null; marketPrice?: string | null }) {
	const quantity = D(input.quantity || '0');
	const avgPrice = D(input.avgPrice || '0');
	const marketPrice = D(input.marketPrice || '0');
	const invested = quantity.mul(avgPrice);
	const current = quantity.mul(marketPrice);
	const pnl = current.sub(invested);
	const pnlPct = safeDivide(pnl, invested).mul(100);
	return {
		investedValue: toString(invested),
		currentValue: toString(current),
		pnl: toString(pnl),
		pnlPercent: toString(pnlPct),
	};
}

export function summarizeStocks(stocks: Pick<Stock, 'investedValue' | 'currentValue' | 'quantity'>[]): ViewSummary {
	const totalInvested = stocks.reduce((acc, s) => acc.add(D(s.investedValue)), new Decimal(0));
	const totalCurrent = stocks.reduce((acc, s) => acc.add(D(s.currentValue)), new Decimal(0));
	const totalQty = stocks.reduce((acc, s) => acc.add(D(s.quantity)), new Decimal(0));
	const totalPnl = totalCurrent.sub(totalInvested);
	const totalPnlPct = safeDivide(totalPnl, totalInvested).mul(100);
	return {
		totalInvestedValue: toString(totalInvested),
		totalCurrentValue: toString(totalCurrent),
		totalQuantity: toString(totalQty),
		totalPnl: toString(totalPnl),
		totalPnlPercent: toString(totalPnlPct),
	};
}

export function aggregateStocksForView(input: { stocks: Stock[]; pickLatestByUpdatedAt?: boolean }): Omit<ViewStock, 'id' | 'viewId' | 'updatedAt'>[] {
    const groups = new Map<string, Stock[]>();
    for (const s of input.stocks) {
        const key = s.stockName;
        const arr = groups.get(key) ?? [];
        arr.push(s);
        groups.set(key, arr);
    }
    const result: Omit<ViewStock, 'id' | 'viewId' | 'updatedAt'>[] = [];
    for (const [stockName, rows] of groups) {
        const totalQty = rows.reduce((acc, r) => acc.add(D(r.quantity)), new Decimal(0));
        const weightedAvg = rows.reduce((acc, r) => acc.add(D(r.avgPrice).mul(D(r.quantity))), new Decimal(0));
        const avgPrice = totalQty.eq(0) ? new Decimal(0) : weightedAvg.div(totalQty);
        // Choose latest for marketPrice/sector/subsector
        const latest = rows.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] ?? rows[0];
        const marketPrice = D(latest.marketPrice);
        const invested = totalQty.mul(avgPrice);
        const current = totalQty.mul(marketPrice);
        const pnl = current.sub(invested);
        const pnlPct = safeDivide(pnl, invested).mul(100);
        result.push({
            accountName: latest.accountName,
            stockName,
            avgPrice: toString(avgPrice),
            marketPrice: toString(marketPrice),
            investedValue: toString(invested),
            currentValue: toString(current),
            pnl: toString(pnl),
            pnlPercent: toString(pnlPct),
            quantity: toString(totalQty),
            sector: latest.sector ?? null,
            subsector: latest.subsector ?? null,
        });
    }
    return result;
}


