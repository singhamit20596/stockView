import fs from 'node:fs';
import path from 'node:path';

type SectorRecord = { sector: string; subsector: string };
type SectorMapFile = { byName: Record<string, SectorRecord> };

let cached: SectorMapFile | null = null;

function loadSectorMap(): SectorMapFile {
  if (cached) return cached;
  try {
    const filePath = path.join(process.cwd(), 'data', 'sectorMap.json');
    const json = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(json) as SectorMapFile;
    cached = parsed;
    return parsed;
  } catch {
    cached = { byName: {} };
    return cached;
  }
}

export function inferSectorSubsector(stockName: string): SectorRecord | null {
  const map = loadSectorMap();
  const key = stockName.trim().toLowerCase();
  const hit = map.byName[key];
  return hit ?? null;
}


