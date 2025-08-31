#!/usr/bin/env tsx

import { scrapeGrowwHoldingsWithAccount } from '@/server/brokers/groww';
import { provideOTP } from '@/lib/otpHandler';
import { log } from '@/server/logger';

interface ScrapingConfig {
  accountName: string;
  intervalMinutes: number;
  maxRetries: number;
  enableOTPHandling: boolean;
}

class RealtimeScraper {
  private config: ScrapingConfig;
  private isRunning: boolean = false;
  private retryCount: number = 0;
  private lastScrapeTime: Date | null = null;

  constructor(config: ScrapingConfig) {
    this.config = config;
  }

  async start() {
    if (this.isRunning) {
      log('[realtime-scraper]', 'Scraper is already running');
      return;
    }

    this.isRunning = true;
    log('[realtime-scraper]', `Starting real-time scraping for account: ${this.config.accountName}`);
    log('[realtime-scraper]', `Interval: ${this.config.intervalMinutes} minutes`);
    log('[realtime-scraper]', `Max retries: ${this.config.maxRetries}`);

    // Start the scraping loop
    await this.scrapingLoop();
  }

  async stop() {
    this.isRunning = false;
    log('[realtime-scraper]', 'Stopping real-time scraper');
  }

  private async scrapingLoop() {
    while (this.isRunning) {
      try {
        await this.performScrape();
        this.retryCount = 0; // Reset retry count on success
        
        // Wait for next interval
        if (this.isRunning) {
          const waitTime = this.config.intervalMinutes * 60 * 1000;
          log('[realtime-scraper]', `Waiting ${this.config.intervalMinutes} minutes until next scrape...`);
          await this.sleep(waitTime);
        }
      } catch (error) {
        log('[realtime-scraper]', `Scraping error: ${error}`);
        this.retryCount++;
        
        if (this.retryCount >= this.config.maxRetries) {
          log('[realtime-scraper]', `Max retries (${this.config.maxRetries}) reached. Stopping scraper.`);
          this.isRunning = false;
          break;
        }
        
        // Wait before retry (exponential backoff)
        const retryWaitTime = Math.min(5 * 60 * 1000 * Math.pow(2, this.retryCount - 1), 30 * 60 * 1000);
        log('[realtime-scraper]', `Retrying in ${retryWaitTime / 1000 / 60} minutes... (attempt ${this.retryCount}/${this.config.maxRetries})`);
        await this.sleep(retryWaitTime);
      }
    }
  }

  private async performScrape() {
    const startTime = Date.now();
    log('[realtime-scraper]', `Starting scrape at ${new Date().toISOString()}`);

    const onProgress = (stage: { percent: number; stage: string; message?: string }) => {
      log('[realtime-scraper]', `Progress: ${stage.percent}% - ${stage.stage}`);
      if (stage.message) {
        log('[realtime-scraper]', `Message: ${stage.message}`);
      }
    };

    const onOTPRequest = this.config.enableOTPHandling ? async (otp: string) => {
      log('[realtime-scraper]', 'OTP required - waiting for manual input');
      console.log('🔐 **OTP REQUIRED**: Please provide OTP using:');
      console.log(`   provideOTP('groww-session', 'YOUR_OTP')`);
      console.log('⏰ **TIMEOUT**: 60 seconds');
    } : undefined;

    try {
      const holdings = await scrapeGrowwHoldingsWithAccount(
        this.config.accountName,
        onProgress,
        onOTPRequest
      );

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      log('[realtime-scraper]', `✅ Scrape completed successfully!`);
      log('[realtime-scraper]', `📊 Holdings found: ${holdings.length}`);
      log('[realtime-scraper]', `⏱️ Duration: ${duration.toFixed(2)} seconds`);
      log('[realtime-scraper]', `💰 Total value: ₹${this.calculateTotalValue(holdings).toLocaleString()}`);

      this.lastScrapeTime = new Date();
      
      // Log holdings summary
      this.logHoldingsSummary(holdings);

    } catch (error) {
      log('[realtime-scraper]', `❌ Scrape failed: ${error}`);
      throw error;
    }
  }

  private calculateTotalValue(holdings: any[]): number {
    return holdings.reduce((total, holding) => {
      const quantity = parseFloat(holding.quantity) || 0;
      const price = parseFloat(holding.marketPrice) || 0;
      return total + (quantity * price);
    }, 0);
  }

  private logHoldingsSummary(holdings: any[]) {
    log('[realtime-scraper]', '📋 Holdings Summary:');
    
    const topHoldings = holdings
      .sort((a, b) => {
        const aValue = (parseFloat(a.quantity) || 0) * (parseFloat(a.marketPrice) || 0);
        const bValue = (parseFloat(b.quantity) || 0) * (parseFloat(b.marketPrice) || 0);
        return bValue - aValue;
      })
      .slice(0, 5);

    topHoldings.forEach((holding, index) => {
      const quantity = parseFloat(holding.quantity) || 0;
      const price = parseFloat(holding.marketPrice) || 0;
      const value = quantity * price;
      
      log('[realtime-scraper]', `  ${index + 1}. ${holding.stockName}: ${quantity} shares @ ₹${price} = ₹${value.toLocaleString()}`);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      accountName: this.config.accountName,
      intervalMinutes: this.config.intervalMinutes,
      retryCount: this.retryCount,
      maxRetries: this.config.maxRetries,
      lastScrapeTime: this.lastScrapeTime,
    };
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npm run scrape:realtime <account-name> [interval-minutes] [max-retries]');
    console.log('');
    console.log('Examples:');
    console.log('  npm run scrape:realtime groww_main');
    console.log('  npm run scrape:realtime groww_main 15');
    console.log('  npm run scrape:realtime groww_main 30 5');
    console.log('');
    console.log('Arguments:');
    console.log('  account-name     - Name of the account in credentials table');
    console.log('  interval-minutes - Scraping interval in minutes (default: 30)');
    console.log('  max-retries      - Maximum retry attempts (default: 3)');
    process.exit(1);
  }

  const accountName = args[0];
  const intervalMinutes = parseInt(args[1]) || 30;
  const maxRetries = parseInt(args[2]) || 3;

  const config: ScrapingConfig = {
    accountName,
    intervalMinutes,
    maxRetries,
    enableOTPHandling: true,
  };

  const scraper = new RealtimeScraper(config);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await scraper.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await scraper.stop();
    process.exit(0);
  });

  // Start scraping
  await scraper.start();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { RealtimeScraper, type ScrapingConfig };
