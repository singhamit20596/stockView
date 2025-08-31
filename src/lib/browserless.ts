import { chromium } from 'playwright-core';
import { log } from '@/server/logger';

// Browserless.io Configuration
export interface BrowserlessConfig {
  token: string;
  region?: 'production-sfo' | 'production-lon' | 'production-ams';
  timeout?: number;
  stealth?: boolean;
  headless?: boolean;
  blockAds?: boolean;
  slowMo?: number;
}

// Default configuration
const DEFAULT_CONFIG: BrowserlessConfig = {
  token: process.env.BROWSERLESS_TOKEN || '',
  region: 'production-sfo',
  timeout: 300000, // 5 minutes
  stealth: true,
  headless: true,
  blockAds: true,
  slowMo: 0,
};

// Browserless Helper Class
export class BrowserlessHelper {
  private config: BrowserlessConfig;
  private browser: any = null;
  private page: any = null;
  private cdpSession: any = null;
  private reconnectEndpoint: string | null = null;

  constructor(config: Partial<BrowserlessConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (!this.config.token) {
      throw new Error('BROWSERLESS_TOKEN environment variable is required');
    }
  }

  // Create connection URL with all options
  private createConnectionURL(): string {
    const { token, region, timeout, stealth, headless, blockAds, slowMo } = this.config;
    
    const queryParams = new URLSearchParams({
      token,
      timeout: timeout?.toString() || '300000',
      stealth: stealth?.toString() || 'true',
      headless: headless?.toString() || 'true',
      blockAds: blockAds?.toString() || 'true',
      slowMo: slowMo?.toString() || '0',
    });

    return `wss://${region}.browserless.io/chrome?${queryParams.toString()}`;
  }

  // Connect to Browserless
  async connect() {
    try {
      const connectionURL = this.createConnectionURL();
      log('[browserless]', `Connecting to ${this.config.region}.browserless.io`);
      
      this.browser = await chromium.connectOverCDP(connectionURL);
      
      // Set up browser monitoring
      this.setupBrowserMonitoring();
      
      log('[browserless]', 'Successfully connected to Browserless');
      return this.browser;
    } catch (error) {
      log('[browserless]', `Connection failed: ${error}`);
      throw error;
    }
  }

  // Create page with monitoring
  async createPage() {
    if (!this.browser) {
      throw new Error('Browser not connected. Call connect() first.');
    }

    this.page = await this.browser.newPage();
    this.setupPageMonitoring();
    
    // Create CDP session for advanced features
    this.cdpSession = await this.page.context().newCDPSession(this.page);
    
    return this.page;
  }

  // Set up browser monitoring
  private setupBrowserMonitoring() {
    this.browser.on('disconnected', () => {
      log('[browserless]', 'Browser disconnected unexpectedly');
    });
  }

  // Set up page monitoring
  private setupPageMonitoring() {
    this.page.on('requestfailed', (request: any) => {
      log('[browserless]', `Request failed: ${request.url()} - ${request.failure()}`);
    });

    this.page.on('response', (response: any) => {
      if (!response.ok()) {
        log('[browserless]', `Response error: ${response.url()} - ${response.status()}`);
      }
    });

    this.page.on('pageerror', (error: any) => {
      log('[browserless]', `Page error: ${error.message}`);
    });
  }

  // Navigate with retry logic
  async navigateWithRetry(url: string, options: any = {}) {
    const defaultOptions = {
      waitUntil: 'domcontentloaded' as const,
      timeout: 30000,
      ...options
    };

    const maxRetries = 3;
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.page.goto(url, defaultOptions);
        return;
      } catch (error) {
        lastError = error;
        log('[browserless]', `Navigation attempt ${i + 1} failed: ${error}`);
        
        if (i < maxRetries - 1) {
          await this.delay(1000 * (i + 1)); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  // Create interactive session for user login
  async createInteractiveSession(options: any = {}) {
    if (!this.cdpSession) {
      throw new Error('CDP session not available. Call createPage() first.');
    }

    const defaultOptions = {
      timeout: 300000, // 5 minutes for login
      quality: 80, // Higher quality for login forms
      interactable: true,
      resizable: true,
      showBrowserInterface: false, // Disable multi-tab for security
      ...options
    };

    try {
      const { liveURL } = await this.cdpSession.send('Browserless.liveURL', defaultOptions);
      log('[browserless]', `Interactive session created: ${liveURL}`);
      return { liveURL, cdpSession: this.cdpSession };
    } catch (error) {
      log('[browserless]', `Failed to create interactive session: ${error}`);
      throw error;
    }
  }

  // Wait for user to complete interactive session
  async waitForUserCompletion() {
    return new Promise<void>((resolve) => {
      this.cdpSession.on('Browserless.liveComplete', () => {
        log('[browserless]', 'User completed interactive session');
        resolve();
      });
    });
  }

  // Listen for captcha detection
  async waitForCaptchaDetection(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.cdpSession.on('Browserless.captchaFound', () => {
        log('[browserless]', 'Captcha detected on the page!');
        resolve(true);
      });
      
      // Timeout after 30 seconds if no captcha found
      setTimeout(() => resolve(false), 30000);
    });
  }

