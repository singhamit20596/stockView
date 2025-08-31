import type { RawHolding } from '@/lib/types';
import { log } from '@/server/logger';
import { scrapeGrowwHoldingsFree, scrapeGrowwHoldingsManual } from './groww-free';
import type { GrowwCredentials, OTPInputCallback } from '@/lib/types';
import { ServerCredentialsService } from '@/lib/serverCredentialsService';

type ProgressFn = (stage: { percent: number; stage: string; message?: string }) => Promise<void> | void;

// Main scraper function - uses database credentials
export async function scrapeGrowwHoldingsLive(
  onProgress: ProgressFn,
  onOTPRequest?: OTPInputCallback,
  accountName?: string
): Promise<RawHolding[]> {
  let credentials: GrowwCredentials | null = null;

  // Try to get credentials from database first
  if (accountName) {
    try {
      log('[groww]', `Fetching credentials for account: ${accountName}`);
      credentials = await ServerCredentialsService.getCredentialsForScraping(accountName);
      
      if (credentials) {
        log('[groww]', 'Using database credentials for automated login');
        return await scrapeGrowwHoldingsFree(credentials, onProgress, onOTPRequest);
      } else {
        log('[groww]', `No credentials found for account: ${accountName}`);
      }
    } catch (error) {
      log('[groww]', `Error fetching credentials for ${accountName}: ${error}`);
    }
  }

  // Fallback to environment variables (legacy support)
  const envCredentials = process.env.GROWW_USERNAME && process.env.GROWW_PASSWORD && process.env.GROWW_PIN ? {
    username: process.env.GROWW_USERNAME,
    password: process.env.GROWW_PASSWORD,
    pin: process.env.GROWW_PIN,
  } : null;

  if (envCredentials) {
    log('[groww]', 'Using environment variable credentials (legacy)');
    return await scrapeGrowwHoldingsFree(envCredentials, onProgress, onOTPRequest);
  }

  // Final fallback to manual login
  log('[groww]', 'No credentials found, using manual login');
  return await scrapeGrowwHoldingsManual(onProgress);
}

// Alternative function for explicit credential-based login with account name
export async function scrapeGrowwHoldingsWithAccount(
  accountName: string,
  onProgress: ProgressFn,
  onOTPRequest?: OTPInputCallback
): Promise<RawHolding[]> {
  log('[groww]', `Using explicit account-based login: ${accountName}`);
  return await scrapeGrowwHoldingsLive(onProgress, onOTPRequest, accountName);
}

// Alternative function for explicit credential-based login
export async function scrapeGrowwHoldingsWithCredentials(
  credentials: GrowwCredentials,
  onProgress: ProgressFn,
  onOTPRequest?: OTPInputCallback
): Promise<RawHolding[]> {
  log('[groww]', 'Using explicit credential-based login');
  return await scrapeGrowwHoldingsFree(credentials, onProgress, onOTPRequest);
}

// Alternative function for explicit manual login
export async function scrapeGrowwHoldingsWithManualLogin(
  onProgress: ProgressFn
): Promise<RawHolding[]> {
  log('[groww]', 'Using explicit manual login');
  return await scrapeGrowwHoldingsManual(onProgress);
}


