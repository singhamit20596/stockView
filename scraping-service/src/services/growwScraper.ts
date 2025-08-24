import { chromium, Browser, Page } from 'playwright';
import { Decimal } from 'decimal.js';
import { logger } from '../utils/logger';
import { 
  updateScrapeSession, 
  createAccount, 
  createStocks, 
  deleteStocksByAccount,
  getAccountByName,
  updateAccountSummary 
} from './database';

export interface RawHolding {
  stockName: string;
  quantity: string;
  avgPrice: string | null;
  marketPrice: string | null;
  sector: string | null;
  subsector: string | null;
}

export interface ProcessedHolding {
  stock_name: string;
  quantity: number;
  avg_price: number;
  market_price: number;
  invested_value: number;
  current_value: number;
  pnl: number;
  pnl_percent: number;
  sector: string | null;
  subsector: string | null;
  market_cap: string | null;
}

export async function scrapeGrowwHoldings(
  sessionId: string, 
  accountName: string, 
  brokerId: string
): Promise<void> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Update session status to running
    await updateScrapeSession(sessionId, {
      status: 'running',
      progress: { percent: 10, stage: 'Launching browser...' }
    });

    logger.info('Starting Groww scraping', { sessionId, accountName });

    // Launch browser
    browser = await chromium.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });

    page = await context.newPage();

    await updateScrapeSession(sessionId, {
      progress: { percent: 20, stage: 'Navigating to Groww...' }
    });

    // Navigate to Groww login
    const loginUrl = 'https://groww.in/login';
    await page.goto(loginUrl, { waitUntil: 'networkidle' });

    await updateScrapeSession(sessionId, {
      progress: { percent: 30, stage: 'Waiting for user login (5 minutes)...' }
    });

    // Wait for user to login (5 minutes timeout)
    const deadline = Date.now() + 5 * 60 * 1000;
    while (Date.now() < deadline) {
      const currentUrl = page.url();
      if (!currentUrl.includes('/login')) {
        logger.info('User logged in successfully', { sessionId, currentUrl });
        break;
      }
      await page.waitForTimeout(1000);
    }

    if (page.url().includes('/login')) {
      throw new Error('Login timeout - user did not complete login within 5 minutes');
    }

    await updateScrapeSession(sessionId, {
      progress: { percent: 40, stage: 'Navigating to holdings...' }
    });

    // Navigate to holdings page
    const holdingsUrl = 'https://groww.in/stocks/user/holdings';
    await page.goto(holdingsUrl, { waitUntil: 'networkidle' });

    await updateScrapeSession(sessionId, {
      progress: { percent: 50, stage: 'Extracting holdings data...' }
    });

    // Extract holdings data
    const rawHoldings = await extractHoldings(page);
    
    logger.info('Extracted holdings', { sessionId, count: rawHoldings.length });

    await updateScrapeSession(sessionId, {
      progress: { percent: 70, stage: 'Processing data...' }
    });

    // Process holdings
    const processedHoldings = processHoldings(rawHoldings);

    await updateScrapeSession(sessionId, {
      progress: { percent: 80, stage: 'Saving to database...' }
    });

    // Save to database
    await saveHoldingsToDatabase(accountName, processedHoldings);

    await updateScrapeSession(sessionId, {
      status: 'completed',
      progress: { percent: 100, stage: 'Completed successfully' },
      preview: { raw: rawHoldings, processed: processedHoldings }
    });

    logger.info('Scraping completed successfully', { sessionId, accountName, holdingsCount: processedHoldings.length });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Scraping failed', { sessionId, accountName, error: errorMessage });
    
    await updateScrapeSession(sessionId, {
      status: 'failed',
      progress: { percent: 0, stage: 'Failed' },
      error: errorMessage
    });
  } finally {
    // Cleanup
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

async function extractHoldings(page: Page): Promise<RawHolding[]> {
  const holdings: RawHolding[] = [];
  let pass = 0;
  let prevCount = 0;

  while (true) {
    pass++;
    logger.info(`Extraction pass ${pass}`, { currentCount: holdings.length });

    // Extract holdings from current page
    const newHoldings = await page.evaluate(() => {
      const rows: RawHolding[] = [];
      const holdingRows = document.querySelectorAll('[data-testid="holding-row"], .holding-row, tr[class*="holding"]');
      
      holdingRows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) return;

        const stockName = cells[0]?.textContent?.trim() || '';
        const quantityText = cells[1]?.textContent?.trim() || '0';
        const avgPriceText = cells[2]?.textContent?.trim() || '';
        const marketPriceText = cells[3]?.textContent?.trim() || '';

        // Parse quantity
        const quantity = quantityText.replace(/[^0-9.]/g, '') || '0';

        // Parse average price
        const avgPrice = avgPriceText.replace(/[^0-9.]/g, '') || null;

        // Parse market price
        const marketPrice = marketPriceText.replace(/[^0-9.]/g, '') || null;

        if (stockName) {
          rows.push({
            stockName,
            quantity,
            avgPrice,
            marketPrice,
            sector: null,
            subsector: null
          });
        }
      });

      return rows;
    });

    // Merge with existing holdings
    const byName = new Map<string, RawHolding>(holdings.map(h => [h.stockName.toLowerCase(), h]));
    for (const holding of newHoldings) {
      if (holding.stockName && !byName.has(holding.stockName.toLowerCase())) {
        byName.set(holding.stockName.toLowerCase(), holding);
      }
    }
    holdings.splice(0, holdings.length, ...Array.from(byName.values()));

    // Check if we've reached the end
    const reachedEnd = await page.evaluate(() => {
      const prev = window.scrollY;
      window.scrollBy(0, Math.max(400, Math.floor(window.innerHeight * 0.8)));
      return window.scrollY === prev;
    });

    if (reachedEnd || holdings.length === prevCount) {
      break;
    }

    prevCount = holdings.length;
    await page.waitForTimeout(500);
  }

  return holdings;
}

