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
    viewCardSummaries: publicProcedure.query(async () => {
        const [views, viewAccounts, viewStocks, accounts] = await Promise.all([
            listRows<View>(tables.views),
            listRows<ViewAccount>(tables.viewAccounts),
            listRows<ViewStock>(tables.viewStocks),
            listRows<Account>(tables.accounts),
        ]);
        const byViewAccounts = new Map<string, ViewAccount[]>();
        for (const va of viewAccounts) {
            const arr = byViewAccounts.get(va.viewId) ?? [];
            arr.push(va);
            byViewAccounts.set(va.viewId, arr);
        }
        const byViewStocks = new Map<string, ViewStock[]>();
        for (const vs of viewStocks) {
            const arr = byViewStocks.get(vs.viewId) ?? [];
            arr.push(vs);
            byViewStocks.set(vs.viewId, arr);
        }
        const result = views.map((v) => {
            const vas = byViewAccounts.get(v.id) ?? [];
            const accIds = new Set(vas.map((x) => x.accountId));
            const accNames = accounts.filter((a) => accIds.has(a.id)).map((a) => a.name);
            const vsRows = byViewStocks.get(v.id) ?? [];
            const stockNames = new Set(vsRows.map((r) => r.stockName.toLowerCase()));
            const totalCurrent = vsRows.reduce((acc, r) => acc + Number(r.currentValue || '0'), 0);
            const perAccount = Array.from(accIds).map((aid) => {
                const cur = vsRows
                    .filter((r) => r.accountName && accounts.find((a) => a.id === aid)?.name === r.accountName)
                    .reduce((acc, r) => acc + Number(r.currentValue || '0'), 0);
                const pct = totalCurrent ? (cur / totalCurrent) * 100 : 0;
                const accountName = accounts.find((a) => a.id === aid)?.name ?? '';
                return { accountId: aid, accountName, currentValue: cur, sharePercent: Number(pct.toFixed(2)) };
            });
            return {
                viewId: v.id,
                name: v.name,
                updatedAt: v.updatedAt,
                viewSummary: v.viewSummary,
                linkedAccountCount: accIds.size,
                linkedAccountNames: accNames,
                totalUniqueStocks: stockNames.size,
                perAccountShare: perAccount,
            };
        });
        return result;
    }),
    getAnalytics: publicProcedure.input(z.object({ viewId: z.string().uuid() })).query(async ({ input }) => {
        const rows = await listRows<ViewStock>(tables.viewStocks);
        const inView = rows.filter((r) => r.viewId === input.viewId);
        const totalCurrent = inView.reduce((acc, r) => acc + Number(r.currentValue || '0'), 0) || 1;
        const sector = new Map<string, number>();
        const subsector = new Map<string, number>();
        const cap = new Map<string, number>();
        for (const r of inView) {
            const cur = Number(r.currentValue || '0');
            const sk = (r.sector ?? 'Unknown');
            const ssk = (r.subsector ?? 'Unknown');
            const ck = (r as any).capCategory ?? 'UNKNOWN';
            sector.set(sk, (sector.get(sk) ?? 0) + cur);
            subsector.set(ssk, (subsector.get(ssk) ?? 0) + cur);
            cap.set(ck, (cap.get(ck) ?? 0) + cur);
        }
        const toPctArr = (m: Map<string, number>) => Array.from(m.entries()).map(([k, v]) => ({ key: k, value: Number(((v / totalCurrent) * 100).toFixed(2)) })).sort((a, b) => b.value - a.value);
        return {
            sector: toPctArr(sector),
            subsector: toPctArr(subsector),
            cap: toPctArr(cap),
        } as const;
    }),
    newsForView: publicProcedure.input(z.object({ viewId: z.string().uuid() })).query(async ({ input }) => {
        const [viewStocks] = await Promise.all([
            listRows<ViewStock>(tables.viewStocks),
        ]);
        const inView = viewStocks.filter((r) => r.viewId === input.viewId);
        const names = Array.from(new Set(inView.map((r) => r.stockName))).slice(0, 5);
        const apiKey = process.env.NEWS_API_KEY;
        if (!apiKey) {
            return { disabled: true, items: [] as { title: string; url: string; source?: string }[] } as const;
        }
        const items: { title: string; url: string; source?: string }[] = [];
        for (const name of names) {
            try {
                const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(name)}&apiKey=${apiKey}&pageSize=3&sortBy=publishedAt`;
                const res = await fetch(url);
                if (!res.ok) continue;
                const data = await res.json();
                for (const a of data.articles ?? []) {
                    items.push({ title: a.title, url: a.url, source: a.source?.name });
                }
            } catch {}
        }
        return { disabled: false, items } as const;
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


