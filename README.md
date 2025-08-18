stockView – Local portfolio viewer with live scraping

## Setup

Prereqs: Node 20+, npm, Chromium (Playwright installs browsers automatically on first run).

1) Install
```bash
npm install
```

2) Run (live scraping)
```bash
export SCRAPE_MODE=live
npm run dev
# open http://localhost:3000
```

3) Add Account wizard
- Enter account name → Check availability
- Select broker (Groww) → Create & Scrape
- A Chromium window opens; log in to Groww
- The app extracts → scrolls → extracts until complete, then auto‑closes
- Preview appears; Confirm & Save writes JSON to `data/`

## Logs
- Server logs: `tail -F logs/stockview.log`
- Client logs: browser DevTools console (React Query Devtools enabled)

## Backup
Create a timestamped backup of all tables under `backups/<ts>/data`:
```bash
TS=$(date +%Y%m%d-%H%M%S)
mkdir -p backups/$TS/data
cp -a data/*.json backups/$TS/data/
echo "backup at backups/$TS/data"
```

Optionally commit and tag the backup:
```bash
git add backups/$TS/data
git commit -m "chore(backup): add data backup $TS"
git tag -a backup-$TS -m "backup $TS"
git push origin main --tags
```

## Restore
From backup folder:
```bash
cp -a backups/<ts>/data/*.json data/
```

From git tag:
```bash
git fetch --tags
git checkout tags/backup-<ts> -b restore-<ts>
```
