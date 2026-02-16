/**
 * Rate Limit Manager
 * 
 * Manages rate limit state in sessionStorage for client-side UX optimization.
 * Backend is always the source of truth - this just caches state to avoid unnecessary API calls.
 */

export interface RateLimitState {
  resetAt: number;        // Unix timestamp (ms) when rate limit expires
  remaining: number;      // Attempts remaining
  limit: number;          // Total limit
  identifier: string;     // Email, phone, or IP (for display)
}

export class RateLimitManager {
  private static readonly STORAGE_PREFIX = 'rate_limit_';

  /**
   * Get rate limit state from sessionStorage
   */
  static get(key: string): RateLimitState | null {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_PREFIX + key);
      if (!stored) return null;

      const state: RateLimitState = JSON.parse(stored);
      
      // Check if rate limit has expired
      if (state.resetAt <= Date.now()) {
        this.clear(key);
        return null;
      }

      return state;
    } catch (error) {
      console.error('Error reading rate limit state:', error);
      return null;
    }
  }

  /**
   * Store rate limit state in sessionStorage
   */
  static set(key: string, state: RateLimitState): void {
    try {
      sessionStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(state));
    } catch (error) {
      console.error('Error storing rate limit state:', error);
    }
  }

  /**
   * Clear rate limit state from sessionStorage
   */
  static clear(key: string): void {
    try {
      sessionStorage.removeItem(this.STORAGE_PREFIX + key);
    } catch (error) {
      console.error('Error clearing rate limit state:', error);
    }
  }

  /**
   * Check if currently rate limited
   */
  static isLimited(key: string): boolean {
    const state = this.get(key);
    return state !== null && state.resetAt > Date.now();
  }

  /**
   * Get time remaining in seconds
   */
  static getTimeRemaining(key: string): number {
    const state = this.get(key);
    if (!state) return 0;

    const remaining = Math.max(0, Math.ceil((state.resetAt - Date.now()) / 1000));
    return remaining;
  }

  /**
   * Format time remaining as MM:SS
   */
  static formatTimeRemaining(key: string): string {
    const seconds = this.getTimeRemaining(key);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Update rate limit state from 429 response body
   */
  static updateFrom429Response(key: string, responseBody: any, identifier: string): void {
    if (!responseBody) return;

    const retryAfter = responseBody.retryAfter || responseBody.retryAfterSeconds;
    if (!retryAfter) return;

    const resetAt = Date.now() + (retryAfter * 1000);
    
    this.set(key, {
      resetAt,
      remaining: 0,
      limit: responseBody.limit || 5, // Default to 5 if not provided
      identifier,
    });
  }

  /**
   * Update rate limit state from response headers (optional)
   */
  static updateFromHeaders(key: string, headers: Headers, identifier: string): void {
    try {
      const resetHeader = headers.get('X-RateLimit-Reset');
      const remainingHeader = headers.get('X-RateLimit-Remaining');
      const limitHeader = headers.get('X-RateLimit-Limit');

      if (resetHeader && remainingHeader && limitHeader) {
        this.set(key, {
          resetAt: parseInt(resetHeader) * 1000, // Convert to ms
          remaining: parseInt(remainingHeader),
          limit: parseInt(limitHeader),
          identifier,
        });
      }
    } catch (error) {
      console.error('Error parsing rate limit headers:', error);
    }
  }
}
