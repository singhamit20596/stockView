#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const p = (f) => path.join(process.cwd(), 'data', f);
const read = (f) => JSON.parse(fs.readFileSync(p(f), 'utf8'));
const write = (f, obj) => fs.writeFileSync(p(f), JSON.stringify(obj, null, 2) + '\n');

function indexStocksByName(stocks) {
  const byName = new Map();
  for (const s of stocks.rows) {
    const key = String(s.stockName || '').toLowerCase();
    const arr = byName.get(key) || [];
    arr.push(s);
    byName.set(key, arr);
  }
  return byName;
}

function latestSectorForName(stocksForName, allowedAccountIds) {
  const rows = stocksForName.filter((r) => !allowedAccountIds || allowedAccountIds.has(r.accountId));
  if (rows.length === 0) return { sector: null, subsector: null };
  rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const latest = rows[0];
  return { sector: latest.sector ?? null, subsector: latest.subsector ?? null, capCategory: latest.capCategory ?? null };
}

function main() {
  const stocks = read('stocks.json');
  const views = read('views.json');
  const viewAccounts = read('viewAccounts.json');
  const viewStocks = read('viewStocks.json');

  const byName = indexStocksByName(stocks);
  const accountsByView = new Map();
  for (const va of viewAccounts.rows) {
    const set = accountsByView.get(va.viewId) || new Set();
    set.add(va.accountId);
    accountsByView.set(va.viewId, set);
  }

  let updated = 0;
  for (const vs of viewStocks.rows) {
    const key = String(vs.stockName || '').toLowerCase();
    const set = accountsByView.get(vs.viewId) || null;
    const arr = byName.get(key) || [];
    const { sector, subsector, capCategory } = latestSectorForName(arr, set);
    const beforeSector = vs.sector ?? null;
    const beforeSub = vs.subsector ?? null;
    const nextSector = beforeSector ?? sector ?? null;
    const nextSub = beforeSub ?? subsector ?? null;
    if (nextSector !== beforeSector || nextSub !== beforeSub || (vs.capCategory ?? null) !== (capCategory ?? null)) {
      vs.sector = nextSector;
      vs.subsector = nextSub;
      vs.capCategory = capCategory ?? null;
      updated++;
    }
  }

  viewStocks.meta.updatedAt = new Date().toISOString();
  write('viewStocks.json', viewStocks);
  console.log(`Updated ${updated} view stock rows with sector/subsector.`);
}

main();


