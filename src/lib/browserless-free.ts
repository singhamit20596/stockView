import { chromium } from 'playwright-core';
import { log } from '@/server/logger';
import type { GrowwCredentials, OTPInputCallback } from './types';

// Browserless.io Configuration for Free Plan
export interface BrowserlessFreeConfig {
  token: string;
  region?: 'production-sfo' | 'production-lon' | 'production-ams';
  timeout?: number;
  stealth?: boolean;
  headless?: boolean;
  blockAds?: boolean;
  slowMo?: number;
}

// Default configuration optimized for free plan
const DEFAULT_FREE_CONFIG: BrowserlessFreeConfig = {
  token: process.env.BROWSERLESS_TOKEN || '',
  region: 'production-sfo',
  timeout: 50000, // 50 seconds (under 60s free plan limit)
  stealth: true,
  headless: true,
  blockAds: true,
  slowMo: 0,
};

// Groww login selectors based on the screenshots
const GROWW_SELECTORS = {
  // Initial login button
  loginButton: 'button:has-text("Login/Sign up"), a:has-text("Login"), [data-testid="login-button"]',
  
  // Email input
  emailInput: 'input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]',
  
  // Password input
  passwordInput: 'input[type="password"], input[name="password"], input[placeholder*="password"], input[placeholder*="Password"]',
  
  // Submit buttons
  continueButton: 'button:has-text("Continue"), button:has-text("Submit"), input[type="submit"]',
  
  // OTP input fields
  otpInputs: 'input[type="text"][maxlength="1"], input[type="number"][maxlength="1"], .otp-input input',
  
  // PIN input fields
  pinInputs: 'input[type="password"][maxlength="1"], input[type="text"][maxlength="1"], .pin-input input',
  
  // Success indicators
  loginSuccess: '.user-profile, [data-testid="user-menu"], .dashboard, .holdings',
  
  // Holdings link
  holdingsLink: 'a[href*="/holdings"], a:has-text("Holdings"), button:has-text("Holdings")',
};

// Browserless Helper for Free Plan
export class BrowserlessFreeHelper {
  private config: BrowserlessFreeConfig;
  private browser: any = null;
  private page: any = null;
  private cdpSession: any = null;

  constructor(config: Partial<BrowserlessFreeConfig> = {}) {
    this.config = { ...DEFAULT_FREE_CONFIG, ...config };
    
    if (!this.config.token) {
      throw new Error('BROWSERLESS_TOKEN environment variable is required');
    }
  }

  // Create connection URL optimized for free plan
  private createConnectionURL(): string {
    const { token, region, timeout, stealth, headless, blockAds, slowMo } = this.config;
    
    const queryParams = new URLSearchParams({
      token,
      timeout: timeout?.toString() || '50000', // Keep under 60s
      stealth: stealth?.toString() || 'true',
      headless: headless?.toString() || 'true',
      blockAds: blockAds?.toString() || 'true',
      slowMo: slowMo?.toString() || '0',
    });

    return `wss://${region}.browserless.io/chrome?${queryParams.toString()}`;
  }

