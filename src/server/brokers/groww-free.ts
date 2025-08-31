import type { RawHolding } from '@/lib/types';
import { log } from '@/server/logger';
import { BrowserlessFreeHelper, createBrowserlessFreeHelper } from '@/lib/browserless-free';
import type { GrowwCredentials, OTPInputCallback } from '@/lib/types';

type ProgressFn = (stage: { percent: number; stage: string; message?: string }) => Promise<void> | void;

export async function scrapeGrowwHoldingsFree(
  credentials: GrowwCredentials,
  onProgress: ProgressFn,
  onOTPRequest?: OTPInputCallback
): Promise<RawHolding[]> {
  let helper: BrowserlessFreeHelper | null = null;
  
  try {
    // Initialize Browserless helper for free plan
    log('[seq01][groww-free]', 'initializing browserless helper for free plan');
    helper = createBrowserlessFreeHelper({
      timeout: 50000, // 50 seconds (under 60s free plan limit)
      stealth: true,
      headless: true,
      blockAds: true,
    });

    await onProgress({ percent: 5, stage: 'connecting to browserless (free plan)' });
    await helper.connect();
    
    await onProgress({ percent: 10, stage: 'creating browser page' });
    const page = await helper.createPage();

    // Step 1: Complete multi-step login process
    await onProgress({ percent: 15, stage: 'starting multi-step login process' });
    log('[seq02][groww-free]', 'starting multi-step login process');
    
    const loginSuccess = await helper.loginToGroww(credentials, onOTPRequest);
    
    if (!loginSuccess) {
      throw new Error('Multi-step login failed');
    }

    await onProgress({ percent: 40, stage: 'login successful, navigating to holdings' });

    // Step 2: Navigate to holdings page
    log('[seq03][groww-free]', 'navigating to holdings page');
    const holdingsSuccess = await helper.navigateToHoldings();
    
    if (!holdingsSuccess) {
      throw new Error('Failed to navigate to holdings page');
    }

    await onProgress({ percent: 50, stage: 'on holdings page, extracting data quickly' });

    // Step 3: Quick extraction with timeout management
    const holdings = await helper.quickScrape(async () => {
      // Network capture for API responses (quick)
      const captured: RawHolding[] = [];
      const seenResponses = new Set<string>();
      
      page.on('response', async (resp: any) => {
        try {
          const url = resp.url();
          if (seenResponses.has(url)) return;
          
          if (!/(holding|position|portfolio|invest|equity|stock)/i.test(url)) return;
          
          const contentType = resp.headers()['content-type'] || '';
          if (!contentType.includes('application/json')) return;
          
          const text = await resp.text();
          seenResponses.add(url);
          
          let json: any;
          try { 
            json = JSON.parse(text); 
          } catch { 
            return; 
          }
          
          // Extract holdings data from JSON response
          const rows: any[] = [];
          const extractRows = (node: any) => {
            if (!node) return;
            if (Array.isArray(node) && node.length && typeof node[0] === 'object') {
              rows.push(...node);
            }
            if (typeof node === 'object') {
              for (const key of Object.keys(node)) {
                extractRows(node[key]);
              }
            }
          };
          
          extractRows(json);
          
          for (const row of rows) {
            const name = row.symbol || row.stockName || row.name || row.company || row.scrip || row.ticker;
            const qty = row.quantity ?? row.qty ?? row.units ?? row.shares;
            const avg = row.avgPrice ?? row.average_price ?? row.avg_price ?? row.buyPrice ?? row.avgCost;
            const ltp = row.marketPrice ?? row.last_price ?? row.ltp ?? row.current_price ?? row.price;
            
            if (!name || qty == null) continue;
            
            const clean = (v?: string | number) => (v == null ? undefined : String(v).replace(/[^0-9.\-]/g, ''));
            
            captured.push({
              stockName: String(name),
              quantity: clean(qty) ?? '0',
              avgPrice: clean(avg) ?? null,
              marketPrice: clean(ltp) ?? null,
              sector: null,
              subsector: null,
            });
          }
        } catch (error) {
          log('[seq04][groww-free]', `network monitoring error: ${error}`);
        }
      });

      // Trigger API calls
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000); // Wait 2 seconds for API calls

      // Quick DOM extraction (single pass for free plan)
      const domHoldings: RawHolding[] = await page.evaluate(() => {
        const clean = (v?: string) => (v == null ? undefined : String(v).replace(/[^0-9.\-]/g, ''));
        const rows: RawHolding[] = [];
        
        // Look for holdings table rows
        const trs = Array.from(document.querySelectorAll('tr[data-holding-parent]')) as HTMLTableRowElement[];
        
        for (const tr of trs) {
          // Extract stock name
          const nameEl = tr.querySelector('.holdingRow_symbolWrapper__yI1cn a, a.holdingRow_symbolname__X9SKI, .holdingRow_symbolWrapper__yI1cn, a');
          const stockName = (nameEl?.textContent || '').trim();
          if (!stockName) continue;
          
          // Extract quantity and average price from spans
          const spans = Array.from(tr.querySelectorAll('span')).map(s => (s.textContent || '').trim());
          const qtySpan = spans.find(t => /shares?/i.test(t));
          const avgSpan = spans.find(t => /^Avg\./i.test(t));
          
          const quantity = clean(qtySpan?.match(/([\d,]+)/)?.[1] || '');
          const avgPrice = clean(avgSpan?.match(/₹\s*([\d.,]+)/)?.[1] || '');
          
          // Extract current price from right-aligned cells
          const rightTds = Array.from(tr.querySelectorAll('td')).filter(td =>
            /holdingRow_stk12Pr20/.test((td as HTMLElement).className) ||
            ((td as HTMLElement).style?.textAlign || '').toLowerCase() === 'right'
          );
          
          let marketPrice: string | null = null;
          
          // Find the first right-aligned cell with price (not PnL)
          for (const td of rightTds) {
            const text = (td.textContent || '').replace(/\s+/g, ' ').trim();
            if (/^\+₹/.test(text)) continue; // Skip PnL values
            
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
              if (/^\+₹/.test(text)) continue;
              
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
            avgPrice: avgPrice ?? null,
            marketPrice: marketPrice ?? null,
            sector: null,
            subsector: null,
          });
        }
        
        return rows;
      });

      // Combine and deduplicate
      const allHoldings = [...captured, ...domHoldings];
      const uniqueHoldings = new Map<string, RawHolding>();
      
      for (const holding of allHoldings) {
        const key = holding.stockName.toLowerCase();
        if (!uniqueHoldings.has(key)) {
          uniqueHoldings.set(key, holding);
        }
      }
      
      return Array.from(uniqueHoldings.values());
    }, 35000); // 35 second timeout for extraction

    await onProgress({ percent: 90, stage: `extraction complete - ${holdings.length} holdings found` });
    log('[seq05][groww-free]', `final holdings count: ${holdings.length}`);
    
    return holdings;
    
  } catch (error) {
    log('[seq06][groww-free]', `scraping failed: ${error}`);
    
    // Take error screenshot if helper is available
    if (helper) {
      await helper.screenshotOnError(error, `groww-free-error-${Date.now()}.png`);
    }
    
    throw error;
  } finally {
    // Clean up resources (critical for free plan)
    if (helper) {
      try {
        await helper.cleanup();
        log('[seq07][groww-free]', 'browserless cleanup completed (free plan)');
      } catch (cleanupError) {
        log('[seq07][groww-free]', `cleanup error: ${cleanupError}`);
      }
    }
  }
}

