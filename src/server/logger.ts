import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');
const logFile = path.join(logDir, 'stockview.log');

function ensureLogFile() {
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, '');
  } catch {}
}

export function log(tag: string, ...args: unknown[]) {
  ensureLogFile();
  const iso = new Date().toISOString();
  const line = `[${iso}] ${tag} ${args
    .map((a) => (typeof a === 'string' ? a : (() => { try { return JSON.stringify(a); } catch { return String(a); } })()))
    .join(' ')}`;
  try {
    // echo to console and append to file (sync to reduce lost logs during crashes)
    // eslint-disable-next-line no-console
    console.log(line);
    fs.appendFileSync(logFile, line + '\n');
  } catch {}
}


