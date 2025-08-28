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

// Browser configuration
const USE_BROWSERLESS = process.env.USE_BROWSERLESS?.toLowerCase() === 'true';
const BROWSERLESS_URL = process.env.BROWSERLESS_URL || 'wss://production-sfo.browserless.io';
const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;

// Debug environment variables
console.log('🔧 ENVIRONMENT VARIABLES DEBUG:', {
  USE_BROWSERLESS_RAW: process.env.USE_BROWSERLESS,
  USE_BROWSERLESS_PARSED: USE_BROWSERLESS,
  BROWSERLESS_URL_RAW: process.env.BROWSERLESS_URL,
  BROWSERLESS_TOKEN_EXISTS: !!BROWSERLESS_TOKEN,
  NODE_ENV: process.env.NODE_ENV
});

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

// Real-time HTTP API scraping function using Browserless.io
async function scrapeWithHTTPAPI(sessionId: string, accountName: string): Promise<RawHolding[]> {
  logger.info('🌐 STARTING REAL-TIME HTTP API SCRAPING', { 
    service: 'BROWSER_SCRAPER', 
    stage: 'HTTP_SCRAPING_START', 
    flow: 'SCRAPING_FLOW',
    sessionId 
  });

  const httpUrl = BROWSERLESS_URL.replace('wss://', 'https://').replace('ws://', 'http://');
  
  try {
    // Step 1: Navigate to Groww and perform full scraping
    logger.info('🔗 STARTING FULL GROWW SCRAPING', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'GROWW_SCRAPING_START', 
      flow: 'SCRAPING_FLOW',
      sessionId 
    });

    const scrapingResponse = await fetch(`${httpUrl}/function?token=${BROWSERLESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: `
          async () => {
            const page = await newPage();
            
            // Navigate to Groww login
            await page.goto('https://groww.in/login', { waitUntil: 'networkidle' });
            
            // Wait for user to login (this will timeout in HTTP API, but we'll handle it)
            await page.waitForFunction(() => {
              return !window.location.href.includes('/login');
            }, { timeout: 300000 }); // 5 minutes timeout
            
            // Navigate to holdings page
            await page.goto('https://groww.in/portfolio/holdings', { waitUntil: 'networkidle' });
            
            // Wait for holdings to load
            await page.waitForSelector('[data-testid="holdings-table"]', { timeout: 30000 });
            
            // Extract holdings data
            const holdings = await page.evaluate(() => {
              const rows = document.querySelectorAll('[data-testid="holdings-table"] tbody tr');
              const holdingsData = [];
              
              rows.forEach((row) => {
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
            
            return { status: 'success', holdings };
          }
        `,
        context: { url: 'https://groww.in/login' }
      })
    });

    if (!scrapingResponse.ok) {
      throw new Error(`Scraping failed: ${scrapingResponse.status} ${scrapingResponse.statusText}`);
    }

    const scrapingResult = await scrapingResponse.json();
    
    if (scrapingResult.status !== 'success') {
      throw new Error(`Scraping returned error: ${scrapingResult.error || 'Unknown error'}`);
    }

    logger.info('✅ REAL-TIME SCRAPING COMPLETED', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'SCRAPING_SUCCESS', 
      flow: 'SCRAPING_FLOW',
      sessionId,
      holdingsCount: scrapingResult.holdings?.length || 0
    });

    return scrapingResult.holdings || [];

  } catch (error) {
    logger.error('💥 REAL-TIME HTTP API SCRAPING FAILED', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'HTTP_SCRAPING_ERROR', 
      flow: 'SCRAPING_FLOW',
      sessionId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined 
    });
    throw error;
  }
}

export async function scrapeGrowwHoldings(
  sessionId: string, 
  accountName: string, 
  brokerId: string
): Promise<void> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    logger.info('🚀 REAL-TIME SCRAPING FUNCTION STARTED', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'FUNCTION_START', 
      flow: 'SCRAPING_FLOW',
      sessionId, 
      accountName, 
      brokerId 
    });

    // Update session status to running
    await updateScrapeSession(sessionId, {
      status: 'running',
      progress: { percent: 10, stage: 'Starting real-time scraping...' }
    });

    logger.info('💾 SESSION STATUS UPDATED TO RUNNING', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'SESSION_UPDATED', 
      flow: 'SCRAPING_FLOW',
      sessionId 
    });

    logger.info('🔧 ENVIRONMENT CHECK', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'ENV_CHECK', 
      flow: 'SCRAPING_FLOW',
      sessionId,
      USE_BROWSERLESS,
      BROWSERLESS_URL,
      hasToken: !!BROWSERLESS_TOKEN
    });

    // Use HTTP API approach for real-time scraping
    if (USE_BROWSERLESS && BROWSERLESS_TOKEN) {
      logger.info('🌐 USING HTTP API FOR REAL-TIME SCRAPING', { 
        service: 'BROWSER_SCRAPER', 
        stage: 'HTTP_APPROACH', 
        flow: 'SCRAPING_FLOW',
        sessionId 
      });

      // Update progress
      await updateScrapeSession(sessionId, {
        progress: { percent: 20, stage: 'Using HTTP API for real-time scraping...' }
      });

      // Scrape using HTTP API
      const rawHoldings = await scrapeWithHTTPAPI(sessionId, accountName);

      if (!rawHoldings || rawHoldings.length === 0) {
        throw new Error('No holdings data extracted - scraping failed');
      }

      // Process holdings
      await updateScrapeSession(sessionId, {
        progress: { percent: 60, stage: 'Processing real-time data...' }
      });

      const processedHoldings = await processHoldings(rawHoldings);

      // Save to database
      await updateScrapeSession(sessionId, {
        progress: { percent: 80, stage: 'Saving real-time data to database...' }
      });

      await saveHoldingsToDatabase(sessionId, accountName, brokerId, processedHoldings);

      // Update final status
      await updateScrapeSession(sessionId, {
        status: 'completed',
        progress: { percent: 100, stage: 'Real-time scraping completed successfully' }
      });

      logger.info('✅ REAL-TIME SCRAPING COMPLETED SUCCESSFULLY', { 
        service: 'BROWSER_SCRAPER', 
        stage: 'HTTP_SCRAPING_SUCCESS', 
        flow: 'SCRAPING_FLOW',
        sessionId,
        holdingsCount: processedHoldings.length 
      });

      return;
    }

    // Fallback to local browser for real-time scraping
    logger.info('🖥️ ATTEMPTING LOCAL BROWSER FOR REAL-TIME SCRAPING', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'LOCAL_LAUNCH', 
      flow: 'SCRAPING_FLOW',
      sessionId 
    });

    browser = await chromium.launch({ 
      headless: false, // Show browser UI for user interaction
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--remote-debugging-port=9222', // Enable remote debugging
        '--remote-debugging-address=0.0.0.0' // Allow external connections
      ]
    });

    logger.info('✅ LOCAL BROWSER LAUNCHED SUCCESSFULLY', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'LOCAL_SUCCESS', 
      flow: 'SCRAPING_FLOW',
      sessionId 
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    page = await context.newPage();
    logger.info('📄 LOCAL PAGE CREATED', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'PAGE_CREATED', 
      flow: 'SCRAPING_FLOW',
      sessionId 
    });

    // Navigate to Groww login
    await updateScrapeSession(sessionId, {
      progress: { percent: 30, stage: 'Navigating to Groww login...' }
    });

    await page.goto('https://groww.in/login', { waitUntil: 'networkidle' });

    // Wait for user login (5 minutes timeout)
    await updateScrapeSession(sessionId, {
      progress: { percent: 40, stage: 'Waiting for user login (5 minutes)...' }
    });

    const deadline = Date.now() + 5 * 60 * 1000;
    while (Date.now() < deadline) {
      const currentUrl = page.url();
      if (!currentUrl.includes('/login')) {
        break; // User has logged in
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (page.url().includes('/login')) {
      throw new Error('Login timeout - user did not complete login within 5 minutes');
    }

    // Navigate to holdings and extract data
    await updateScrapeSession(sessionId, {
      progress: { percent: 60, stage: 'Navigating to holdings...' }
    });

    await page.goto('https://groww.in/portfolio/holdings', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="holdings-table"]', { timeout: 30000 });

    await updateScrapeSession(sessionId, {
      progress: { percent: 70, stage: 'Extracting real-time holdings data...' }
    });

    const rawHoldings = await extractHoldings(page);

    if (!rawHoldings || rawHoldings.length === 0) {
      throw new Error('No holdings data extracted from local browser');
    }

    // Process and save holdings
    await updateScrapeSession(sessionId, {
      progress: { percent: 80, stage: 'Processing real-time data...' }
    });

    const processedHoldings = await processHoldings(rawHoldings);

    await updateScrapeSession(sessionId, {
      progress: { percent: 90, stage: 'Saving real-time data to database...' }
    });

    await saveHoldingsToDatabase(sessionId, accountName, brokerId, processedHoldings);

    await updateScrapeSession(sessionId, {
      status: 'completed',
      progress: { percent: 100, stage: 'Real-time scraping completed successfully' }
    });

    logger.info('✅ LOCAL REAL-TIME SCRAPING COMPLETED', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'LOCAL_SCRAPING_SUCCESS', 
      flow: 'SCRAPING_FLOW',
      sessionId,
      holdingsCount: processedHoldings.length 
    });

  } catch (error) {
    logger.error('💥 REAL-TIME SCRAPING FAILED', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'SCRAPING_ERROR', 
      flow: 'SCRAPING_FLOW',
      sessionId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined 
    });

    // Update session status to failed
    await updateScrapeSession(sessionId, {
      status: 'failed',
      progress: { percent: 0, stage: 'Real-time scraping failed' },
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  } finally {
    // Cleanup
    if (page) {
      try {
        await page.close();
      } catch (error) {
        logger.warn('⚠️ FAILED TO CLOSE PAGE', { 
          service: 'BROWSER_SCRAPER', 
          stage: 'CLEANUP_ERROR', 
          flow: 'SCRAPING_FLOW',
          sessionId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        logger.warn('⚠️ FAILED TO CLOSE BROWSER', { 
          service: 'BROWSER_SCRAPER', 
          stage: 'CLEANUP_ERROR', 
          flow: 'SCRAPING_FLOW',
          sessionId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
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

    logger.info('Extracted real-time holdings data', { count: holdings.length });
    return holdings;

  } catch (error) {
    logger.error('Failed to extract real-time holdings', { error });
    throw new Error('Failed to extract holdings data: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

async function processHoldings(rawHoldings: RawHolding[]): Promise<ProcessedHolding[]> {
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

async function saveHoldingsToDatabase(sessionId: string, accountName: string, brokerId: string, holdings: ProcessedHolding[]): Promise<void> {
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

  logger.info('Real-time holdings saved to database', { accountName, holdingsCount: holdings.length });
}
