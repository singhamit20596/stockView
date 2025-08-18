export type Uuid = string;

export type DecimalString = string; // Always serialize decimals as strings in JSON

export type MarketCapCategory = 'SMALL' | 'MID' | 'LARGE';

export interface Account {
	id: Uuid;
	name: string;
	investedValue: DecimalString;
	currentValue: DecimalString;
	pnl: DecimalString;
	pnlPercent: DecimalString;
	updatedAt: string; // ISO timestamp
	createdAt: string; // ISO timestamp
}

export interface Stock {
	id: Uuid;
	accountId: Uuid;
	accountName: string;
	stockName: string;
	avgPrice: DecimalString;
	marketPrice: DecimalString;
	investedValue: DecimalString;
	currentValue: DecimalString;
	pnl: DecimalString;
	pnlPercent: DecimalString;
	quantity: DecimalString;
	sector?: string | null;
	subsector?: string | null;
	capCategory?: MarketCapCategory | null;
	updatedAt: string;
	createdAt: string;
}

export interface ViewSummary {
	totalInvestedValue: DecimalString;
	totalCurrentValue: DecimalString;
	totalQuantity: DecimalString;
	totalPnl: DecimalString;
	totalPnlPercent: DecimalString;
}

export interface View {
	id: Uuid;
	name: string;
	updatedAt: string;
	createdAt: string;
	viewSummary: ViewSummary;
}

export interface ViewAccount {
	id: Uuid;
	viewId: Uuid;
	accountId: Uuid;
}

export interface ViewStock {
	id: Uuid;
	viewId: Uuid;
	accountName: string;
	stockName: string;
	avgPrice: DecimalString;
	marketPrice: DecimalString;
	investedValue: DecimalString;
	currentValue: DecimalString;
	pnl: DecimalString;
	pnlPercent: DecimalString;
	quantity: DecimalString;
	sector?: string | null;
	subsector?: string | null;
	updatedAt: string;
}

export interface ScrapeStage {
	percent: number; // 0-100
	stage: string;
	message?: string;
}

export interface RawHolding {
	stockName: string;
	quantity: DecimalString;
	avgPrice?: DecimalString | null;
	marketPrice?: DecimalString | null;
	sector?: string | null;
	subsector?: string | null;
}

export interface ScrapePreview {
	raw: RawHolding[];
	mapped: Stock[]; // not yet persisted; accountId/accountName filled, ids temporary
}

export interface ScrapeSession {
	id: Uuid; // jobId
	accountName: string;
	brokerId: string;
	status: 'pending' | 'running' | 'failed' | 'completed' | 'confirmed';
	progress: ScrapeStage;
	preview?: ScrapePreview;
	createdAt: string;
	updatedAt: string;
	error?: string;
}

export interface TableFile<T> {
	meta: { version: number; updatedAt: string };
	rows: T[];
}


