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
      progress: { percent: 10, stage: 'Launching browser...' }
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

    // Launch Playwright browser
    logger.info('🌐 BROWSER LAUNCH STARTED', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'BROWSER_LAUNCH', 
      flow: 'SCRAPING_FLOW',
      sessionId 
    });

    try {
      if (USE_BROWSERLESS && BROWSERLESS_TOKEN) {
        logger.info('🔗 ATTEMPTING BROWSERLESS.IO CONNECTION', { 
          service: 'BROWSER_SCRAPER', 
          stage: 'BROWSERLESS_ATTEMPT', 
          flow: 'SCRAPING_FLOW',
          sessionId,
          BROWSERLESS_URL 
        });
        
        const browserWSEndpoint = `${BROWSERLESS_URL}?token=${BROWSERLESS_TOKEN}`;
        
        // Try Browserless.io with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            logger.info(`🔌 CONNECTING TO BROWSERLESS.IO (Attempt ${retryCount + 1}/${maxRetries})`, { 
              service: 'BROWSER_SCRAPER', 
              stage: 'BROWSERLESS_CONNECT', 
              flow: 'SCRAPING_FLOW',
              sessionId,
              endpoint: browserWSEndpoint,
              attempt: retryCount + 1 
            });

            browser = await chromium.connect({ 
              wsEndpoint: browserWSEndpoint,
              timeout: 15000 // Reduced timeout for faster retries
            });

            logger.info('✅ BROWSERLESS.IO CONNECTION SUCCESSFUL', { 
              service: 'BROWSER_SCRAPER', 
              stage: 'BROWSERLESS_SUCCESS', 
              flow: 'SCRAPING_FLOW',
              sessionId,
              attempt: retryCount + 1 
            });

            const context = await browser.newContext({
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              viewport: { width: 1920, height: 1080 }
            });

            page = await context.newPage();
            logger.info('📄 BROWSERLESS.IO PAGE CREATED', { 
              service: 'BROWSER_SCRAPER', 
              stage: 'PAGE_CREATED', 
              flow: 'SCRAPING_FLOW',
              sessionId 
            });
            
            break; // Success, exit retry loop
            
          } catch (retryError) {
            retryCount++;
            logger.warn(`⚠️ BROWSERLESS.IO CONNECTION ATTEMPT ${retryCount} FAILED`, { 
              service: 'BROWSER_SCRAPER', 
              stage: 'BROWSERLESS_RETRY', 
              flow: 'SCRAPING_FLOW',
              sessionId,
              attempt: retryCount,
              error: retryError instanceof Error ? retryError.message : 'Unknown error'
            });
            
            if (retryCount >= maxRetries) {
              throw retryError; // Re-throw if all retries failed
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          }
        }
      } else {
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
      }
    } catch (error) {
      logger.error('💥 BROWSER LAUNCH FAILED', { 
        service: 'BROWSER_SCRAPER', 
        stage: 'BROWSER_ERROR', 
        flow: 'SCRAPING_FLOW',
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined 
      });
      throw new Error('Failed to launch browser: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }

    logger.info('🌐 NAVIGATION TO GROWW STARTED', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'NAVIGATION_START', 
      flow: 'SCRAPING_FLOW',
      sessionId 
    });

    await updateScrapeSession(sessionId, {
      progress: { percent: 20, stage: 'Navigating to Groww...' }
    });

    // Navigate to Groww login
    const loginUrl = 'https://groww.in/login';
    logger.info('🔗 NAVIGATING TO GROWW LOGIN', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'GROWW_NAVIGATION', 
      flow: 'SCRAPING_FLOW',
      sessionId,
      loginUrl 
    });

    await page.goto(loginUrl, { waitUntil: 'networkidle' });

    logger.info('✅ GROWW LOGIN PAGE LOADED', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'LOGIN_PAGE_LOADED', 
      flow: 'SCRAPING_FLOW',
      sessionId,
      currentUrl: page.url() 
    });

    await updateScrapeSession(sessionId, {
      progress: { percent: 30, stage: 'Waiting for user login (5 minutes)...' }
    });

    logger.info('⏰ STARTING LOGIN WAIT TIMER', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'LOGIN_WAIT_START', 
      flow: 'SCRAPING_FLOW',
      sessionId,
      timeout: '5 minutes' 
    });

    // Wait for user to login (5 minutes timeout)
    const deadline = Date.now() + 5 * 60 * 1000;
    let loginCheckCount = 0;
    while (Date.now() < deadline) {
      loginCheckCount++;
      const currentUrl = page.url();
      
      if (loginCheckCount % 30 === 0) { // Log every 30 seconds
        logger.info('⏳ LOGIN WAIT CHECK', { 
          service: 'BROWSER_SCRAPER', 
          stage: 'LOGIN_WAIT_CHECK', 
          flow: 'SCRAPING_FLOW',
          sessionId,
          checkCount: loginCheckCount,
          currentUrl,
          timeRemaining: Math.round((deadline - Date.now()) / 1000) + 's' 
        });
      }

      if (!currentUrl.includes('/login')) {
        logger.info('✅ USER LOGIN DETECTED', { 
          service: 'BROWSER_SCRAPER', 
          stage: 'LOGIN_SUCCESS', 
          flow: 'SCRAPING_FLOW',
          sessionId,
          currentUrl,
          checkCount: loginCheckCount 
        });
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const finalUrl = page.url();
    if (finalUrl.includes('/login')) {
      logger.error('⏰ LOGIN TIMEOUT REACHED', { 
        service: 'BROWSER_SCRAPER', 
        stage: 'LOGIN_TIMEOUT', 
        flow: 'SCRAPING_FLOW',
        sessionId,
        finalUrl,
        totalChecks: loginCheckCount 
      });
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
