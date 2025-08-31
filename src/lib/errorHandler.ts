import { log } from '@/server/logger';
import { BrowserlessHelper } from './browserless';

// Error types for Browserless operations
export enum BrowserlessErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  SESSION_TIMEOUT = 'SESSION_TIMEOUT',
  NAVIGATION_FAILED = 'NAVIGATION_FAILED',
  INTERACTIVE_SESSION_FAILED = 'INTERACTIVE_SESSION_FAILED',
  CAPTCHA_DETECTED = 'CAPTCHA_DETECTED',
  LOGIN_FAILED = 'LOGIN_FAILED',
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Error interface
export interface BrowserlessError {
  type: BrowserlessErrorType;
  message: string;
  originalError?: any;
  context?: Record<string, any>;
  timestamp: number;
  sessionId?: string;
}

// Error handler class
export class BrowserlessErrorHandler {
  private helper: BrowserlessHelper;
  private errors: BrowserlessError[] = [];

  constructor(helper: BrowserlessHelper) {
    this.helper = helper;
  }

  // Create error object
  createError(
    type: BrowserlessErrorType,
    message: string,
    originalError?: any,
    context?: Record<string, any>,
    sessionId?: string
  ): BrowserlessError {
    const error: BrowserlessError = {
      type,
      message,
      originalError,
      context,
      timestamp: Date.now(),
      sessionId,
    };

    this.errors.push(error);
    log('[error]', `${type}: ${message}`, { context, sessionId });

    return error;
  }

