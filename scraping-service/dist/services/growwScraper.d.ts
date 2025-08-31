interface RawHolding {
    stockName: string;
    quantity: string;
    avgPrice: string;
    marketPrice: string;
    sector: string;
    subsector: string;
}
export declare function scrapeGrowwHoldings(sessionId: string, accountName: string): Promise<RawHolding[]>;
export {};
//# sourceMappingURL=growwScraper.d.ts.map