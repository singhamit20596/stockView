import { log } from '@/server/logger';
import { BrowserlessHelper } from './browserless';

// Session storage interface
export interface SessionData {
  id: string;
  reconnectEndpoint: string;
  createdAt: number;
  expiresAt: number;
  userId?: string;
  broker: string; // 'groww', 'zerodha', etc.
  status: 'active' | 'expired' | 'completed';
}

// In-memory session storage (in production, use Redis or database)
class SessionStorage {
  private sessions = new Map<string, SessionData>();

  set(sessionId: string, data: SessionData): void {
    this.sessions.set(sessionId, data);
    log('[session]', `Session stored: ${sessionId}`);
  }

  get(sessionId: string): SessionData | undefined {
    return this.sessions.get(sessionId);
  }

  delete(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      log('[session]', `Session deleted: ${sessionId}`);
    }
    return deleted;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(id);
        log('[session]', `Expired session cleaned up: ${id}`);
      }
    }
  }

  getAll(): SessionData[] {
    return Array.from(this.sessions.values());
  }
}

// Global session storage instance
const sessionStorage = new SessionStorage();

// Clean up expired sessions every 5 minutes
setInterval(() => {
  sessionStorage.cleanup();
}, 5 * 60 * 1000);

// Session Manager Class
export class SessionManager {
  private helper: BrowserlessHelper;

  constructor(helper: BrowserlessHelper) {
    this.helper = helper;
  }

  // Create a new session with reconnection capability
  async createSession(broker: string, userId?: string, timeout: number = 300000): Promise<string> {
    try {
      // Set up session reconnection
      const reconnectEndpoint = await this.helper.setupSessionReconnection(timeout);
      
      // Generate session ID
      const sessionId = `session_${broker}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store session data
      const sessionData: SessionData = {
        id: sessionId,
        reconnectEndpoint,
        createdAt: Date.now(),
        expiresAt: Date.now() + timeout,
        userId,
        broker,
        status: 'active',
      };
      
      sessionStorage.set(sessionId, sessionData);
      
      log('[session]', `Session created: ${sessionId} for ${broker}`);
      return sessionId;
      
    } catch (error) {
      log('[session]', `Failed to create session: ${error}`);
      throw error;
    }
  }

  // Reconnect to an existing session
  async reconnectToSession(sessionId: string): Promise<boolean> {
    try {
      const sessionData = sessionStorage.get(sessionId);
      
      if (!sessionData) {
        log('[session]', `Session not found: ${sessionId}`);
        return false;
      }
      
      if (sessionData.status !== 'active') {
        log('[session]', `Session not active: ${sessionId} (${sessionData.status})`);
        return false;
      }
      
      if (Date.now() > sessionData.expiresAt) {
        log('[session]', `Session expired: ${sessionId}`);
        sessionData.status = 'expired';
        sessionStorage.set(sessionId, sessionData);
        return false;
      }
      
      // Reconnect to the session
      await this.helper.reconnectToSession(sessionData.reconnectEndpoint);
      
      log('[session]', `Successfully reconnected to session: ${sessionId}`);
      return true;
      
    } catch (error) {
      log('[session]', `Failed to reconnect to session ${sessionId}: ${error}`);
      return false;
    }
  }

  // Get session information
  getSession(sessionId: string): SessionData | undefined {
    return sessionStorage.get(sessionId);
  }

  // Update session status
  updateSessionStatus(sessionId: string, status: SessionData['status']): boolean {
    const sessionData = sessionStorage.get(sessionId);
    if (sessionData) {
      sessionData.status = status;
      sessionStorage.set(sessionId, sessionData);
      log('[session]', `Session status updated: ${sessionId} -> ${status}`);
      return true;
    }
    return false;
  }

  // Delete a session
  deleteSession(sessionId: string): boolean {
    return sessionStorage.delete(sessionId);
  }

  // Get all active sessions for a user
  getUserSessions(userId: string): SessionData[] {
    return sessionStorage.getAll().filter(session => 
      session.userId === userId && session.status === 'active'
    );
  }

  // Get all active sessions for a broker
  getBrokerSessions(broker: string): SessionData[] {
    return sessionStorage.getAll().filter(session => 
      session.broker === broker && session.status === 'active'
    );
  }

  // Clean up all sessions for a user
  cleanupUserSessions(userId: string): number {
    const userSessions = this.getUserSessions(userId);
    let deletedCount = 0;
    
    for (const session of userSessions) {
      if (sessionStorage.delete(session.id)) {
        deletedCount++;
      }
    }
    
    log('[session]', `Cleaned up ${deletedCount} sessions for user: ${userId}`);
    return deletedCount;
  }
}

// Utility functions for session management
export function createSessionManager(helper: BrowserlessHelper): SessionManager {
  return new SessionManager(helper);
}

// Get session storage instance (for admin/debugging purposes)
export function getSessionStorage(): SessionStorage {
  return sessionStorage;
}

// Session validation utilities
export function isSessionValid(sessionData: SessionData): boolean {
  return sessionData.status === 'active' && Date.now() < sessionData.expiresAt;
}

export function getSessionTimeRemaining(sessionData: SessionData): number {
  if (!isSessionValid(sessionData)) {
    return 0;
  }
  return Math.max(0, sessionData.expiresAt - Date.now());
}

// Session statistics
export function getSessionStats() {
  const allSessions = sessionStorage.getAll();
  const stats = {
    total: allSessions.length,
    active: allSessions.filter(s => s.status === 'active').length,
    expired: allSessions.filter(s => s.status === 'expired').length,
    completed: allSessions.filter(s => s.status === 'completed').length,
    byBroker: {} as Record<string, number>,
  };
  
  // Count by broker
  for (const session of allSessions) {
    stats.byBroker[session.broker] = (stats.byBroker[session.broker] || 0) + 1;
  }
  
  return stats;
}
