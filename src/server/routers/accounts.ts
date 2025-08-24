import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '@/lib/database';

export const accountsRouter = router({
	list: publicProcedure.query(async () => {
		try {
			const accounts = await db.listAccounts();
			return accounts;
		} catch (error) {
			console.error('Failed to list accounts:', error);
			throw error;
		}
	}),

	checkNameUnique: publicProcedure
		.input(z.object({ name: z.string() }))
		.query(async ({ input }) => {
			try {
				const account = await db.getAccountByName(input.name);
				return { isUnique: !account };
			} catch (error) {
				console.error('Failed to check account name:', error);
				throw error;
			}
		}),

	stocksCountByAccount: publicProcedure.query(async () => {
		try {
			const accounts = await db.listAccounts();
			const counts = await Promise.all(
				accounts.map(async (account) => {
					const stocks = await db.listStocksByAccount(account.id);
					return {
						accountId: account.id,
						count: stocks.length
					};
				})
			);
			
			// Convert array to object for easier frontend consumption
			const countsObject: Record<string, number> = {};
			counts.forEach(({ accountId, count }) => {
				countsObject[accountId] = count;
			});
			
			return countsObject;
		} catch (error) {
			console.error('Failed to get stocks count by account:', error);
			throw error;
		}
	}),

			listStocks: publicProcedure
		.input(z.object({ accountId: z.string() }))
		.query(async ({ input }) => {
			try {
				const stocks = await db.listStocksByAccount(input.accountId);
				return stocks;
			} catch (error) {
				console.error('Failed to list stocks by account:', error);
				throw error;
			}
		}),

		delete: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input }) => {
			try {
				await db.deleteAccount(input.id);
				return { success: true };
			} catch (error) {
				console.error('Failed to delete account:', error);
				throw error;
			}
		}),

		update: publicProcedure
		.input(z.object({ 
			id: z.string(), 
			updates: z.object({
				name: z.string().optional(),
				invested_value: z.number().optional(),
				current_value: z.number().optional(),
				pnl: z.number().optional(),
				pnl_percent: z.number().optional()
			})
		}))
		.mutation(async ({ input }) => {
			try {
				const updatedAccount = await db.updateAccount(input.id, input.updates);
				return updatedAccount;
			} catch (error) {
				console.error('Failed to update account:', error);
				throw error;
			}
		})
});


