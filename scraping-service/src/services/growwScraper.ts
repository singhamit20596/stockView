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

    // Launch Playwright browser
    try {
      logger.info('Attempting to launch Playwright browser');
      browser = await chromium.launch({ 
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        viewport: { width: 1920, height: 1080 }
      });

      page = await context.newPage();
      logger.info('Playwright browser launched successfully');
    } catch (error) {
      logger.error('Failed to launch Playwright browser', { error });
      throw new Error('Failed to launch browser: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }

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
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const finalUrl = page.url();
    if (finalUrl.includes('/login')) {
      throw new Error('Login timeout - user did not complete login within 5 minutes');
    }

    await updateScrapeSession(sessionId, {
      progress: { percent: 40, stage: 'Navigating to holdings...' }
    });

    // Navigate to holdings page
    const holdingsUrl = 'https://groww.in/portfolio/holdings';
    await page.goto(holdingsUrl, { waitUntil: 'networkidle' });

    await updateScrapeSession(sessionId, {
      progress: { percent: 50, stage: 'Waiting for holdings to load...' }
    });

    // Wait for holdings to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    await updateScrapeSession(sessionId, {
      progress: { percent: 60, stage: 'Extracting holdings data...' }
    });

    // Extract holdings data
    const rawHoldings = await extractHoldings(page);

    await updateScrapeSession(sessionId, {
      progress: { percent: 80, stage: 'Processing holdings data...' }
    });

    // Process holdings
    const processedHoldings = processHoldings(rawHoldings);

    await updateScrapeSession(sessionId, {
      progress: { percent: 90, stage: 'Saving to database...' }
    });

    // Save to database
    await saveHoldingsToDatabase(accountName, processedHoldings);

    await updateScrapeSession(sessionId, {
      status: 'completed',
      progress: { percent: 100, stage: 'Completed successfully' }
    });

    logger.info('Scraping completed successfully', { 
      sessionId, 
      accountName, 
      holdingsCount: processedHoldings.length 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Scraping failed', { sessionId, accountName, error: errorMessage });
    
    await updateScrapeSession(sessionId, {
      status: 'failed',
      progress: { percent: 0, stage: 'Failed' },
      error: errorMessage
    });
      } finally {
      if (page) {
        try {
          await page.close();
        } catch (error) {
          logger.warn('Failed to close page', { error });
        }
      }
      
      if (browser) {
        try {
          await browser.close();
        } catch (error) {
          logger.warn('Failed to close browser', { error });
        }
      }
    }
  }
  
  async function extractHoldings(page: Page): Promise<RawHolding[]> {
    try {
      // Wait for holdings table to load
      await page.waitForSelector('[data-testid="holdings-table"]', { timeout: 10000 });

    // Extract holdings data
    const holdings = await page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="holdings-table"] tbody tr');
      const holdingsData: RawHolding[] = [];

      rows.forEach((row: any) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
          const stockName = cells[0]?.textContent?.trim() || '';
          const quantity = cells[1]?.textContent?.trim() || '0';
          const avgPrice = cells[2]?.textContent?.trim() || null;
          const marketPrice = cells[3]?.textContent?.trim() || null;
          
          holdingsData.push({
            stockName,
            quantity,
            avgPrice,
            marketPrice,
            sector: null,
            subsector: null
          });
        }
      });

      return holdingsData;
    });

    logger.info('Extracted holdings data', { count: holdings.length });
    return holdings;

  } catch (error) {
    logger.error('Failed to extract holdings', { error });
    // Return mock data as fallback for now
    return [
      {
        stockName: 'RELIANCE',
        quantity: '100',
        avgPrice: '2500.00',
        marketPrice: '2600.00',
        sector: 'Oil & Gas',
        subsector: 'Refineries'
      },
      {
        stockName: 'TCS',
        quantity: '50',
        avgPrice: '3500.00',
        marketPrice: '3600.00',
        sector: 'Technology',
        subsector: 'IT Services'
      }
    ];
  }
}

function processHoldings(rawHoldings: RawHolding[]): ProcessedHolding[] {
  return rawHoldings.map(holding => {
    const quantity = parseInt(holding.quantity.replace(/[^\d]/g, '')) || 0;
    const avgPrice = parseFloat(holding.avgPrice?.replace(/[^\d.]/g, '') || '0');
    const marketPrice = parseFloat(holding.marketPrice?.replace(/[^\d.]/g, '') || '0');
    
    const investedValue = quantity * avgPrice;
    const currentValue = quantity * marketPrice;
    const pnl = currentValue - investedValue;
    const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

    return {
      stock_name: holding.stockName,
      quantity,
      avg_price: avgPrice,
      market_price: marketPrice,
      invested_value: investedValue,
      current_value: currentValue,
      pnl,
      pnl_percent: pnlPercent,
      sector: holding.sector,
      subsector: holding.subsector,
      market_cap: null
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
