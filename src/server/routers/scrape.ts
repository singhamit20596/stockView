import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { enqueueJob, registerScrapeHandler } from '@/server/jobRunner';
import { listRows, replaceRows, tables } from '@/lib/filedb';
import type { Account, ScrapeSession, Stock, View, ViewAccount, ViewStock } from '@/lib/types';
import { generateId, nowIso } from '@/lib/ids';
import { aggregateStocksForView, summarizeStocks } from '@/lib/compute';
import { inferSectorSubsector } from '@/lib/sectorMap';

// Ensure handler is registered at import time
registerScrapeHandler();

export const scrapeRouter = router({
	createStartScrape: publicProcedure
		.input(z.object({ name: z.string().min(1), brokerId: z.enum(['groww']) }))
		.mutation(async ({ input }) => {
			const jobId = await enqueueJob('SCRAPE_ACCOUNT', { accountName: input.name, brokerId: input.brokerId });
			return { jobId } as const;
		}),
	getScrapeStatus: publicProcedure.input(z.object({ jobId: z.string().uuid().or(z.string()) })).query(async ({ input }) => {
		const sessions = await listRows<ScrapeSession>(tables.scrapeSessions);
		const session = sessions.find((s) => s.id === input.jobId);
		if (!session) return { percent: 0, stage: 'not-found' } as const;
		return session.progress;
	}),
	getScrapePreview: publicProcedure.input(z.object({ jobId: z.string() })).query(async ({ input }) => {
		const sessions = await listRows<ScrapeSession>(tables.scrapeSessions);
		const session = sessions.find((s) => s.id === input.jobId);
		if (!session?.preview) return { raw: [], mapped: [] } as const;
		return session.preview;
	}),
	confirmScrape: publicProcedure.input(z.object({ jobId: z.string() })).mutation(async ({ input }) => {
		const sessions = await listRows<ScrapeSession>(tables.scrapeSessions);
		const session = sessions.find((s) => s.id === input.jobId);
		if (!session || !session.preview) throw new Error('Invalid session');
		const now = nowIso();
		// Create or find account by name
		const accounts = await listRows<Account>(tables.accounts);
		const existingAccount = accounts.find((a) => a.name.toLowerCase() === session.accountName.toLowerCase());
		const account: Account = existingAccount ?? {
			id: generateId(),
			name: session.accountName,
			investedValue: '0',
			currentValue: '0',
			pnl: '0',
			pnlPercent: '0',
			createdAt: now,
			updatedAt: now,
		};
		const accountId = account.id;
		// Upsert stocks by (accountId + stockName); drop removed
		const allStocks = await listRows<Stock>(tables.stocks);
		const withoutThisAccount = allStocks.filter((s) => s.accountId !== accountId);
		const existingForAccount = allStocks.filter((s) => s.accountId === accountId);
		const byName = new Map(existingForAccount.map((s) => [s.stockName.toLowerCase(), s] as const));
		const upsertedForAccount: Stock[] = session.preview.mapped.map((m) => {
			const prior = byName.get(m.stockName.toLowerCase());
			const createdAt = prior?.createdAt ?? m.createdAt ?? now;
			const inferred = inferSectorSubsector(m.stockName);
			return {
				id: prior?.id ?? generateId(),
				accountId,
				accountName: account.name,
				stockName: m.stockName,
				avgPrice: m.avgPrice,
				marketPrice: m.marketPrice,
				investedValue: m.investedValue,
				currentValue: m.currentValue,
				pnl: m.pnl,
				pnlPercent: m.pnlPercent,
				quantity: m.quantity,
				sector: m.sector ?? inferred?.sector ?? null,
				subsector: m.subsector ?? inferred?.subsector ?? null,
				capCategory: m.capCategory ?? null,
				createdAt,
				updatedAt: now,
			} as Stock;
		});
		const nextAllStocks: Stock[] = [...withoutThisAccount, ...upsertedForAccount];
		await replaceRows<Stock>(tables.stocks, nextAllStocks);
		// Recompute account summary
		const sum = summarizeStocks(upsertedForAccount);
		const updatedAccount: Account = {
			...account,
			investedValue: sum.totalInvestedValue,
			currentValue: sum.totalCurrentValue,
			pnl: sum.totalPnl,
			pnlPercent: sum.totalPnlPercent,
			updatedAt: now,
		};
		const nextAccounts = accounts.some((a) => a.id === accountId)
			? accounts.map((a) => (a.id === accountId ? updatedAccount : a))
			: [...accounts, updatedAccount];
		await replaceRows<Account>(tables.accounts, nextAccounts);
		// Refresh affected views
		const [views, viewAccounts, viewStocks] = await Promise.all([
			listRows<View>(tables.views as string),
			listRows<ViewAccount>(tables.viewAccounts as string),
			listRows<ViewStock>(tables.viewStocks as string),
		]);
		const affectedViewIds = new Set(
			viewAccounts
				.filter((va) => va.accountId === accountId)
				.map((va) => va.viewId)
		);
		if (affectedViewIds.size > 0) {
			const allStocksNow = await listRows<Stock>(tables.stocks);
			let nextVS: ViewStock[] = viewStocks;
			let nextViews: View[] = views;
			for (const viewId of affectedViewIds) {
				const accIds = viewAccounts
					.filter((va) => va.viewId === viewId)
					.map((va) => va.accountId);
				const selected = allStocksNow.filter((s) => accIds.includes(s.accountId));
				const aggregated = aggregateStocksForView({ stocks: selected });
				nextVS = nextVS.filter((vs) => vs.viewId !== viewId);
				const newRows: ViewStock[] = aggregated.map((a) => ({
					id: generateId(), viewId,
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
				nextVS = [...nextVS, ...newRows];
				const summary = summarizeStocks(newRows as unknown as Pick<Stock, 'investedValue' | 'currentValue' | 'quantity'>[]);
				nextViews = nextViews.map((v) => (v.id === viewId ? { ...v, viewSummary: summary, updatedAt: now } : v));
			}
			await Promise.all([
				replaceRows<ViewStock>(tables.viewStocks as string, nextVS),
				replaceRows<View>(tables.views as string, nextViews),
			]);
		}
		// Finalize session
		const nextSessions: ScrapeSession[] = sessions.map((s) => (s.id === input.jobId ? { ...s, status: 'confirmed', progress: { percent: 100, stage: 'persisted - 100%' }, updatedAt: now } : s));
		await replaceRows<ScrapeSession>(tables.scrapeSessions, nextSessions);
		return updatedAccount;
	}),
});

export type ScrapeRouter = typeof scrapeRouter;


