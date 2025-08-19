#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const stocksPath = path.join(process.cwd(), 'data', 'stocks.json');
const sectorMapPath = path.join(process.cwd(), 'data', 'sectorMap.json');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

function main() {
  const stocks = loadJson(stocksPath);
  const sectorMap = loadJson(sectorMapPath);
  const byName = new Map(Object.entries(sectorMap.byName || {}).map(([k, v]) => [k.toLowerCase(), v]));

  let updated = 0;
  // Optionally map market cap by current price bands (rough heuristic). Adjust thresholds to your dataset.
  function inferCapCategory(price) {
    const p = Number(price || '0');
    if (p >= 2000) return 'MEGA';
    if (p >= 1000) return 'LARGE';
    if (p >= 300) return 'MID';
    return 'SMALL';
  }

  for (const row of stocks.rows) {
    const key = String(row.stockName || '').trim().toLowerCase();
    const rec = byName.get(key);
    if (!rec) continue;
    const beforeSector = row.sector ?? null;
    const beforeSub = row.subsector ?? null;
    const nextSector = beforeSector ?? rec.sector ?? null;
    const nextSub = beforeSub ?? rec.subsector ?? null;
    const nextCap = row.capCategory ?? inferCapCategory(row.marketPrice);
    if (nextSector !== beforeSector || nextSub !== beforeSub || nextCap !== row.capCategory) {
      row.sector = nextSector;
      row.subsector = nextSub;
      row.capCategory = nextCap;
      updated++;
    }
  }
  stocks.meta.updatedAt = new Date().toISOString();
  saveJson(stocksPath, stocks);
  console.log(`Updated ${updated} stock rows with sector/subsector.`);
}

main();


