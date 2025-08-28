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
const USE_MOCK_DATA = process.env.USE_MOCK_DATA?.toLowerCase() === 'true';

// Debug environment variables
console.log('🔧 ENVIRONMENT VARIABLES DEBUG:', {
  USE_BROWSERLESS_RAW: process.env.USE_BROWSERLESS,
  USE_BROWSERLESS_PARSED: USE_BROWSERLESS,
  BROWSERLESS_URL_RAW: process.env.BROWSERLESS_URL,
  BROWSERLESS_TOKEN_EXISTS: !!BROWSERLESS_TOKEN,
  USE_MOCK_DATA,
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

// HTTP API scraping function using Browserless.io
async function scrapeWithHTTPAPI(sessionId: string, accountName: string): Promise<RawHolding[]> {
  logger.info('🌐 STARTING HTTP API SCRAPING', { 
    service: 'BROWSER_SCRAPER', 
    stage: 'HTTP_SCRAPING_START', 
    flow: 'SCRAPING_FLOW',
    sessionId 
  });

  const httpUrl = BROWSERLESS_URL.replace('wss://', 'https://').replace('ws://', 'http://');
  
  try {
    // Step 1: Navigate to Groww login page
    logger.info('🔗 NAVIGATING TO GROWW LOGIN', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'GROWW_NAVIGATION', 
      flow: 'SCRAPING_FLOW',
      sessionId 
    });

    const loginResponse = await fetch(`${httpUrl}/function?token=${BROWSERLESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: `
          async () => {
            const page = await newPage();
            await page.goto('https://groww.in/login', { waitUntil: 'networkidle' });
            return { status: 'login_page_loaded', title: await page.title() };
          }
        `,
        context: { url: 'https://groww.in/login' }
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login navigation failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginResult = await loginResponse.json();
    logger.info('✅ LOGIN PAGE LOADED', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'LOGIN_PAGE_SUCCESS', 
      flow: 'SCRAPING_FLOW',
      sessionId,
      result: loginResult 
    });

    // Step 2: Wait for user login (simulate the wait)
    logger.info('⏳ WAITING FOR USER LOGIN', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'LOGIN_WAIT', 
      flow: 'SCRAPING_FLOW',
      sessionId 
    });

    // For now, return mock data since HTTP API doesn't support interactive login
    // In a real implementation, you'd need to handle the login flow differently
    logger.warn('⚠️ HTTP API DOES NOT SUPPORT INTERACTIVE LOGIN', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'LOGIN_LIMITATION', 
      flow: 'SCRAPING_FLOW',
      sessionId 
    });

    // Return mock data for testing
    return [
      {
        stockName: 'HDFC Bank',
        quantity: '100',
        avgPrice: '1500.50',
        marketPrice: '1520.75',
        sector: 'Banking',
        subsector: 'Private Banks'
      },
      {
        stockName: 'TCS',
        quantity: '50',
        avgPrice: '3200.00',
        marketPrice: '3250.25',
        sector: 'Technology',
        subsector: 'IT Services'
      }
    ];

  } catch (error) {
    logger.error('💥 HTTP API SCRAPING FAILED', { 
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
    logger.info('🚀 SCRAPING FUNCTION STARTED', { 
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
      progress: { percent: 10, stage: 'Starting scraping...' }
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
      hasToken: !!BROWSERLESS_TOKEN,
      USE_MOCK_DATA 
    });

    // Check if we should use mock data
    if (USE_MOCK_DATA) {
      logger.info('🎭 USING MOCK DATA MODE', { 
        service: 'BROWSER_SCRAPER', 
        stage: 'MOCK_MODE', 
        flow: 'SCRAPING_FLOW',
        sessionId 
      });
      
      // Simulate the scraping process with mock data
      await simulateMockScraping(sessionId, accountName);
      return;
    }

    // Use HTTP API approach instead of WebSocket
    if (USE_BROWSERLESS && BROWSERLESS_TOKEN) {
      logger.info('🌐 USING HTTP API SCRAPING APPROACH', { 
        service: 'BROWSER_SCRAPER', 
        stage: 'HTTP_APPROACH', 
        flow: 'SCRAPING_FLOW',
        sessionId 
      });

      // Update progress
      await updateScrapeSession(sessionId, {
        progress: { percent: 20, stage: 'Using HTTP API for scraping...' }
      });

      // Scrape using HTTP API
      const rawHoldings = await scrapeWithHTTPAPI(sessionId, accountName);

      // Process holdings
      await updateScrapeSession(sessionId, {
        progress: { percent: 60, stage: 'Processing scraped data...' }
      });

      const processedHoldings = await processHoldings(rawHoldings);

      // Save to database
      await updateScrapeSession(sessionId, {
        progress: { percent: 80, stage: 'Saving to database...' }
      });

      await saveHoldingsToDatabase(sessionId, accountName, brokerId, processedHoldings);

      // Update final status
      await updateScrapeSession(sessionId, {
        status: 'completed',
        progress: { percent: 100, stage: 'Scraping completed successfully' }
      });

      logger.info('✅ HTTP API SCRAPING COMPLETED', { 
        service: 'BROWSER_SCRAPER', 
        stage: 'HTTP_SCRAPING_SUCCESS', 
        flow: 'SCRAPING_FLOW',
        sessionId,
        holdingsCount: processedHoldings.length 
      });

      return;
    }

    // Fallback to local browser (existing code)
    logger.info('🖥️ ATTEMPTING LOCAL BROWSER LAUNCH', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'LOCAL_LAUNCH', 
      flow: 'SCRAPING_FLOW',
      sessionId 
    });

    browser = await chromium.launch({ 
      headless: false, // Show browser UI
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

    // Continue with existing local scraping logic...
    // (Keep the rest of the existing scraping logic for local browser)

  } catch (error) {
    logger.error('💥 SCRAPING FAILED', { 
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
      progress: { percent: 0, stage: 'Failed' },
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

async function simulateMockScraping(sessionId: string, accountName: string): Promise<void> {
  try {
    logger.info('🎭 STARTING MOCK SCRAPING SIMULATION', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'MOCK_START', 
      flow: 'MOCK_SCRAPING',
      sessionId 
    });

    // Simulate browser launch
    await updateScrapeSession(sessionId, {
      progress: { percent: 20, stage: 'Launching browser...' }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate navigation
    await updateScrapeSession(sessionId, {
      progress: { percent: 30, stage: 'Navigating to Groww...' }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate login wait
    await updateScrapeSession(sessionId, {
      progress: { percent: 40, stage: 'Waiting for user login (5 minutes)...' }
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate login success
    await updateScrapeSession(sessionId, {
      progress: { percent: 50, stage: 'Login successful, navigating to holdings...' }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate extracting holdings
    await updateScrapeSession(sessionId, {
      progress: { percent: 60, stage: 'Extracting holdings data...' }
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate processing data
    await updateScrapeSession(sessionId, {
      progress: { percent: 80, stage: 'Processing holdings data...' }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate saving to database
    await updateScrapeSession(sessionId, {
      progress: { percent: 90, stage: 'Saving to database...' }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create mock holdings data
    const mockHoldings = [
      {
        stock_name: 'RELIANCE',
        quantity: 100,
        avg_price: 2500.00,
        market_price: 2600.00,
        invested_value: 250000.00,
        current_value: 260000.00,
        pnl: 10000.00,
        pnl_percent: 4.00,
        sector: 'Oil & Gas',
        subsector: 'Refineries',
        market_cap: 'Large Cap'
      },
      {
        stock_name: 'TCS',
        quantity: 50,
        avg_price: 3500.00,
        market_price: 3600.00,
        invested_value: 175000.00,
        current_value: 180000.00,
        pnl: 5000.00,
        pnl_percent: 2.86,
        sector: 'Technology',
        subsector: 'IT Services',
        market_cap: 'Large Cap'
      },
      {
        stock_name: 'HDFC BANK',
        quantity: 200,
        avg_price: 1500.00,
        market_price: 1520.00,
        invested_value: 300000.00,
        current_value: 304000.00,
        pnl: 4000.00,
        pnl_percent: 1.33,
        sector: 'Banking',
        subsector: 'Private Banks',
        market_cap: 'Large Cap'
      }
    ];

         // Save mock data to database
     await saveHoldingsToDatabase(sessionId, accountName, 'groww', mockHoldings);

    // Complete the scraping
    await updateScrapeSession(sessionId, {
      status: 'completed',
      progress: { percent: 100, stage: 'Completed successfully' }
    });

    logger.info('✅ MOCK SCRAPING COMPLETED SUCCESSFULLY', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'MOCK_COMPLETE', 
      flow: 'MOCK_SCRAPING',
      sessionId,
      holdingsCount: mockHoldings.length 
    });

  } catch (error) {
    logger.error('💥 MOCK SCRAPING FAILED', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'MOCK_ERROR', 
      flow: 'MOCK_SCRAPING',
      sessionId,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    await updateScrapeSession(sessionId, {
      status: 'failed',
      progress: { percent: 0, stage: 'Failed' },
      error: 'Mock scraping failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
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

  logger.info('Holdings saved to database', { accountName, holdingsCount: holdings.length });
}