  // Connect to Browserless (optimized for free plan)
  async connect() {
    try {
      const connectionURL = this.createConnectionURL();
      log('[browserless-free]', `Connecting to ${this.config.region}.browserless.io (free plan)`);
      
      this.browser = await chromium.connectOverCDP(connectionURL);
      
      // Set up browser monitoring
      this.setupBrowserMonitoring();
      
      log('[browserless-free]', 'Successfully connected to Browserless (free plan)');
      return this.browser;
    } catch (error) {
      log('[browserless-free]', `Connection failed: ${error}`);
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
    
    // Create CDP session for basic features
    this.cdpSession = await this.page.context().newCDPSession(this.page);
    
    return this.page;
  }

  // Set up browser monitoring
  private setupBrowserMonitoring() {
    this.browser.on('disconnected', () => {
      log('[browserless-free]', 'Browser disconnected unexpectedly');
    });
  }

  // Set up page monitoring
  private setupPageMonitoring() {
    this.page.on('requestfailed', (request: any) => {
      log('[browserless-free]', `Request failed: ${request.url()} - ${request.failure()}`);
    });

    this.page.on('response', (response: any) => {
      if (!response.ok()) {
        log('[browserless-free]', `Response error: ${response.url()} - ${response.status()}`);
      }
    });

    this.page.on('pageerror', (error: any) => {
      log('[browserless-free]', `Page error: ${error.message}`);
    });
  }

  // Navigate with retry logic (optimized for free plan)
  async navigateWithRetry(url: string, options: any = {}) {
    const defaultOptions = {
      waitUntil: 'domcontentloaded' as const,
      timeout: 20000, // Reduced timeout for free plan
      ...options
    };

    const maxRetries = 2; // Reduced retries for free plan
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.page.goto(url, defaultOptions);
        return;
      } catch (error) {
        lastError = error;
        log('[browserless-free]', `Navigation attempt ${i + 1} failed: ${error}`);
        
        if (i < maxRetries - 1) {
          await this.delay(1000 * (i + 1)); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  // Complete Groww multi-step login process
  async loginToGroww(
    credentials: GrowwCredentials,
    onOTPRequest?: OTPInputCallback
  ): Promise<boolean> {
    try {
      log('[browserless-free]', 'Starting Groww multi-step login process');
      
      // Step 1: Navigate to Groww homepage
      await this.navigateWithRetry('https://groww.in', { timeout: 15000 });
      log('[browserless-free]', 'Navigated to Groww homepage');
      
      // Step 2: Click login button
      await this.clickLoginButton();
      
      // Step 3: Enter email
      await this.enterEmail(credentials.username);
      
      // Step 4: Enter password
      await this.enterPassword(credentials.password);
      
      // Step 5: Handle OTP if required
      const otpRequired = await this.checkForOTP();
      if (otpRequired) {
        if (!onOTPRequest) {
          throw new Error('OTP required but no OTP callback provided');
        }
        await this.handleOTP(onOTPRequest);
      }
      
      // Step 6: Enter PIN
      const pinRequired = await this.checkForPIN();
      if (pinRequired) {
        await this.enterPIN(credentials.pin);
      }
      
      // Step 7: Verify login success
      const loginSuccess = await this.verifyLoginSuccess();
      if (!loginSuccess) {
        throw new Error('Login verification failed');
      }
      
      log('[browserless-free]', 'Groww multi-step login completed successfully');
      return true;
      
    } catch (error) {
      log('[browserless-free]', `Groww login failed: ${error}`);
      throw error;
    }
  }

  // Click the login button on homepage
  private async clickLoginButton(): Promise<void> {
    try {
      // Wait for login button to be visible
      await this.page.waitForSelector(GROWW_SELECTORS.loginButton, { timeout: 10000 });
      
      // Click login button
      await this.page.click(GROWW_SELECTORS.loginButton);
      log('[browserless-free]', 'Clicked login button');
      
      // Wait for login modal/form to appear
      await this.page.waitForTimeout(2000);
      
    } catch (error) {
      log('[browserless-free]', `Failed to click login button: ${error}`);
      throw error;
    }
  }

  // Enter email address
  private async enterEmail(email: string): Promise<void> {
    try {
      // Wait for email input field
      await this.page.waitForSelector(GROWW_SELECTORS.emailInput, { timeout: 10000 });
      
      // Clear and fill email
      await this.page.fill(GROWW_SELECTORS.emailInput, email);
      log('[browserless-free]', 'Entered email address');
      
      // Click continue/submit
      await this.page.click(GROWW_SELECTORS.continueButton);
      
      // Wait for next step
      await this.page.waitForTimeout(2000);
      
    } catch (error) {
      log('[browserless-free]', `Failed to enter email: ${error}`);
      throw error;
    }
  }

  // Enter password
  private async enterPassword(password: string): Promise<void> {
    try {
      // Wait for password input field
      await this.page.waitForSelector(GROWW_SELECTORS.passwordInput, { timeout: 10000 });
      
      // Clear and fill password
      await this.page.fill(GROWW_SELECTORS.passwordInput, password);
      log('[browserless-free]', 'Entered password');
      
      // Click submit
      await this.page.click(GROWW_SELECTORS.continueButton);
      
      // Wait for next step
      await this.page.waitForTimeout(2000);
      
    } catch (error) {
      log('[browserless-free]', `Failed to enter password: ${error}`);
      throw error;
    }
  }

  // Check if OTP is required
  private async checkForOTP(): Promise<boolean> {
    try {
      // Look for OTP input fields or OTP-related text
      const otpElements = await this.page.$$(GROWW_SELECTORS.otpInputs);
      const otpText = await this.page.textContent('body');
      
      const hasOTPInputs = otpElements.length > 0;
      const hasOTPText = otpText?.toLowerCase().includes('otp') || 
                        otpText?.toLowerCase().includes('one-time password') ||
                        otpText?.toLowerCase().includes('verify');
      
      const otpRequired = hasOTPInputs || hasOTPText;
      
      if (otpRequired) {
        log('[browserless-free]', 'OTP verification required');
      }
      
      return otpRequired;
      
    } catch (error) {
      log('[browserless-free]', `Error checking for OTP: ${error}`);
      return false;
    }
  }

  // Handle OTP input with user callback
  private async handleOTP(onOTPRequest: OTPInputCallback): Promise<void> {
    try {
      log('[browserless-free]', 'Waiting for OTP input from user');
      
      // Take screenshot to show OTP screen
      const screenshotPath = await this.page.screenshot({
        path: `otp-request-${Date.now()}.png`,
        fullPage: true
      });
      
      console.log(`🔐 **OTP REQUIRED**: Please check the screenshot at ${screenshotPath} and enter the OTP`);
      console.log('📱 The OTP has been sent to your registered phone number');
      console.log('💡 **HOW TO PROVIDE OTP**:');
      console.log('   1. Check the screenshot to see the OTP screen');
      console.log('   2. Enter the OTP using: provideOTP("groww-session", "YOUR_OTP")');
      console.log('   3. Or use the OTP handler in your code');
      
      // Wait for user to provide OTP
      const otp = await this.waitForOTPInput(onOTPRequest);
      
      // Enter OTP
      await this.enterOTP(otp);
      
      log('[browserless-free]', 'OTP entered successfully');
      
    } catch (error) {
      log('[browserless-free]', `Failed to handle OTP: ${error}`);
      throw error;
    }
  }

  // Wait for OTP input from user
  private async waitForOTPInput(onOTPRequest: OTPInputCallback): Promise<string> {
    const sessionId = 'groww-session';
    
    // Call the user's OTP callback to notify about OTP requirement
    onOTPRequest('').catch(error => {
      log('[browserless-free]', `OTP callback error: ${error}`);
    });
    
    // Set up manual input mechanism
    console.log('⏳ **WAITING FOR OTP**: The scraper is paused waiting for OTP input');
    console.log('📝 **TO PROVIDE OTP**: Run this command in your terminal:');
    console.log(`   provideOTP("${sessionId}", "YOUR_6_DIGIT_OTP")`);
    console.log('⏰ **TIMEOUT**: 60 seconds remaining...');
    
    try {
      // Wait for OTP using the enhanced handler
      const { waitForOTP } = await import('./otpHandler');
      const otp = await waitForOTP(sessionId, 60000);
      
      console.log('✅ OTP received successfully - continuing...');
      return otp;
      
    } catch (error) {
      log('[browserless-free]', `OTP wait failed: ${error}`);
      throw error;
    }
  }

  // Enter OTP in the input fields
  private async enterOTP(otp: string): Promise<void> {
    try {
      // Wait for OTP input fields
      await this.page.waitForSelector(GROWW_SELECTORS.otpInputs, { timeout: 10000 });
      
      // Get all OTP input fields
      const otpInputs = await this.page.$$(GROWW_SELECTORS.otpInputs);
      
      if (otpInputs.length === 0) {
        throw new Error('No OTP input fields found');
      }
      
      // Enter OTP digit by digit
      for (let i = 0; i < Math.min(otp.length, otpInputs.length); i++) {
        await otpInputs[i].fill(otp[i]);
      }
      
      log('[browserless-free]', 'Entered OTP');
      
      // Click submit/verify
      await this.page.click(GROWW_SELECTORS.continueButton);
      
      // Wait for next step
      await this.page.waitForTimeout(2000);
      
    } catch (error) {
      log('[browserless-free]', `Failed to enter OTP: ${error}`);
      throw error;
    }
  }

  // Check if PIN is required
  private async checkForPIN(): Promise<boolean> {
    try {
      // Look for PIN input fields or PIN-related text
      const pinElements = await this.page.$$(GROWW_SELECTORS.pinInputs);
      const pinText = await this.page.textContent('body');
      
      const hasPINInputs = pinElements.length > 0;
      const hasPINText = pinText?.toLowerCase().includes('pin') || 
                        pinText?.toLowerCase().includes('groww pin');
      
      const pinRequired = hasPINInputs || hasPINText;
      
      if (pinRequired) {
        log('[browserless-free]', 'PIN verification required');
      }
      
      return pinRequired;
      
    } catch (error) {
      log('[browserless-free]', `Error checking for PIN: ${error}`);
      return false;
    }
  }

  // Enter PIN
  private async enterPIN(pin: string): Promise<void> {
    try {
      // Wait for PIN input fields
      await this.page.waitForSelector(GROWW_SELECTORS.pinInputs, { timeout: 10000 });
      
      // Get all PIN input fields
      const pinInputs = await this.page.$$(GROWW_SELECTORS.pinInputs);
      
      if (pinInputs.length === 0) {
        throw new Error('No PIN input fields found');
      }
      
      // Enter PIN digit by digit
      for (let i = 0; i < Math.min(pin.length, pinInputs.length); i++) {
        await pinInputs[i].fill(pin[i]);
      }
      
      log('[browserless-free]', 'Entered PIN');
      
      // Click submit/verify
      await this.page.click(GROWW_SELECTORS.continueButton);
      
      // Wait for login completion
      await this.page.waitForTimeout(3000);
      
    } catch (error) {
      log('[browserless-free]', `Failed to enter PIN: ${error}`);
      throw error;
    }
  }

  // Verify login success
  private async verifyLoginSuccess(): Promise<boolean> {
    try {
      // Wait for success indicators
      await this.page.waitForTimeout(3000);
      
      // Check for success indicators
      const successIndicators = [
        GROWW_SELECTORS.loginSuccess,
        '.user-profile',
        '[data-testid="user-menu"]',
        '.dashboard',
        '.holdings'
      ];
      
      for (const selector of successIndicators) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            log('[browserless-free]', `Login verified with indicator: ${selector}`);
            return true;
          }
        } catch {
          // Continue checking other indicators
        }
      }
      
      // Check URL for success
      const currentUrl = this.page.url();
      if (!currentUrl.includes('/login') && !currentUrl.includes('auth')) {
        log('[browserless-free]', 'Login verified by URL change');
        return true;
      }
      
      log('[browserless-free]', 'Login verification failed - no success indicators found');
      return false;
      
    } catch (error) {
      log('[browserless-free]', `Login verification error: ${error}`);
      return false;
    }
  }

