import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '@/lib/database';

export const viewsRouter = router({
	list: publicProcedure.query(async () => {
		try {
			const views = await db.listViews();
			return views;
		} catch (error) {
			console.error('Failed to list views:', error);
			throw error;
		}
	}),

	checkNameUnique: publicProcedure
		.input(z.object({ name: z.string() }))
		.query(async ({ input }) => {
			try {
				const view = await db.getViewByName(input.name);
				return { isUnique: !view };
			} catch (error) {
				console.error('Failed to check view name:', error);
				throw error;
			}
		}),

	create: publicProcedure
		.input(z.object({ 
			name: z.string(),
			accountIds: z.array(z.string())
		}))
		.mutation(async ({ input }) => {
			try {
				// Create view
				const view = await db.createView({ name: input.name });

				// Add accounts to view
				for (const accountId of input.accountIds) {
					await db.addAccountToView(view.id, accountId);
				}

				return view;
			} catch (error) {
				console.error('Failed to create view:', error);
				throw error;
			}
		}),

	delete: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input }) => {
			try {
				await db.deleteView(input.id);
				return { success: true };
			} catch (error) {
				console.error('Failed to delete view:', error);
				throw error;
			}
		}),

	listStocks: publicProcedure
		.input(z.object({ viewId: z.string() }))
		.query(async ({ input }) => {
			try {
				// Get accounts in this view
				const viewAccounts = await db.getViewAccounts(input.viewId);
				const accountIds = viewAccounts.map(va => va.account_id);

				// Get stocks for all accounts
				const allStocks = [];
				for (const accountId of accountIds) {
					const stocks = await db.listStocksByAccount(accountId);
					allStocks.push(...stocks);
				}

				// Aggregate stocks by name
				const stockMap = new Map();
				for (const stock of allStocks) {
					const key = stock.stock_name.toLowerCase();
					if (stockMap.has(key)) {
						const existing = stockMap.get(key);
						existing.quantity += stock.quantity;
						existing.invested_value += stock.invested_value;
						existing.current_value += stock.current_value;
						existing.pnl += stock.pnl;
					} else {
						stockMap.set(key, { ...stock });
					}
				}

				// Calculate aggregated values
				const aggregatedStocks = Array.from(stockMap.values()).map(stock => {
					const avgPrice = stock.invested_value / stock.quantity;
					const pnlPercent = stock.invested_value > 0 
						? (stock.pnl / stock.invested_value) * 100 
						: 0;

					return {
						...stock,
						avg_price: avgPrice,
						pnl_percent: pnlPercent
					};
				});

				return aggregatedStocks;
			} catch (error) {
				console.error('Failed to list view stocks:', error);
				throw error;
			}
		}),

	stockBreakdown: publicProcedure
		.input(z.object({ 
			viewId: z.string(), 
			stockName: z.string() 
		}))
		.query(async ({ input }) => {
			try {
				// Get accounts in this view
				const viewAccounts = await db.getViewAccounts(input.viewId);
				const accountIds = viewAccounts.map(va => va.account_id);

				// Get stocks for the specific stock name across all accounts
				const stockBreakdown = [];
				for (const accountId of accountIds) {
					const stocks = await db.listStocksByAccount(accountId);
					const stock = stocks.find(s => 
						s.stock_name.toLowerCase() === input.stockName.toLowerCase()
					);
					if (stock) {
						stockBreakdown.push(stock);
					}
				}

				return stockBreakdown;
			} catch (error) {
				console.error('Failed to get stock breakdown:', error);
				throw error;
			}
		})
});


