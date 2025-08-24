import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '@/lib/database';

export const scrapeRouter = router({
	createStartScrape: publicProcedure
		.input(z.object({ name: z.string().min(1), brokerId: z.enum(['groww']) }))
		.mutation(async ({ input }) => {
			try {
				// Create scrape session in database
				const session = await db.createScrapeSession({
					account_name: input.name,
					broker_id: input.brokerId,
					status: 'pending',
					progress: { percent: 0, stage: 'Initializing...' }
				});

				// Check if we're using mock data or have scraping service configured
				const scrapingServiceUrl = process.env.NEXT_PUBLIC_SCRAPING_SERVICE_URL;
				const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || !scrapingServiceUrl;

				if (useMockData) {
					// Simulate scraping process with mock data
					setTimeout(async () => {
						await db.updateScrapeSession(session.id, {
							status: 'running',
							progress: { percent: 50, stage: 'Extracting holdings...' }
						});
						
						setTimeout(async () => {
							await db.updateScrapeSession(session.id, {
								status: 'completed',
								progress: { percent: 100, stage: 'Completed successfully' }
							});
						}, 2000);
					}, 1000);

					return { jobId: session.id } as const;
				}

				// Call Railway scraping service
				const response = await fetch(`${scrapingServiceUrl}/api/scrape/start`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						accountName: input.name,
						brokerId: input.brokerId
					})
				});

				if (!response.ok) {
					const error = await response.text();
					throw new Error(`Scraping service error: ${error}`);
				}

				const result = await response.json();
				
				// Update session with Railway session ID
				await db.updateScrapeSession(session.id, {
					status: 'running',
					progress: { percent: 10, stage: 'Scraping service started' }
				});

				return { jobId: session.id } as const;
			} catch (error) {
				console.error('Failed to start scraping:', error);
				throw error;
			}
		}),

	getScrapeStatus: publicProcedure
		.input(z.object({ jobId: z.string().uuid().or(z.string()) }))
		.query(async ({ input }) => {
			try {
				const session = await db.getScrapeSession(input.jobId);
				if (!session) {
					return { percent: 0, stage: 'not-found' } as const;
				}
				return session.progress;
			} catch (error) {
				console.error('Failed to get scrape status:', error);
				return { percent: 0, stage: 'error' } as const;
			}
		}),

	getScrapePreview: publicProcedure
		.input(z.object({ jobId: z.string() }))
		.query(async ({ input }) => {
			try {
				const session = await db.getScrapeSession(input.jobId);
				if (!session?.preview) {
					return { raw: [], mapped: [] } as const;
				}
				return session.preview;
			} catch (error) {
				console.error('Failed to get scrape preview:', error);
				return { raw: [], mapped: [] } as const;
			}
		}),

	confirmScrape: publicProcedure
		.input(z.object({ jobId: z.string(), accountName: z.string() }))
		.mutation(async ({ input }) => {
			try {
				const session = await db.getScrapeSession(input.jobId);
				if (!session || session.status !== 'completed') {
					throw new Error('Scraping session not completed');
				}

				// Check if account exists
				let account = await db.getAccountByName(input.accountName);
				if (!account) {
					// Create account
					account = await db.createAccount({ name: input.accountName });
				}

				// The scraping service already saved the data to database
				// We just need to update the session status
				await db.updateScrapeSession(input.jobId, {
					status: 'completed',
					progress: { percent: 100, stage: 'Account created successfully' }
				});

				return { success: true, accountId: account.id } as const;
			} catch (error) {
				console.error('Failed to confirm scrape:', error);
				throw error;
			}
		}),

	cancelScrape: publicProcedure
		.input(z.object({ jobId: z.string() }))
		.mutation(async ({ input }) => {
			try {
				// Call Railway scraping service to cancel
				const scrapingServiceUrl = process.env.NEXT_PUBLIC_SCRAPING_SERVICE_URL;
				if (scrapingServiceUrl) {
					await fetch(`${scrapingServiceUrl}/api/scrape/cancel/${input.jobId}`, {
						method: 'POST'
					});
				}

				// Update local session
				await db.updateScrapeSession(input.jobId, {
					status: 'cancelled',
					progress: { percent: 0, stage: 'Cancelled by user' }
				});

				return { success: true } as const;
			} catch (error) {
				console.error('Failed to cancel scrape:', error);
				throw error;
			}
		})
});

export type ScrapeRouter = typeof scrapeRouter;


