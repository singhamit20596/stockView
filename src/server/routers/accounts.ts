import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { listRows, replaceRows } from '@/lib/filedb';
import { tables } from '@/lib/filedb';
import type { Account, Stock } from '@/lib/types';
import { generateId, nowIso } from '@/lib/ids';

export const accountsRouter = router({
	list: publicProcedure.query(async () => {
		return listRows<Account>(tables.accounts);
	}),
	getById: publicProcedure.input(z.object({ accountId: z.string().uuid() })).query(async ({ input }) => {
		const rows = await listRows<Account>(tables.accounts);
		return rows.find((a) => a.id === input.accountId) ?? null;
	}),
	checkNameUnique: publicProcedure.input(z.object({ name: z.string().min(1) })).query(async ({ input }) => {
		const rows = await listRows<Account>(tables.accounts);
		const exists = rows.some((a) => a.name.toLowerCase() === input.name.toLowerCase());
		return { valid: !exists } as const;
	}),
	createEmpty: publicProcedure.input(z.object({ name: z.string().min(1) })).mutation(async ({ input }) => {
		const rows = await listRows<Account>(tables.accounts);
		if (rows.some((a) => a.name.toLowerCase() === input.name.toLowerCase())) {
			throw new Error('Account name already exists');
		}
		const now = nowIso();
		const newAccount: Account = {
			id: generateId(),
			name: input.name,
			investedValue: '0',
			currentValue: '0',
			pnl: '0',
			pnlPercent: '0',
			createdAt: now,
			updatedAt: now,
		};
		await replaceRows<Account>(tables.accounts, [...rows, newAccount]);
		return newAccount;
	}),
	listStocks: publicProcedure.input(z.object({ accountId: z.string().uuid() })).query(async ({ input }) => {
		const rows = await listRows<Stock>(tables.stocks);
		return rows.filter((s) => s.accountId === input.accountId);
	}),
	delete: publicProcedure.input(z.object({ accountId: z.string().uuid() })).mutation(async ({ input }) => {
		const [accounts, stocks] = await Promise.all([
			listRows<Account>(tables.accounts),
			listRows<Stock>(tables.stocks),
		]);
		const nextAccounts = accounts.filter((a) => a.id !== input.accountId);
		const nextStocks = stocks.filter((s) => s.accountId !== input.accountId);
		await Promise.all([
			replaceRows<Account>(tables.accounts, nextAccounts),
			replaceRows<Stock>(tables.stocks, nextStocks),
		]);
		return { ok: true } as const;
	}),
});

export type AccountsRouter = typeof accountsRouter;