function processHoldings(rawHoldings: RawHolding[]): ProcessedHolding[] {
  return rawHoldings.map(holding => {
    const quantity = new Decimal(holding.quantity || '0');
    const avgPrice = new Decimal(holding.avgPrice || '0');
    const marketPrice = new Decimal(holding.marketPrice || '0');

    const investedValue = quantity.mul(avgPrice);
    const currentValue = quantity.mul(marketPrice);
    const pnl = currentValue.minus(investedValue);
    const pnlPercent = investedValue.gt(0) ? pnl.div(investedValue).mul(100) : new Decimal(0);

    return {
      stock_name: holding.stockName,
      quantity: parseFloat(quantity.toFixed(2)),
      avg_price: parseFloat(avgPrice.toFixed(2)),
      market_price: parseFloat(marketPrice.toFixed(2)),
      invested_value: parseFloat(investedValue.toFixed(2)),
      current_value: parseFloat(currentValue.toFixed(2)),
      pnl: parseFloat(pnl.toFixed(2)),
      pnl_percent: parseFloat(pnlPercent.toFixed(2)),
      sector: holding.sector,
      subsector: holding.subsector,
      market_cap: null // Will be populated later if needed
    };
  });
}

async function saveHoldingsToDatabase(accountName: string, holdings: ProcessedHolding[]): Promise<void> {
  // Check if account exists, create if not
  let account = await getAccountByName(accountName);
  if (!account) {
    account = await createAccount({ name: accountName });
  }

  // Delete existing stocks for this account
  await deleteStocksByAccount(account.id);

  // Create new stocks
  const stocksWithAccountId = holdings.map(holding => ({
    ...holding,
    account_id: account!.id
  }));

  await createStocks(stocksWithAccountId);

  // Update account summary
  await updateAccountSummary(account.id);

  logger.info('Holdings saved to database', { accountName, holdingsCount: holdings.length });
}