  // Solve captcha automatically
  async solveCaptcha() {
    try {
      const { solved, error } = await this.cdpSession.send('Browserless.solveCaptcha', {
        appearTimeout: 30000,
      });

      if (solved) {
        log('[browserless]', 'Captcha solved automatically');
        return { success: true, method: 'automated' };
      } else {
        log('[browserless]', `Captcha solving failed: ${error}`);
        return { success: false, error };
      }
    } catch (error) {
      log('[browserless]', `Captcha solving error: ${error}`);
      return { success: false, error };
    }
  }

  // Set up session reconnection for persistence
  async setupSessionReconnection(timeout: number = 60000) {
    if (!this.cdpSession) {
      throw new Error('CDP session not available. Call createPage() first.');
    }

    try {
      const { browserWSEndpoint } = await this.cdpSession.send('Browserless.reconnect', {
        timeout,
      });
      
      this.reconnectEndpoint = browserWSEndpoint;
      log('[browserless]', `Session reconnection enabled for ${timeout}ms`);
      return browserWSEndpoint;
    } catch (error) {
      log('[browserless]', `Failed to setup session reconnection: ${error}`);
      throw error;
    }
  }

  // Reconnect to existing session
  async reconnectToSession(reconnectEndpoint: string) {
    try {
      const queryParams = new URLSearchParams({
        token: this.config.token,
        timeout: this.config.timeout?.toString() || '300000',
      });

      const connectionURL = `${reconnectEndpoint}?${queryParams.toString()}`;
      this.browser = await chromium.connectOverCDP(connectionURL);
      
      this.setupBrowserMonitoring();
      log('[browserless]', 'Successfully reconnected to session');
      
      return this.browser;
    } catch (error) {
      log('[browserless]', `Failed to reconnect to session: ${error}`);
      throw error;
    }
  }

  // Take screenshot on error
  async screenshotOnError(error: any, filename: string = 'error-screenshot.png') {
    try {
      if (this.page) {
        await this.page.screenshot({
          path: filename,
          fullPage: true,
          type: 'png'
        });
        log('[browserless]', `Error screenshot saved: ${filename}`);
        return filename;
      }
    } catch (screenshotError) {
      log('[browserless]', `Failed to take error screenshot: ${screenshotError}`);
    }
    return null;
  }

  // Clean up resources
  async cleanup() {
    try {
      if (this.browser && this.browser.isConnected()) {
        await this.browser.close();
        log('[browserless]', 'Browser closed successfully');
      }
    } catch (error) {
      log('[browserless]', `Error during cleanup: ${error}`);
    }
  }

  // Utility delay function
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get current page
  getPage() {
    return this.page;
  }

  // Get CDP session
  getCDPSession() {
    return this.cdpSession;
  }

  // Get reconnect endpoint
  getReconnectEndpoint() {
    return this.reconnectEndpoint;
  }
}

// Factory function to create BrowserlessHelper
export function createBrowserlessHelper(config?: Partial<BrowserlessConfig>) {
  return new BrowserlessHelper(config);
}

// Environment-based browser creation
export async function createBrowser(config?: Partial<BrowserlessConfig>) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    const helper = createBrowserlessHelper(config);
    await helper.connect();
    return helper;
  } else {
    // For development, use local browser
    const { chromium } = await import('playwright-core');
    const browser = await chromium.launch({
      headless: false,
      devtools: true,
      slowMo: 100,
    });
    
    // Create a mock helper for development
    const helper = new BrowserlessHelper(config);
    helper['browser'] = browser;
    return helper;
  }
}
