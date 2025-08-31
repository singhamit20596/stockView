"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeGrowwHoldings = scrapeGrowwHoldings;
const playwright_1 = require("playwright");
const logger_1 = require("../utils/logger");
const database_1 = require("./database");
const USE_BROWSERLESS = process.env.USE_BROWSERLESS?.toLowerCase() === 'true';
const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;
const BROWSERLESS_REGION = process.env.BROWSERLESS_REGION || 'production-sfo';
async function scrapeGrowwHoldings(sessionId, accountName) {
    logger_1.logger.info('🚀 STARTING GROWW SCRAPING', {
        service: 'BROWSER_SCRAPER',
        stage: 'SCRAPING_START',
        flow: 'SCRAPING_FLOW',
        sessionId,
        accountName,
        useBrowserless: USE_BROWSERLESS
    });
    try {
        // Update progress (session already created in API route)
        await (0, database_1.updateScrapeSession)(sessionId, {
            progress: { percent: 20, stage: 'Connecting to browser service...' }
        });
        let browser = null;
        let page = null;
        try {
            // Connect to browser (Browserless.io or local)
            if (USE_BROWSERLESS && BROWSERLESS_TOKEN) {
                logger_1.logger.info('🌐 USING BROWSERLESS.IO CDP', {
                    service: 'BROWSER_SCRAPER',
                    stage: 'BROWSERLESS_CDP',
                    flow: 'SCRAPING_FLOW',
                    sessionId,
                    hasToken: !!BROWSERLESS_TOKEN,
                    region: BROWSERLESS_REGION,
                    useBrowserless: USE_BROWSERLESS
                });
                // Use CDP WebSocket connection (free plan compatible)
                const browserlessUrl = `wss://${BROWSERLESS_REGION}.browserless.io/chrome?token=${BROWSERLESS_TOKEN}&timeout=50000&stealth=true&headless=true&blockAds=true`;
                logger_1.logger.info('🔗 BROWSERLESS.IO CDP URL', {
                    service: 'BROWSER_SCRAPER',
                    sessionId,
                    stage: 'CDP_URL',
                    flow: 'SCRAPING_FLOW',
                    browserlessUrl: browserlessUrl.replace(BROWSERLESS_TOKEN, '***'),
                    region: BROWSERLESS_REGION
                });
                try {
                    // Connect using CDP (free plan compatible)
                    browser = await playwright_1.chromium.connectOverCDP(browserlessUrl);
                    logger_1.logger.info('✅ BROWSERLESS.IO CDP CONNECTED', {
                        service: 'BROWSER_SCRAPER',
                        sessionId,
                        stage: 'CDP_CONNECTED',
                        flow: 'SCRAPING_FLOW',
                        isConnected: browser.isConnected()
                    });
                }
                catch (cdpError) {
                    logger_1.logger.error('💥 BROWSERLESS.IO CDP FAILED', {
                        service: 'BROWSER_SCRAPER',
                        sessionId,
                        stage: 'CDP_ERROR',
                        flow: 'SCRAPING_FLOW',
                        error: cdpError instanceof Error ? cdpError.message : 'Unknown error',
                        errorStack: cdpError instanceof Error ? cdpError.stack : undefined
                    });
                    throw new Error(`Browserless.io CDP connection failed: ${cdpError instanceof Error ? cdpError.message : 'Unknown error'}`);
                }
            }
            else {
                logger_1.logger.info('🖥️ LAUNCHING LOCAL BROWSER', {
                    service: 'BROWSER_SCRAPER',
                    stage: 'LOCAL_LAUNCH',
                    flow: 'SCRAPING_FLOW',
                    sessionId,
                    useBrowserless: USE_BROWSERLESS,
                    hasToken: !!BROWSERLESS_TOKEN,
                    reason: !USE_BROWSERLESS ? 'USE_BROWSERLESS=false' : 'No BROWSERLESS_TOKEN'
                });
                browser = await playwright_1.chromium.launch({
                    headless: false,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                logger_1.logger.info('✅ LOCAL BROWSER LAUNCHED', {
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
            await (0, database_1.updateScrapeSession)(sessionId, {
                progress: { percent: 30, stage: 'Navigating to Groww login page...' }
            });
            // Navigate to Groww login page
            logger_1.logger.info('🌐 NAVIGATING TO GROWW LOGIN', {
                service: 'BROWSER_SCRAPER',
                stage: 'NAVIGATE_LOGIN',
                flow: 'SCRAPING_FLOW',
                sessionId
            });
            await page.goto('https://groww.in/login', {
                waitUntil: 'networkidle',
                timeout: 30000
            });
            // Update progress
            await (0, database_1.updateScrapeSession)(sessionId, {
                progress: { percent: 40, stage: 'Waiting for manual login...' }
            });
            logger_1.logger.info('⏳ WAITING FOR MANUAL LOGIN', {
                service: 'BROWSER_SCRAPER',
                stage: 'WAIT_LOGIN',
                flow: 'SCRAPING_FLOW',
                sessionId
            });
            // Wait for user to login manually (up to 5 minutes)
            await page.waitForSelector('[data-testid="dashboard"], .dashboard, [class*="dashboard"], .user-profile', {
                timeout: 300000
            });
            logger_1.logger.info('✅ LOGIN DETECTED', {
                service: 'BROWSER_SCRAPER',
                stage: 'LOGIN_SUCCESS',
                flow: 'SCRAPING_FLOW',
                sessionId
            });
            // Update progress
            await (0, database_1.updateScrapeSession)(sessionId, {
                progress: { percent: 60, stage: 'Navigating to holdings page...' }
            });
            // Navigate to holdings page
            logger_1.logger.info('📊 NAVIGATING TO HOLDINGS', {
                service: 'BROWSER_SCRAPER',
                stage: 'NAVIGATE_HOLDINGS',
                flow: 'SCRAPING_FLOW',
                sessionId
            });
            await page.goto('https://groww.in/stocks/user/holdings', {
                waitUntil: 'networkidle',
                timeout: 30000
            });
            // Update progress
            await (0, database_1.updateScrapeSession)(sessionId, {
                progress: { percent: 80, stage: 'Extracting holdings data...' }
            });
            // Wait for holdings to load
            await page.waitForSelector('[data-testid="holdings-table"], .holdings-table, [class*="holdings"], tr[data-holding-parent]', {
                timeout: 30000
            });
            logger_1.logger.info('📋 EXTRACTING HOLDINGS DATA', {
                service: 'BROWSER_SCRAPER',
                stage: 'EXTRACT_DATA',
                flow: 'SCRAPING_FLOW',
                sessionId
            });
            // Extract holdings data
            const holdings = await page.evaluate(() => {
                const clean = (v) => (v == null ? undefined : String(v).replace(/[^0-9.\-]/g, ''));
                const rows = [];
                // Look for holdings table rows
                const trs = Array.from(document.querySelectorAll('tr[data-holding-parent]'));
                for (const tr of trs) {
                    // Extract stock name
                    const nameEl = tr.querySelector('.holdingRow_symbolWrapper__yI1cn a, a.holdingRow_symbolname__X9SKI, .holdingRow_symbolWrapper__yI1cn, a');
                    const stockName = (nameEl?.textContent || '').trim();
                    if (!stockName)
                        continue;
                    // Extract quantity and average price from spans
                    const spans = Array.from(tr.querySelectorAll('span')).map(s => (s.textContent || '').trim());
                    const qtySpan = spans.find(t => /shares?/i.test(t));
                    const avgSpan = spans.find(t => /^Avg\./i.test(t));
                    const quantity = clean(qtySpan?.match(/([\d,]+)/)?.[1] || '');
                    const avgPrice = clean(avgSpan?.match(/₹\s*([\d.,]+)/)?.[1] || '');
                    // Extract current price from right-aligned cells
                    const rightTds = Array.from(tr.querySelectorAll('td')).filter(td => /holdingRow_stk12Pr20/.test(td.className) ||
                        (td.style?.textAlign || '').toLowerCase() === 'right');
                    let marketPrice = null;
                    // Find the first right-aligned cell with price (not PnL)
                    for (const td of rightTds) {
                        const text = (td.textContent || '').replace(/\s+/g, ' ').trim();
                        if (/^\+₹/.test(text))
                            continue; // Skip PnL values
                        const priceMatch = text.match(/^₹\s*([\d.,]+)/);
                        if (priceMatch) {
                            marketPrice = String(parseFloat(priceMatch[1].replace(/[^0-9.]/g, '')));
                            break;
                        }
                    }
                    // Fallback: any ₹ number that's not prefixed with +₹
                    if (!marketPrice) {
                        for (const td of rightTds) {
                            const text = (td.textContent || '').replace(/\s+/g, ' ').trim();
                            if (/^\+₹/.test(text))
                                continue;
                            const anyPriceMatch = text.match(/₹\s*([\d.,]+)/);
                            if (anyPriceMatch) {
                                marketPrice = String(parseFloat(anyPriceMatch[1].replace(/[^0-9.]/g, '')));
                                break;
                            }
                        }
                    }
                    rows.push({
                        stockName,
                        quantity: quantity ?? '0',
                        avgPrice: avgPrice ?? '',
                        marketPrice: marketPrice ?? '',
                        sector: '',
                        subsector: ''
                    });
                }
                return rows;
            });
            logger_1.logger.info('✅ HOLDINGS DATA EXTRACTED', {
                service: 'BROWSER_SCRAPER',
                sessionId,
                stage: 'DATA_EXTRACTED',
                flow: 'SCRAPING_FLOW',
                holdingsCount: holdings.length
            });
            // Update progress
            await (0, database_1.updateScrapeSession)(sessionId, {
                progress: { percent: 100, stage: 'Scraping completed successfully!' }
            });
            return holdings;
        }
        finally {
            // Clean up
            if (page) {
                try {
                    await page.close();
                }
                catch (error) {
                    logger_1.logger.warn('⚠️ Error closing page', { error });
                }
            }
            if (browser) {
                try {
                    await browser.close();
                }
                catch (error) {
                    logger_1.logger.warn('⚠️ Error closing browser', { error });
                }
            }
        }
    }
    catch (error) {
        logger_1.logger.error('💥 SCRAPING FAILED', {
            service: 'BROWSER_SCRAPER',
            sessionId,
            stage: 'SCRAPING_ERROR',
            flow: 'SCRAPING_FLOW',
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}
//# sourceMappingURL=growwScraper.js.map