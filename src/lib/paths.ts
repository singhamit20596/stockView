import path from 'path';

export const projectRoot = process.cwd();
export const dataDir = path.join(projectRoot, 'data');

export const tableFilePaths = {
	accounts: path.join(dataDir, 'accounts.json'),
	stocks: path.join(dataDir, 'stocks.json'),
	views: path.join(dataDir, 'views.json'),
	viewAccounts: path.join(dataDir, 'viewAccounts.json'),
	viewStocks: path.join(dataDir, 'viewStocks.json'),
	scrapeSessions: path.join(dataDir, 'scrapeSessions.json'),
} as const;