  // Handle connection errors
  async handleConnectionError(error: any, retryCount: number = 0): Promise<boolean> {
    const maxRetries = 3;
    
    if (retryCount >= maxRetries) {
      this.createError(
        BrowserlessErrorType.CONNECTION_FAILED,
        `Failed to connect after ${maxRetries} attempts`,
        error
      );
      return false;
    }

    log('[error]', `Connection attempt ${retryCount + 1} failed, retrying...`);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      await this.helper.connect();
      log('[error]', 'Connection retry successful');
      return true;
    } catch (retryError) {
      return this.handleConnectionError(retryError, retryCount + 1);
    }
  }

  // Handle navigation errors
  async handleNavigationError(error: any, url: string, sessionId?: string): Promise<boolean> {
    const errorMessage = `Failed to navigate to ${url}`;
    
    if (error.message.includes('timeout')) {
      this.createError(
        BrowserlessErrorType.NAVIGATION_FAILED,
        `${errorMessage} - timeout`,
        error,
        { url },
        sessionId
      );
    } else if (error.message.includes('net::ERR_')) {
      this.createError(
        BrowserlessErrorType.NETWORK_ERROR,
        `${errorMessage} - network error`,
        error,
        { url },
        sessionId
      );
    } else {
      this.createError(
        BrowserlessErrorType.NAVIGATION_FAILED,
        errorMessage,
        error,
        { url },
        sessionId
      );
    }

    return false;
  }

  // Handle interactive session errors
  async handleInteractiveSessionError(error: any, sessionId?: string): Promise<boolean> {
    this.createError(
      BrowserlessErrorType.INTERACTIVE_SESSION_FAILED,
      'Failed to create interactive session',
      error,
      { sessionId },
      sessionId
    );

    return false;
  }

  // Handle captcha detection
  async handleCaptchaDetection(sessionId?: string): Promise<boolean> {
    try {
      this.createError(
        BrowserlessErrorType.CAPTCHA_DETECTED,
        'Captcha detected on page',
        null,
        { sessionId },
        sessionId
      );

      // Attempt to solve captcha
      const result = await this.helper.solveCaptcha();
      
      if (result.success) {
        log('[error]', 'Captcha solved automatically');
        return true;
      } else {
        log('[error]', `Captcha solving failed: ${result.error}`);
        
        // Create manual solving session
        const { liveURL } = await this.helper.createInteractiveSession({
          timeout: 300000, // 5 minutes
          quality: 80,
        });
        
        console.log(`🔒 **CAPTCHA DETECTED**: Please solve manually: ${liveURL}`);
        
        // Wait for user to solve
        await this.helper.waitForUserCompletion();
        log('[error]', 'User completed manual captcha solving');
        
        return true;
      }
    } catch (error) {
      this.createError(
        BrowserlessErrorType.CAPTCHA_DETECTED,
        'Failed to handle captcha',
        error,
        { sessionId },
        sessionId
      );
      return false;
    }
  }

  // Handle login verification errors
  async handleLoginVerificationError(currentUrl: string, sessionId?: string): Promise<boolean> {
    this.createError(
      BrowserlessErrorType.LOGIN_FAILED,
      'Login verification failed - still on login page',
      null,
      { currentUrl },
      sessionId
    );

    return false;
  }

  // Handle element not found errors
  async handleElementNotFoundError(selector: string, context: string, sessionId?: string): Promise<boolean> {
    this.createError(
      BrowserlessErrorType.ELEMENT_NOT_FOUND,
      `Element not found: ${selector}`,
      null,
      { selector, context },
      sessionId
    );

    return false;
  }

  // Take error screenshot
  async takeErrorScreenshot(error: BrowserlessError, filename?: string): Promise<string | null> {
    try {
      const screenshotFilename = filename || `error-${error.type}-${Date.now()}.png`;
      const screenshotPath = await this.helper.screenshotOnError(error.originalError, screenshotFilename);
      
      if (screenshotPath) {
        log('[error]', `Error screenshot saved: ${screenshotPath}`);
        error.context = { ...error.context, screenshotPath };
      }
      
      return screenshotPath;
    } catch (screenshotError) {
      log('[error]', `Failed to take error screenshot: ${screenshotError}`);
      return null;
    }
  }

  // Get all errors
  getErrors(): BrowserlessError[] {
    return [...this.errors];
  }

  // Get errors by type
  getErrorsByType(type: BrowserlessErrorType): BrowserlessError[] {
    return this.errors.filter(error => error.type === type);
  }

  // Get errors for a specific session
  getErrorsBySession(sessionId: string): BrowserlessError[] {
    return this.errors.filter(error => error.sessionId === sessionId);
  }

  // Clear errors
  clearErrors(): void {
    this.errors = [];
  }

  // Get error statistics
  getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const error of this.errors) {
      stats[error.type] = (stats[error.type] || 0) + 1;
    }
    
    return stats;
  }

  // Check if there are critical errors
  hasCriticalErrors(): boolean {
    const criticalTypes = [
      BrowserlessErrorType.CONNECTION_FAILED,
      BrowserlessErrorType.SESSION_TIMEOUT,
      BrowserlessErrorType.LOGIN_FAILED,
    ];
    
    return this.errors.some(error => criticalTypes.includes(error.type));
  }

  // Get the most recent error
  getLastError(): BrowserlessError | undefined {
    return this.errors[this.errors.length - 1];
  }

  // Format error for logging
  formatError(error: BrowserlessError): string {
    return `[${error.type}] ${error.message} (${new Date(error.timestamp).toISOString()})`;
  }

  // Log all errors
  logAllErrors(): void {
    for (const error of this.errors) {
      log('[error]', this.formatError(error), error.context);
    }
  }
}

// Utility function to create error handler
export function createErrorHandler(helper: BrowserlessHelper): BrowserlessErrorHandler {
  return new BrowserlessErrorHandler(helper);
}

// Global error handling utilities
export function isRetryableError(error: any): boolean {
  const retryableMessages = [
    'timeout',
    'net::ERR_',
    'connection',
    'network',
    'ECONNRESET',
    'ECONNREFUSED',
  ];
  
  const errorMessage = error.message || error.toString();
  return retryableMessages.some(msg => errorMessage.includes(msg));
}

export function getRetryDelay(attempt: number, baseDelay: number = 1000): number {
  return baseDelay * Math.pow(2, attempt); // Exponential backoff
}

// Error recovery strategies
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }
      
      const delay = getRetryDelay(attempt, baseDelay);
      log('[retry]', `Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
