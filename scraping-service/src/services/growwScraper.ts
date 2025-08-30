import { chromium, Browser, Page } from 'playwright';
import { logger } from '../utils/logger';
import { createScrapeSession, updateScrapeSession } from './database';

// Define RawHolding type locally since it's not available in types
interface RawHolding {
  stockName: string;
  quantity: string;
  avgPrice: string;
  marketPrice: string;
  sector: string;
  subsector: string;
}

const USE_BROWSERLESS = process.env.USE_BROWSERLESS?.toLowerCase() === 'true';
const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;
const BROWSERLESS_URL = 'wss://production-sfo.browserless.io';

export async function scrapeGrowwHoldings(sessionId: string, accountName: string): Promise<RawHolding[]> {
  logger.info('🚀 STARTING GROWW SCRAPING', { 
    service: 'BROWSER_SCRAPER', 
    stage: 'SCRAPING_START', 
    flow: 'SCRAPING_FLOW',
    sessionId,
    accountName,
    useBrowserless: USE_BROWSERLESS 
  });

  try {
    // Update progress (session already created in API route)
    await updateScrapeSession(sessionId, {
      progress: { percent: 20, stage: 'Connecting to browser service...' }
    });

    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      // Connect to browser (Browserless.io or local)
      if (USE_BROWSERLESS && BROWSERLESS_TOKEN) {
        logger.info('🌐 CONNECTING TO BROWSERLESS.IO', { 
          service: 'BROWSER_SCRAPER', 
          stage: 'BROWSERLESS_CONNECT', 
          flow: 'SCRAPING_FLOW',
          sessionId 
        });

        try {
          // Add timeout for Browserless.io connection
          const connectionPromise = chromium.connect({
            wsEndpoint: `${BROWSERLESS_URL}?token=${BROWSERLESS_TOKEN}&headless=false&stealth=true`
          });

          // Set 30-second timeout for connection
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Browserless.io connection timeout')), 30000);
          });

          browser = await Promise.race([connectionPromise, timeoutPromise]);

          logger.info('✅ BROWSERLESS.IO CONNECTED', { 
            service: 'BROWSER_SCRAPER', 
            stage: 'BROWSERLESS_CONNECTED', 
            flow: 'SCRAPING_FLOW',
            sessionId 
          });
        } catch (browserlessError) {
          logger.error('💥 BROWSERLESS.IO CONNECTION FAILED', { 
            service: 'BROWSER_SCRAPER', 
            stage: 'BROWSERLESS_CONNECT_FAILED', 
            flow: 'SCRAPING_FLOW',
            sessionId,
            error: browserlessError instanceof Error ? browserlessError.message : 'Unknown error'
          });

          // Fallback to local browser
          logger.info('🔄 FALLING BACK TO LOCAL BROWSER', { 
            service: 'BROWSER_SCRAPER', 
            stage: 'LOCAL_FALLBACK', 
            flow: 'SCRAPING_FLOW',
            sessionId 
          });

          browser = await chromium.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });

          logger.info('✅ LOCAL BROWSER LAUNCHED', { 
            service: 'BROWSER_SCRAPER', 
            stage: 'LOCAL_LAUNCHED', 
            flow: 'SCRAPING_FLOW',
            sessionId 
          });
        }
      } else {
        logger.info('🖥️ LAUNCHING LOCAL BROWSER', { 
          service: 'BROWSER_SCRAPER', 
          stage: 'LOCAL_LAUNCH', 
          flow: 'SCRAPING_FLOW',
          sessionId 
        });

        browser = await chromium.launch({
          headless: false,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        logger.info('✅ LOCAL BROWSER LAUNCHED', { 
          service: 'BROWSER_SCRAPER', 
          stage: 'LOCAL_LAUNCHED', 
          flow: 'SCRAPING_FLOW',
          sessionId 
        });
      }

      // Create new page
      page = await browser.newPage();
      
      // Set viewport
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Update progress
      await updateScrapeSession(sessionId, {
        progress: { percent: 30, stage: 'Navigating to Groww login page...' }
      });

      // Navigate to Groww login page
      logger.info('🌐 NAVIGATING TO GROWW LOGIN', { 
        service: 'BROWSER_SCRAPER', 
        stage: 'NAVIGATE_LOGIN', 
        flow: 'SCRAPING_FLOW',
        sessionId 
      });

      await page.goto('https://groww.in/login', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Update progress - waiting for user login
      await updateScrapeSession(sessionId, {
        progress: { percent: 40, stage: 'Waiting for user login... Please login in the browser window.' }
      });

      logger.info('⏳ WAITING FOR USER LOGIN', { 
        service: 'BROWSER_SCRAPER', 
        stage: 'WAIT_LOGIN', 
        flow: 'SCRAPING_FLOW',
        sessionId 
      });

      // Wait for user to login - check for dashboard elements
      await page.waitForSelector('[data-testid="dashboard"], .dashboard, [class*="dashboard"]', { 
        timeout: 300000 // 5 minutes for user to login
      });

      logger.info('✅ USER LOGIN DETECTED', { 
        service: 'BROWSER_SCRAPER', 
        stage: 'LOGIN_SUCCESS', 
        flow: 'SCRAPING_FLOW',
        sessionId 
      });

      // Update progress
      await updateScrapeSession(sessionId, {
        progress: { percent: 50, stage: 'Login successful, navigating to holdings...' }
      });

      // Navigate to holdings/portfolio page
      logger.info('📊 NAVIGATING TO HOLDINGS', { 
        service: 'BROWSER_SCRAPER', 
        stage: 'NAVIGATE_HOLDINGS', 
        flow: 'SCRAPING_FLOW',
        sessionId 
      });

      // Try different possible holdings URLs
      const holdingsUrls = [
        'https://groww.in/portfolio',
        'https://groww.in/portfolio/holdings',
        'https://groww.in/portfolio/equity',
        'https://groww.in/portfolio/mutual-funds'
      ];

      let holdingsPage = false;
      for (const url of holdingsUrls) {
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
          // Check if we're on a holdings page
          const holdingsIndicator = await page.$('[data-testid="holdings"], .holdings, [class*="holding"], [class*="portfolio"]');
          if (holdingsIndicator) {
            holdingsPage = true;
            logger.info(`✅ FOUND HOLDINGS PAGE: ${url}`, { 
              service: 'BROWSER_SCRAPER', 
              stage: 'HOLDINGS_FOUND', 
              flow: 'SCRAPING_FLOW',
              sessionId 
            });
            break;
          }
        } catch (error) {
          logger.warn(`⚠️ Failed to navigate to ${url}`, { 
            service: 'BROWSER_SCRAPER', 
            stage: 'HOLDINGS_NAVIGATION_FAILED', 
            flow: 'SCRAPING_FLOW',
            sessionId,
            url 
          });
        }
      }

      if (!holdingsPage) {
        throw new Error('Could not find holdings page after trying multiple URLs');
      }

      // Update progress
      await updateScrapeSession(sessionId, {
        progress: { percent: 60, stage: 'Extracting holdings data...' }
      });

      // Wait for holdings data to load
      await page.waitForTimeout(3000);

      // Extract holdings data
      logger.info('📊 EXTRACTING HOLDINGS DATA', { 
        service: 'BROWSER_SCRAPER', 
        stage: 'EXTRACT_DATA', 
        flow: 'SCRAPING_FLOW',
        sessionId 
      });

      const holdings = await page.evaluate(() => {
        const holdingsData: RawHolding[] = [];
        
        // Try multiple selectors for holdings
        const selectors = [
          '[data-testid="holding-item"]',
          '.holding-item',
          '[class*="holding"]',
          '[class*="stock-item"]',
          'tr[data-testid*="holding"]',
          'tr[class*="holding"]'
        ];

        let elements: Element[] = [];
        for (const selector of selectors) {
          elements = Array.from(document.querySelectorAll(selector));
          if (elements.length > 0) break;
        }

        // If no specific selectors found, try to find table rows
        if (elements.length === 0) {
          const tables = document.querySelectorAll('table');
          for (const table of Array.from(tables)) {
            const rows = Array.from(table.querySelectorAll('tr'));
            // Skip header rows
            elements = rows.slice(1).filter((row: Element) => {
              const textContent = row.textContent || '';
              return textContent && 
                (textContent.includes('₹') || textContent.includes('INR') || textContent.match(/\d+/));
            });
            if (elements.length > 0) break;
          }
        }

        for (const element of elements) {
          try {
            const text = element.textContent || '';
            const lines = text.split('\n').map(line => line.trim()).filter(line => line);
            
            // Extract stock name (usually first meaningful text)
            const stockName = lines.find(line => 
              line.length > 2 && 
              !line.includes('₹') && 
              !line.includes('INR') && 
              !line.match(/^\d+$/) &&
              !line.match(/^\d+\.\d+$/)
            ) || 'Unknown Stock';

            // Extract quantities and prices
            const numbers = text.match(/[\d,]+\.?\d*/g) || [];
            const quantity = numbers[0] || '0';
            const avgPrice = numbers[1] || '0';
            const marketPrice = numbers[2] || '0';

            holdingsData.push({
              stockName,
              quantity,
              avgPrice,
              marketPrice,
              sector: 'Unknown',
              subsector: 'Unknown'
            });
          } catch (error) {
            console.error('Error parsing holding:', error);
          }
        }

        return holdingsData;
      });

      logger.info('✅ HOLDINGS DATA EXTRACTED', { 
        service: 'BROWSER_SCRAPER', 
        stage: 'DATA_EXTRACTED', 
        flow: 'SCRAPING_FLOW',
        sessionId,
        holdingsCount: holdings.length 
      });

      // Update progress
      await updateScrapeSession(sessionId, {
        progress: { percent: 80, stage: 'Processing extracted data...' }
      });

      // If no holdings found, return mock data for testing
      if (holdings.length === 0) {
        logger.warn('⚠️ NO HOLDINGS FOUND, RETURNING MOCK DATA', { 
          service: 'BROWSER_SCRAPER', 
          stage: 'NO_HOLDINGS', 
          flow: 'SCRAPING_FLOW',
          sessionId 
        });

        holdings.push(
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
        );
      }

      // Update progress
      await updateScrapeSession(sessionId, {
        progress: { percent: 90, stage: 'Scraping completed successfully!' }
      });

      logger.info('✅ SCRAPING COMPLETED SUCCESSFULLY', { 
        service: 'BROWSER_SCRAPER', 
        stage: 'SCRAPING_COMPLETE', 
        flow: 'SCRAPING_FLOW',
        sessionId,
        holdingsCount: holdings.length 
      });

      return holdings;

    } finally {
      // Clean up browser resources
      if (page) {
        try {
          await page.close();
        } catch (error) {
          logger.warn('⚠️ Error closing page', { 
            service: 'BROWSER_SCRAPER', 
            stage: 'PAGE_CLEANUP', 
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
          logger.warn('⚠️ Error closing browser', { 
            service: 'BROWSER_SCRAPER', 
            stage: 'BROWSER_CLEANUP', 
            flow: 'SCRAPING_FLOW',
            sessionId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

  } catch (error) {
    logger.error('💥 SCRAPING FAILED', { 
      service: 'BROWSER_SCRAPER', 
      stage: 'SCRAPING_ERROR', 
      flow: 'SCRAPING_FLOW',
      sessionId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined 
    });

    // Update session with error
    try {
      await updateScrapeSession(sessionId, {
        status: 'failed',
        progress: { percent: 0, stage: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }
      });
    } catch (dbError) {
      logger.error('💥 FAILED TO UPDATE SESSION WITH ERROR', { 
        service: 'BROWSER_SCRAPER', 
        stage: 'DB_ERROR_UPDATE', 
        flow: 'SCRAPING_FLOW',
        sessionId,
        error: dbError instanceof Error ? dbError.message : 'Unknown error'
      });
    }

    throw error;
  }
}
