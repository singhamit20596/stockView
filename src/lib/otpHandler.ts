import { log } from '@/server/logger';
import type { OTPInputCallback } from './types';

// OTP input handler for manual OTP entry during automated sessions
export class OTPHandler {
  private static instance: OTPHandler;
  private otpCallbacks: Map<string, (otp: string) => void> = new Map();
  private otpTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private otpValues: Map<string, string> = new Map(); // Store actual OTP values
  private otpResolvers: Map<string, (otp: string) => void> = new Map(); // Store resolvers

  private constructor() {}

  static getInstance(): OTPHandler {
    if (!OTPHandler.instance) {
      OTPHandler.instance = new OTPHandler();
    }
    return OTPHandler.instance;
  }

  // Create OTP input callback for a session
  createOTPCallback(sessionId: string, timeoutMs: number = 60000): OTPInputCallback {
    return (otp: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Set up timeout
        const timeout = setTimeout(() => {
          this.otpCallbacks.delete(sessionId);
          this.otpTimeouts.delete(sessionId);
          this.otpValues.delete(sessionId);
          this.otpResolvers.delete(sessionId);
          reject(new Error('OTP input timeout - user did not provide OTP within the time limit'));
        }, timeoutMs);

        this.otpTimeouts.set(sessionId, timeout);

        // Store callback
        this.otpCallbacks.set(sessionId, (providedOTP: string) => {
          clearTimeout(timeout);
          this.otpCallbacks.delete(sessionId);
          this.otpTimeouts.delete(sessionId);
          this.otpValues.delete(sessionId);
          this.otpResolvers.delete(sessionId);
          resolve();
        });

        // If OTP is provided immediately, resolve
        if (otp && otp.trim()) {
          this.provideOTP(sessionId, otp);
        }
      });
    };
  }

  // Wait for OTP input and return the actual OTP value
  async waitForOTP(sessionId: string, timeoutMs: number = 60000): Promise<string> {
    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.otpResolvers.delete(sessionId);
        this.otpValues.delete(sessionId);
        reject(new Error('OTP input timeout - user did not provide OTP within the time limit'));
      }, timeoutMs);

      // Store resolver
      this.otpResolvers.set(sessionId, (otp: string) => {
        clearTimeout(timeout);
        this.otpResolvers.delete(sessionId);
        this.otpValues.delete(sessionId);
        resolve(otp);
      });

      // Check if OTP is already provided
      const existingOTP = this.otpValues.get(sessionId);
      if (existingOTP) {
        this.otpResolvers.get(sessionId)?.(existingOTP);
      }
    });
  }

  // Provide OTP for a session
  provideOTP(sessionId: string, otp: string): boolean {
    // Store the OTP value
    this.otpValues.set(sessionId, otp);
    
    // Call the callback if exists
    const callback = this.otpCallbacks.get(sessionId);
    if (callback) {
      callback(otp);
      log('[otp-handler]', `OTP provided for session: ${sessionId}`);
      return true;
    }
    
    // Call the resolver if exists
    const resolver = this.otpResolvers.get(sessionId);
    if (resolver) {
      resolver(otp);
      log('[otp-handler]', `OTP provided for session: ${sessionId}`);
      return true;
    }
    
    log('[otp-handler]', `No OTP callback/resolver found for session: ${sessionId}`);
    return false;
  }

  // Check if OTP is pending for a session
  isOTPPending(sessionId: string): boolean {
    return this.otpCallbacks.has(sessionId) || this.otpResolvers.has(sessionId);
  }

  // Get pending OTP sessions
  getPendingSessions(): string[] {
    const callbackSessions = Array.from(this.otpCallbacks.keys());
    const resolverSessions = Array.from(this.otpResolvers.keys());
    return [...new Set([...callbackSessions, ...resolverSessions])];
  }

  // Get stored OTP value for a session
  getOTPValue(sessionId: string): string | undefined {
    return this.otpValues.get(sessionId);
  }

  // Cancel OTP request for a session
  cancelOTP(sessionId: string): boolean {
    const callback = this.otpCallbacks.get(sessionId);
    const timeout = this.otpTimeouts.get(sessionId);
    const resolver = this.otpResolvers.get(sessionId);

    let cancelled = false;

    if (callback && timeout) {
      clearTimeout(timeout);
      this.otpCallbacks.delete(sessionId);
      this.otpTimeouts.delete(sessionId);
      cancelled = true;
    }

    if (resolver) {
      this.otpResolvers.delete(sessionId);
      cancelled = true;
    }

    this.otpValues.delete(sessionId);

    if (cancelled) {
      log('[otp-handler]', `OTP request cancelled for session: ${sessionId}`);
    }

    return cancelled;
  }

  // Clear all pending OTP requests
  clearAll(): void {
    for (const [sessionId, timeout] of this.otpTimeouts.entries()) {
      clearTimeout(timeout);
    }
    this.otpCallbacks.clear();
    this.otpTimeouts.clear();
    this.otpValues.clear();
    this.otpResolvers.clear();
    log('[otp-handler]', 'All pending OTP requests cleared');
  }
}

// Global OTP handler instance
export const otpHandler = OTPHandler.getInstance();

// Utility function to create OTP callback
export function createOTPCallback(sessionId: string, timeoutMs: number = 60000): OTPInputCallback {
  return otpHandler.createOTPCallback(sessionId, timeoutMs);
}

// Utility function to wait for OTP and get the value
export function waitForOTP(sessionId: string, timeoutMs: number = 60000): Promise<string> {
  return otpHandler.waitForOTP(sessionId, timeoutMs);
}

// Utility function to provide OTP
export function provideOTP(sessionId: string, otp: string): boolean {
  return otpHandler.provideOTP(sessionId, otp);
}

// Utility function to check pending OTP sessions
export function getPendingOTPSessions(): string[] {
  return otpHandler.getPendingSessions();
}

// Utility function to get OTP value
export function getOTPValue(sessionId: string): string | undefined {
  return otpHandler.getOTPValue(sessionId);
}

// Utility function to cancel OTP request
export function cancelOTP(sessionId: string): boolean {
  return otpHandler.cancelOTP(sessionId);
}
