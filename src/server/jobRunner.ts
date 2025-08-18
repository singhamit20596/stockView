import { generateId, nowIso } from '@/lib/ids';
import { tables, listRows, replaceRows } from '@/lib/filedb';
import type { RawHolding, ScrapePreview, ScrapeSession, Stock } from '@/lib/types';
import { computeStockDerivedFields } from '@/lib/compute';
import { scrapeGrowwHoldingsLive } from './brokers/groww';

type ScrapePayload = { jobId: string; accountName: string; brokerId: string };
type JobHandler = (payload: ScrapePayload) => Promise<void>;

const handlers: Record<string, JobHandler> = {};

export function registerJob(type: 'SCRAPE_ACCOUNT', handler: JobHandler) {
	handlers[type] = handler;
}

export async function enqueueJob(type: 'SCRAPE_ACCOUNT', payload: { accountName: string; brokerId: string }): Promise<string> {
	const jobId = generateId();
	if (type === 'SCRAPE_ACCOUNT') {
		const { accountName } = payload;
		const sessions = await listRows<ScrapeSession>(tables.scrapeSessions);
		const now = nowIso();
		const session: ScrapeSession = {
			id: jobId,
			accountName,
			brokerId: payload.brokerId,
			status: 'pending',
			progress: { percent: 0, stage: 'queued' },
			createdAt: now,
			updatedAt: now,
		};
		await replaceRows<ScrapeSession>(tables.scrapeSessions, [...sessions, session]);
	}
	// Fire and forget in background
	setTimeout(async () => {
		const handler = handlers[type];
		if (!handler) return;
		await handler({ jobId, accountName: payload.accountName, brokerId: payload.brokerId });
	}, 0);
	return jobId;
}

async function updateSession(jobId: string, patch: Partial<ScrapeSession>) {
	console.log(`[seqA][scrape] update ${jobId}:`, patch.progress?.stage || patch.status || 'patch');
	const sessions = await listRows<ScrapeSession>(tables.scrapeSessions);
	const next = sessions.map((s) => (s.id === jobId ? { ...s, ...patch, updatedAt: nowIso() } : s));
	await replaceRows<ScrapeSession>(tables.scrapeSessions, next);
}

export function registerScrapeHandler() {
	registerJob('SCRAPE_ACCOUNT', async ({ jobId, accountName }: ScrapePayload) => {
		try {
			console.log('[seqB][scrape] starting job', jobId, 'for', accountName);
			await updateSession(jobId, { status: 'running', progress: { percent: 5, stage: 'starting scrape' } });
			const mode = process.env.SCRAPE_MODE || 'mock';
			console.log('[seqC][scrape] mode', mode);
			let raw: RawHolding[] = [];
			if (mode === 'live') {
				raw = await scrapeGrowwHoldingsLive((stg) => updateSession(jobId, { progress: stg }));
			} else {
				// mock fallback
				raw = [
					{ stockName: 'ABC Corp', quantity: '10', avgPrice: '100', marketPrice: '120', sector: 'Tech', subsector: 'Software' },
					{ stockName: 'XYZ Ltd', quantity: '5', avgPrice: '200', marketPrice: '180', sector: 'Finance', subsector: 'Banking' },
				];
				await updateSession(jobId, { progress: { percent: 40, stage: 'mock data prepared' } });
			}
			await updateSession(jobId, { progress: { percent: 60, stage: `extracted raw (${raw.length}) - 60%` }, preview: { raw, mapped: [] } as ScrapePreview });
			console.log('[seqD][scrape] raw rows', raw.length);
			// Map to Stock-like rows (not persisted)
			const mapped: Stock[] = raw.map((r, idx) => {
				const derived = computeStockDerivedFields({ quantity: r.quantity, avgPrice: r.avgPrice, marketPrice: r.marketPrice });
				return {
					id: `temp-${idx}`,
					accountId: 'temp',
					accountName,
					stockName: r.stockName,
					avgPrice: r.avgPrice || '0',
					marketPrice: r.marketPrice || '0',
					investedValue: derived.investedValue,
					currentValue: derived.currentValue,
					pnl: derived.pnl,
					pnlPercent: derived.pnlPercent,
					quantity: r.quantity,
					sector: r.sector ?? null,
					subsector: r.subsector ?? null,
					capCategory: null,
					updatedAt: nowIso(),
					createdAt: nowIso(),
				};
			});
			const nextPercent = mapped.length > 0 ? 80 : 45;
			await updateSession(jobId, { progress: { percent: nextPercent, stage: mapped.length > 0 ? 'mapped to stocks - 80%' : 'no rows mapped - waiting' }, preview: { raw, mapped } });
			if (mapped.length > 0) {
				await updateSession(jobId, { status: 'completed' });
				console.log('[seqE][scrape] completed job', jobId);
			} else {
				console.warn('[seqE][scrape] no rows detected; keeping status as running to allow retry');
			}
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			console.error('[seqZ][scrape] failed', jobId, message);
			await updateSession(jobId, { status: 'failed', progress: { percent: 0, stage: 'failed' }, error: message });
		}
	});
}


