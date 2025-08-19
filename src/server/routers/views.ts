import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { listRows, replaceRows, tables } from '@/lib/filedb';
import type { Account, View, ViewAccount, ViewStock, Stock } from '@/lib/types';
import { aggregateStocksForView, summarizeStocks } from '@/lib/compute';
import { generateId, nowIso } from '@/lib/ids';

export const viewsRouter = router({
    list: publicProcedure.query(async () => {
        return listRows<View>(tables.views);
    }),
    stockBreakdown: publicProcedure.input(z.object({ viewId: z.string().uuid(), stockName: z.string().min(1) })).query(async ({ input }) => {
        const [viewAccounts, accounts, stocks] = await Promise.all([
            listRows<ViewAccount>(tables.viewAccounts),
            listRows<Account>(tables.accounts),
            listRows<Stock>(tables.stocks),
        ]);
        const linked = viewAccounts.filter((va) => va.viewId === input.viewId).map((va) => va.accountId);
        const linkedSet = new Set(linked);
        const accountList = accounts.filter((a) => linkedSet.has(a.id));
        const nameLc = input.stockName.toLowerCase();
        const stockRows = stocks.filter((s) => linkedSet.has(s.accountId) && s.stockName.toLowerCase() === nameLc);
        const totalCurrent = stockRows.reduce((acc, s) => acc + Number(s.currentValue || '0'), 0);
        const result = accountList.map((a) => {
            const row = stockRows.find((s) => s.accountId === a.id);
            const quantity = row?.quantity ?? '0';
            const investedValue = row?.investedValue ?? '0';
            const currentValue = row?.currentValue ?? '0';
            const sharePct = totalCurrent ? (Number(currentValue) / totalCurrent) * 100 : 0;
            return {
                accountId: a.id,
                accountName: a.name,
                quantity,
                investedValue,
                currentValue,
                sharePercent: sharePct.toFixed(2),
            };
        });
        return result;
    }),
    uniqueStockCount: publicProcedure.query(async () => {
        const rows = await listRows<ViewStock>(tables.viewStocks);
        const byView = new Map<string, Set<string>>();
        for (const r of rows) {
            if (!byView.has(r.viewId)) byView.set(r.viewId, new Set());
            byView.get(r.viewId)!.add(r.stockName.toLowerCase());
        }
        return Object.fromEntries(Array.from(byView.entries()).map(([k, set]) => [k, set.size]));
    }),
    getById: publicProcedure.input(z.object({ viewId: z.string().uuid() })).query(async ({ input }) => {
        const rows = await listRows<View>(tables.views);
        return rows.find((v) => v.id === input.viewId) ?? null;
    }),
    checkNameUnique: publicProcedure.input(z.object({ name: z.string().min(1) })).query(async ({ input }) => {
        const rows = await listRows<View>(tables.views);
        const exists = rows.some((v) => v.name.toLowerCase() === input.name.toLowerCase());
        return { valid: !exists } as const;
    }),
    create: publicProcedure.input(z.object({
        name: z.string().min(1),
        accountIds: z.array(z.string().uuid()).min(1),
    })).mutation(async ({ input }) => {
        const [views, viewAccounts, viewStocks, accounts, stocks] = await Promise.all([
            listRows<View>(tables.views),
            listRows<ViewAccount>(tables.viewAccounts),
            listRows<ViewStock>(tables.viewStocks),
            listRows<Account>(tables.accounts),
            listRows<Stock>(tables.stocks),
        ]);
        if (views.some((v) => v.name.toLowerCase() === input.name.toLowerCase())) {
            throw new Error('View name already exists');
        }
        const now = nowIso();
        const selectedAccounts = accounts.filter((a) => input.accountIds.includes(a.id));
        const selectedStocks = stocks.filter((s) => input.accountIds.includes(s.accountId));
        const aggregated = aggregateStocksForView({ stocks: selectedStocks });
        const viewId = generateId();
        const nextViewStocks: ViewStock[] = aggregated.map((a) => ({
            id: generateId(),
            viewId,
            accountName: a.accountName,
            stockName: a.stockName,
            avgPrice: a.avgPrice,
            marketPrice: a.marketPrice,
            investedValue: a.investedValue,
            currentValue: a.currentValue,
            pnl: a.pnl,
            pnlPercent: a.pnlPercent,
            quantity: a.quantity,
            sector: a.sector ?? null,
            subsector: a.subsector ?? null,
            updatedAt: now,
        }));
        const viewSummary = summarizeStocks(nextViewStocks);
        const newView: View = {
            id: viewId,
            name: input.name,
            viewSummary,
            createdAt: now,
            updatedAt: now,
        } as View;
        const nextViewAccounts: ViewAccount[] = selectedAccounts.map((a) => ({ id: generateId(), viewId, accountId: a.id }));
        await Promise.all([
            replaceRows<View>(tables.views, [...views, newView]),
            replaceRows<ViewAccount>(tables.viewAccounts, [...viewAccounts, ...nextViewAccounts]),
            replaceRows<ViewStock>(tables.viewStocks, [...viewStocks, ...nextViewStocks]),
        ]);
        return newView;
    }),
    listStocks: publicProcedure.input(z.object({ viewId: z.string().uuid() })).query(async ({ input }) => {
        const rows = await listRows<ViewStock>(tables.viewStocks);
        return rows.filter((vs) => vs.viewId === input.viewId);
    }),
    delete: publicProcedure.input(z.object({ viewId: z.string().uuid() })).mutation(async ({ input }) => {
        const [views, viewAccounts, viewStocks] = await Promise.all([
            listRows<View>(tables.views),
            listRows<ViewAccount>(tables.viewAccounts),
            listRows<ViewStock>(tables.viewStocks),
        ]);
        const nextViews = views.filter((v) => v.id !== input.viewId);
        const nextViewAccounts = viewAccounts.filter((va) => va.viewId !== input.viewId);
        const nextViewStocks = viewStocks.filter((vs) => vs.viewId !== input.viewId);
        await Promise.all([
            replaceRows<View>(tables.views, nextViews),
            replaceRows<ViewAccount>(tables.viewAccounts, nextViewAccounts),
            replaceRows<ViewStock>(tables.viewStocks, nextViewStocks),
        ]);
        return { ok: true } as const;
    }),
});

export type ViewsRouter = typeof viewsRouter;