  // Navigate to holdings page
  async navigateToHoldings(): Promise<boolean> {
    try {
      log('[browserless-free]', 'Navigating to holdings page');
      
      // Try direct navigation first
      await this.navigateWithRetry('https://groww.in/stocks/user/holdings', { timeout: 15000 });
      
      // Check if we're on holdings page
      const currentUrl = this.page.url();
      if (currentUrl.includes('/holdings')) {
        log('[browserless-free]', 'Successfully navigated to holdings page');
        return true;
      }
      
      // Try clicking holdings link if available
      try {
        await this.page.waitForSelector(GROWW_SELECTORS.holdingsLink, { timeout: 5000 });
        await this.page.click(GROWW_SELECTORS.holdingsLink);
        await this.page.waitForLoadState('domcontentloaded');
        
        log('[browserless-free]', 'Clicked holdings link');
        return true;
      } catch {
        log('[browserless-free]', 'Holdings link not found, using direct navigation');
      }
      
      return true;
      
    } catch (error) {
      log('[browserless-free]', `Failed to navigate to holdings: ${error}`);
      return false;
    }
  }

  // Quick scraping with timeout management
  async quickScrape<T>(scrapeFunction: () => Promise<T>, timeout: number = 40000): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        scrapeFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Scraping timeout')), timeout)
        )
      ]);
      
      const elapsed = Date.now() - startTime;
      log('[browserless-free]', `Quick scrape completed in ${elapsed}ms`);
      
      return result as T;
      
    } catch (error) {
      const elapsed = Date.now() - startTime;
      log('[browserless-free]', `Quick scrape failed after ${elapsed}ms: ${error}`);
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
        log('[browserless-free]', `Error screenshot saved: ${filename}`);
        return filename;
      }
    } catch (screenshotError) {
      log('[browserless-free]', `Failed to take error screenshot: ${screenshotError}`);
    }
    return null;
  }

  // Clean up resources (critical for free plan)
  async cleanup() {
    try {
      if (this.browser && this.browser.isConnected()) {
        await this.browser.close();
        log('[browserless-free]', 'Browser closed successfully (free plan)');
      }
    } catch (error) {
      log('[browserless-free]', `Error during cleanup: ${error}`);
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
}

// Factory function for free plan
export function createBrowserlessFreeHelper(config?: Partial<BrowserlessFreeConfig>) {
  return new BrowserlessFreeHelper(config);
}

// Environment-based browser creation for free plan
export async function createBrowserFree(config?: Partial<BrowserlessFreeConfig>) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    const helper = createBrowserlessFreeHelper(config);
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
    const helper = new BrowserlessFreeHelper(config);
    helper['browser'] = browser;
    return helper;
  }
}