// Alternative function for manual login (when credentials are not available)
export async function scrapeGrowwHoldingsManual(
  onProgress: ProgressFn
): Promise<RawHolding[]> {
  let helper: BrowserlessFreeHelper | null = null;
  
  try {
    // Initialize Browserless helper for free plan
    log('[seq01][groww-manual]', 'initializing browserless helper for manual login');
    helper = createBrowserlessFreeHelper({
      timeout: 50000, // 50 seconds (under 60s free plan limit)
      stealth: true,
      headless: false, // Show browser for manual login
      blockAds: true,
    });

    await onProgress({ percent: 5, stage: 'connecting to browserless (free plan)' });
    await helper.connect();
    
    await onProgress({ percent: 10, stage: 'creating browser page' });
    const page = await helper.createPage();

    await onProgress({ percent: 15, stage: 'opening Groww for manual login' });
    log('[seq02][groww-manual]', 'opening Groww for manual login');

    // Navigate to Groww homepage
    await helper.navigateWithRetry('https://groww.in', { timeout: 15000 });
    
    await onProgress({ 
      percent: 20, 
      stage: 'please complete the login process manually',
      message: 'Browser window opened - please complete login, OTP, and PIN verification'
    });
    
    console.log('🌐 **MANUAL LOGIN REQUIRED**: Please complete the login process in the browser window');
    console.log('📋 **INSTRUCTIONS**:');
    console.log('1. Click "Login/Sign up" button');
    console.log('2. Enter your email address');
    console.log('3. Enter your password');
    console.log('4. Enter OTP sent to your phone (if required)');
    console.log('5. Enter your Groww PIN (if required)');
    console.log('6. Navigate to your holdings page');
    console.log('7. The scraper will automatically detect when you\'re ready');

    // Wait for user to complete login and navigate to holdings
    const loginDeadline = Date.now() + 45 * 1000; // 45 seconds for manual login
    
    while (Date.now() < loginDeadline) {
      const currentUrl = page.url();
      
      // Check if user has logged in and is on holdings page
      if (currentUrl.includes('/stocks/user/holdings') || 
          currentUrl.includes('/dashboard') ||
          (!currentUrl.includes('/login') && !currentUrl.includes('auth'))) {
        
        log('[seq03][groww-manual]', 'manual login detected');
        await onProgress({ percent: 30, stage: 'manual login detected' });
        break;
      }
      
      await page.waitForTimeout(2000); // Check every 2 seconds
    }

    // Verify we're on holdings page
    if (!page.url().includes('/stocks/user/holdings')) {
      // Try to navigate to holdings
      await helper.navigateToHoldings();
    }

    await onProgress({ percent: 40, stage: 'extracting holdings data' });

    // Quick extraction (same as credential-based version)
    const holdings = await helper.quickScrape(async () => {
      // Network capture for API responses (quick)
      const captured: RawHolding[] = [];
      const seenResponses = new Set<string>();
      
      page.on('response', async (resp: any) => {
        try {
          const url = resp.url();
          if (seenResponses.has(url)) return;
          
          if (!/(holding|position|portfolio|invest|equity|stock)/i.test(url)) return;
          
          const contentType = resp.headers()['content-type'] || '';
          if (!contentType.includes('application/json')) return;
          
          const text = await resp.text();
          seenResponses.add(url);
          
          let json: any;
          try { 
            json = JSON.parse(text); 
          } catch { 
            return; 
          }
          
          // Extract holdings data from JSON response
          const rows: any[] = [];
          const extractRows = (node: any) => {
            if (!node) return;
            if (Array.isArray(node) && node.length && typeof node[0] === 'object') {
              rows.push(...node);
            }
            if (typeof node === 'object') {
              for (const key of Object.keys(node)) {
                extractRows(node[key]);
              }
            }
          };
          
          extractRows(json);
          
          for (const row of rows) {
            const name = row.symbol || row.stockName || row.name || row.company || row.scrip || row.ticker;
            const qty = row.quantity ?? row.qty ?? row.units ?? row.shares;
            const avg = row.avgPrice ?? row.average_price ?? row.avg_price ?? row.buyPrice ?? row.avgCost;
            const ltp = row.marketPrice ?? row.last_price ?? row.ltp ?? row.current_price ?? row.price;
            
            if (!name || qty == null) continue;
            
            const clean = (v?: string | number) => (v == null ? undefined : String(v).replace(/[^0-9.\-]/g, ''));
            
            captured.push({
              stockName: String(name),
              quantity: clean(qty) ?? '0',
              avgPrice: clean(avg) ?? null,
              marketPrice: clean(ltp) ?? null,
              sector: null,
              subsector: null,
            });
          }
        } catch (error) {
          log('[seq04][groww-manual]', `network monitoring error: ${error}`);
        }
      });

      // Trigger API calls
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000); // Wait 2 seconds for API calls

      // Quick DOM extraction (single pass for free plan)
      const domHoldings: RawHolding[] = await page.evaluate(() => {
        const clean = (v?: string) => (v == null ? undefined : String(v).replace(/[^0-9.\-]/g, ''));
        const rows: RawHolding[] = [];
        
        // Look for holdings table rows
        const trs = Array.from(document.querySelectorAll('tr[data-holding-parent]')) as HTMLTableRowElement[];
        
        for (const tr of trs) {
          // Extract stock name
          const nameEl = tr.querySelector('.holdingRow_symbolWrapper__yI1cn a, a.holdingRow_symbolname__X9SKI, .holdingRow_symbolWrapper__yI1cn, a');
          const stockName = (nameEl?.textContent || '').trim();
          if (!stockName) continue;
          
          // Extract quantity and average price from spans
          const spans = Array.from(tr.querySelectorAll('span')).map(s => (s.textContent || '').trim());
          const qtySpan = spans.find(t => /shares?/i.test(t));
          const avgSpan = spans.find(t => /^Avg\./i.test(t));
          
          const quantity = clean(qtySpan?.match(/([\d,]+)/)?.[1] || '');
          const avgPrice = clean(avgSpan?.match(/₹\s*([\d.,]+)/)?.[1] || '');
          
          // Extract current price from right-aligned cells
          const rightTds = Array.from(tr.querySelectorAll('td')).filter(td =>
            /holdingRow_stk12Pr20/.test((td as HTMLElement).className) ||
            ((td as HTMLElement).style?.textAlign || '').toLowerCase() === 'right'
          );
          
          let marketPrice: string | null = null;
          
          // Find the first right-aligned cell with price (not PnL)
          for (const td of rightTds) {
            const text = (td.textContent || '').replace(/\s+/g, ' ').trim();
            if (/^\+₹/.test(text)) continue; // Skip PnL values
            
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
              if (/^\+₹/.test(text)) continue;
              
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
            avgPrice: avgPrice ?? null,
            marketPrice: marketPrice ?? null,
            sector: null,
            subsector: null,
          });
        }
        
        return rows;
      });

      // Combine and deduplicate
      const allHoldings = [...captured, ...domHoldings];
      const uniqueHoldings = new Map<string, RawHolding>();
      
      for (const holding of allHoldings) {
        const key = holding.stockName.toLowerCase();
        if (!uniqueHoldings.has(key)) {
          uniqueHoldings.set(key, holding);
        }
      }
      
      return Array.from(uniqueHoldings.values());
    }, 35000); // 35 second timeout for extraction

    await onProgress({ percent: 90, stage: `extraction complete - ${holdings.length} holdings found` });
    log('[seq05][groww-manual]', `final holdings count: ${holdings.length}`);
    
    return holdings;
    
  } catch (error) {
    log('[seq06][groww-manual]', `scraping failed: ${error}`);
    
    // Take error screenshot if helper is available
    if (helper) {
      await helper.screenshotOnError(error, `groww-manual-error-${Date.now()}.png`);
    }
    
    throw error;
  } finally {
    // Clean up resources (critical for free plan)
    if (helper) {
      try {
        await helper.cleanup();
        log('[seq07][groww-manual]', 'browserless cleanup completed (free plan)');
      } catch (cleanupError) {
        log('[seq07][groww-manual]', `cleanup error: ${cleanupError}`);
      }
    }
  }
}
