import { z } from 'zod';

export const accountNameSchema = z.string().min(1).max(100);

export const startScrapeSchema = z.object({
	name: accountNameSchema,
	brokerId: z.enum(['groww']),
});

export const updateStartScrapeSchema = z.object({
	accountId: z.string().uuid(),
});


