import { router } from '../trpc';
import { accountsRouter } from './accounts';
import { scrapeRouter } from './scrape';
import { viewsRouter } from './views';

export const appRouter = router({
	accounts: accountsRouter,
	scrape: scrapeRouter,
	views: viewsRouter,
});

export type AppRouter = typeof appRouter;


