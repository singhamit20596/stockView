import type { RawHolding } from '@/lib/types';
import { log } from '@/server/logger';

type ProgressFn = (stage: { percent: number; stage: string; message?: string }) => Promise<void> | void;

export async function scrapeGrowwHoldingsLive(onProgress: ProgressFn): Promise<RawHolding[]> {
  const { chromium } = await import('playwright');
  log('[seq01][groww]', 'launching chromium (headed)');
  const browser = await chromium.launch({ headless: false, slowMo: 0 });
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    const loginUrl = 'https://groww.in/login';
    const holdingsUrl = 'https://groww.in/stocks/user/holdings';
    await onProgress({ percent: 10, stage: 'opening login' });
    log('[seq02][groww]', 'goto login');
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
    await onProgress({ percent: 20, stage: 'waiting for user login (up to 5m)' });
    log('[seq03][groww]', 'waiting for user login');

    // 1) Wait until user has logged in (i.e., we are no longer on the login route)
    const deadline = Date.now() + 5 * 60 * 1000;
    while (true) {
      const urlNow = page.url();
      if (!urlNow.includes('/login')) {
        log('[seq04][groww]', 'login detected; url=', urlNow);
        await onProgress({ percent: 30, stage: 'login detected' });
        break;
      }
      if (Date.now() > deadline) throw new Error('Login timeout');
      await new Promise((r) => setTimeout(r, 1000));
    }

    // 2) Navigate to holdings (only after login detected)
    const holdingsDeadline = Date.now() + 3 * 60 * 1000;
    // eslint-disable-next-line no-constant-condition
    log('[seq05][groww]', 'navigate to holdings loop start');
    while (true) {
      const url = page.url();
      if (url.includes('/stocks/user/holdings')) { log('[seq06][groww]', 'on holdings by url'); break; }
      if (Date.now() > holdingsDeadline) throw new Error('Holdings navigation timeout');
      try {
        await page.goto(holdingsUrl, { waitUntil: 'domcontentloaded' });
        if (page.url().includes('/stocks/user/holdings')) { log('[seq06][groww]', 'navigated to holdings'); break; }
      } catch {}
      // Try clicking any visible Holdings link/button in the UI
      try {
        const loc1 = page.locator('a[href*="/stocks/user/holdings"]');
        if (await loc1.first().isVisible()) {
          log('[seq05a][groww]', 'clicking holdings link (href match)');
          await loc1.first().click({ timeout: 2000 });
        }
      } catch {}
      try {
        const loc2 = page.locator('a:has-text("Holdings"), button:has-text("Holdings")');
        if (await loc2.first().isVisible()) {
          log('[seq05b][groww]', 'clicking holdings link (text match)');
          await loc2.first().click({ timeout: 2000 });
        }
      } catch {}
      // Also detect by content in case URL is masked
      const onHoldings = await page.evaluate(() => {
        const hasTable = !!document.querySelector('table');
        const text = document.body.innerText || '';
        return hasTable && /holding/i.test(text);
      });
      if (onHoldings) { log('[seq06][groww]', 'detected holdings by content'); break; }
      await new Promise((r) => setTimeout(r, 1500));
    }
    await onProgress({ percent: 40, stage: 'on holdings page' });
    // Try activating the right tab if applicable
    try {
      const tab = page.locator('button:has-text("Holdings"), a:has-text("Holdings"), button:has-text("Stocks"), a:has-text("Stocks")');
      if (await tab.first().isVisible()) {
        log('[seq07][groww]', 'clicking holdings/stocks tab');
        await tab.first().click({ timeout: 2000 });
      }
    } catch {}

    // Network capture: try to read JSON holdings directly from API responses
    const captured: RawHolding[] = [];
    const seenResponses = new Set<string>();
    log('[seq09][groww]', 'attach network listeners');
    page.on('response', async (resp) => {
      try {
        const url = resp.url();
        if (seenResponses.has(url)) return;
        // Heuristics: endpoints likely containing holdings/positions/portfolio
        if (!/(holding|position|portfolio|invest|equity|stock)/i.test(url)) return;
        const ct = resp.headers()['content-type'] || '';
        if (!ct.includes('application/json')) return;
        const text = await resp.text();
        seenResponses.add(url);
        let json: any;
        try { json = JSON.parse(text); } catch { return; }
        // Flatten arrays of potential rows
        const rows: any[] = [];
        const dig = (node: any) => {
          if (!node) return;
          if (Array.isArray(node) && node.length && typeof node[0] === 'object') rows.push(...node);
          if (typeof node === 'object') for (const k of Object.keys(node)) dig(node[k]);
        };
        dig(json);
        for (const r of rows) {
          const name = r.symbol || r.stockName || r.name || r.company || r.scrip || r.ticker;
          const qty = r.quantity ?? r.qty ?? r.units ?? r.shares;
          const avg = r.avgPrice ?? r.average_price ?? r.avg_price ?? r.buyPrice ?? r.avgCost;
          const ltp = r.marketPrice ?? r.last_price ?? r.ltp ?? r.current_price ?? r.price;
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
      } catch {}
    });

    // Nudge the app to fire APIs: small reload of holdings page
    try { await page.reload({ waitUntil: 'domcontentloaded' }); } catch {}
    // Wait briefly for network captures
    await new Promise((r) => setTimeout(r, 3000));
    if (captured.length > 0) {
      log('[seq10][groww]', `network captured ${captured.length} rows`);
      await onProgress({ percent: 55, stage: `network captured ${captured.length} rows` });
    } else {
      log('[seq10][groww]', 'network capture yielded 0');
    }

    // Extraction loop: extract -> scroll -> extract until no new rows added
    const aggregate: RawHolding[] = [];
    let prevCount = -1;
    let pass = 0;
    while (true) {
      pass += 1;
      log('[seq11][groww]', `extract pass ${pass}`);
      // Extract current viewport using Groww-specific row structure
      const mapped: RawHolding[] = await page.evaluate(() => {
        const clean = (v?: string) => (v == null ? undefined : String(v).replace(/[^0-9.\-]/g, ''));
        const rows: RawHolding[] = [] as any;
        const trs = Array.from(document.querySelectorAll('tr[data-holding-parent]')) as HTMLTableRowElement[];
        for (const tr of trs) {
          // stock name
          const nameEl = tr.querySelector('.holdingRow_symbolWrapper__yI1cn a, a.holdingRow_symbolname__X9SKI, .holdingRow_symbolWrapper__yI1cn, a');
          const stockName = (nameEl?.textContent || '').trim();
          if (!stockName) continue;
          // qty and avg in spans
          const spans = Array.from(tr.querySelectorAll('span')).map(s => (s.textContent || '').trim());
          const qtySpan = spans.find(t => /shares?/i.test(t));
          const avgSpan = spans.find(t => /^Avg\./i.test(t));
          const quantity = clean(qtySpan?.match(/([\d,]+)/)?.[1] || '');
          const avgPrice = clean(avgSpan?.match(/₹\s*([\d.,]+)/)?.[1] || '');
          // current price from right-aligned tds
          const rightTds = Array.from(tr.querySelectorAll('td')).filter(td =>
            /holdingRow_stk12Pr20/.test((td as HTMLElement).className)
            || ((td as HTMLElement).style?.textAlign || '').toLowerCase() === 'right');
          let marketPrice: string | null = null;
          // Prefer the first right-aligned cell that starts with "₹" and is not a PnL (not starting with +₹)
          for (const td of rightTds) {
            const text = (td.textContent || '').replace(/\s+/g, ' ').trim();
            if (/^\+₹/.test(text)) continue; // skip PnL values explicitly
            const single = text.match(/^₹\s*([\d.,]+)/);
            if (single) { marketPrice = String(parseFloat(single[1].replace(/[^0-9.]/g, ''))); break; }
          }
          // Fallback: any first ₹ number that is not prefixed with +₹
          if (!marketPrice) {
            for (const td of rightTds) {
              const text = (td.textContent || '').replace(/\s+/g, ' ').trim();
              if (/^\+₹/.test(text)) continue;
              const any = text.match(/₹\s*([\d.,]+)/);
              if (any) { marketPrice = String(parseFloat(any[1].replace(/[^0-9.]/g, ''))); break; }
            }
          }
          rows.push({ stockName, quantity: quantity ?? '0', avgPrice: avgPrice ?? null, marketPrice: marketPrice ?? null, sector: null, subsector: null } as any);
        }
        return rows;
      });
      // merge
      const byName = new Map<string, RawHolding>(aggregate.map((h) => [h.stockName.toLowerCase(), h]));
      for (const h of mapped) if (h.stockName && !byName.has(h.stockName.toLowerCase())) byName.set(h.stockName.toLowerCase(), h);
      aggregate.splice(0, aggregate.length, ...Array.from(byName.values()));
      log('[seq13][groww]', `total extracted ${aggregate.length}`);
      await onProgress({ percent: 55, stage: `extraction pass ${pass} - total ${aggregate.length}` });
      // scroll small step
      log('[seq08][groww]', 'scroll pass');
      const reachedEnd = await page.evaluate(() => {
        const prev = window.scrollY;
        window.scrollBy(0, Math.max(400, Math.floor(window.innerHeight * 0.8)));
        return window.scrollY === prev;
      });
      if (reachedEnd || aggregate.length === prevCount) break;
      prevCount = aggregate.length;
      await new Promise((r) => setTimeout(r, 500));
    }

    await onProgress({ percent: 70, stage: `extracted ${aggregate.length} rows` });
    return aggregate;
  } finally {
    try {
      await context.close();
      await browser.close();
      log('[seq14][groww]', 'browser closed');
    } catch {
      // ignore
    }
  }
}


