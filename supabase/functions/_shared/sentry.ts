// Sentry integration for Supabase Edge Functions
// Uses the Sentry HTTP Store API directly (no SDK dependency)

interface SentryUser {
  id?: string;
  ip?: string;
}

interface SentryOptions {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: SentryUser;
}

interface SentryEvent {
  platform: string;
  level: string;
  exception?: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: {
        frames: Array<{
          filename: string;
          function?: string;
          lineno?: number;
          colno?: number;
        }>;
      };
    }>;
  };
  message?: string;
  tags: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: SentryUser;
  timestamp: number;
}

// Parse Sentry DSN
function parseDSN(dsn: string): { publicKey: string; host: string; projectId: string } | null {
  const match = dsn.match(/^https:\/\/([a-zA-Z0-9]+)@([^\/]+)\/([0-9]+)$/);
  if (!match) return null;

  const [, publicKey, host, projectId] = match;
  return { publicKey, host, projectId };
}

// Get store URL and auth header from DSN
function getStoreUrl(): string | null {
  const dsn = Deno.env.get('SENTRY_DSN');
  if (!dsn) return null;

  const parsed = parseDSN(dsn);
  if (!parsed) return null;

  return `https://${parsed.host}/api/${parsed.projectId}/store/`;
}

function getSentryAuthHeader(): string | null {
  const dsn = Deno.env.get('SENTRY_DSN');
  if (!dsn) return null;

  const parsed = parseDSN(dsn);
  if (!parsed) return null;

  return `Sentry sentry_key=${parsed.publicKey}, sentry_version=7, sentry_client=sentry.edge-functions/1.0`;
}

// PII sanitization helpers
function sanitizeIp(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.XXX`;
  }
  return ip; // For IPv6 or other formats, return as-is for now
}

function sanitizeEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `***@${domain}`;
}

function sanitizePhone(phone: string): string {
  // Keep country code + last 4 digits, mask the middle
  const match = phone.match(/^(\+\d{1,4})(\d+)(\d{4})$/);
  if (match) {
    const [, countryCode, middle, last4] = match;
    const masked = '*'.repeat(middle.length);
    return `${countryCode}${masked}${last4}`;
  }
  return phone;
}

function sanitizeUser(user: SentryUser): SentryUser {
  const sanitized: SentryUser = {};

  if (user.id) sanitized.id = user.id;
  if (user.ip) sanitized.ip = sanitizeIp(user.ip);

  return sanitized;
}

// Check if error is critical (should be sent to Sentry)
export function isCriticalError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const criticalPatterns = [
    'redis', 'upstash', 'database', 'twilio', 'pgrst',
    'connection', 'timeout', 'service role'
  ];

  return criticalPatterns.some(pattern => message.includes(pattern));
}

// Capture exception
export function captureException(
  error: Error,
  options: SentryOptions = {}
): void {
  try {
    const storeUrl = getStoreUrl();
    if (!storeUrl) return; // Silently fail if DSN not configured

    const environment = Deno.env.get('SENTRY_ENVIRONMENT') ?? 'production';

    const event: SentryEvent = {
      platform: 'other',
      level: 'error',
      exception: {
        values: [{
          type: error.name || 'Error',
          value: error.message,
          stacktrace: error.stack ? {
            frames: parseStackTrace(error.stack)
          } : undefined
        }]
      },
      tags: {
        layer: 'backend',
        environment,
        ...options.tags
      },
      extra: options.extra,
      user: options.user ? sanitizeUser(options.user) : undefined,
      timestamp: Date.now() / 1000
    };

    // Fire-and-forget POST to Sentry
    const authHeader = getSentryAuthHeader();
    if (!authHeader) return; // Silently fail if DSN not configured properly

    fetch(storeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': authHeader
      },
      body: JSON.stringify(event)
    }).catch(() => {
      // Silently ignore fetch failures
    });
  } catch (err) {
    console.warn('Failed to send error to Sentry:', err);
  }
}

// Capture message
export function captureMessage(
  message: string,
  level: 'error' | 'warning' | 'info' = 'error',
  options: SentryOptions = {}
): void {
  try {
    const storeUrl = getStoreUrl();
    if (!storeUrl) return; // Silently fail if DSN not configured

    const environment = Deno.env.get('SENTRY_ENVIRONMENT') ?? 'production';

    const event: SentryEvent = {
      platform: 'other',
      level,
      message,
      tags: {
        layer: 'backend',
        environment,
        ...options.tags
      },
      extra: options.extra,
      user: options.user ? sanitizeUser(options.user) : undefined,
      timestamp: Date.now() / 1000
    };

    // Fire-and-forget POST to Sentry
    const authHeader = getSentryAuthHeader();
    if (!authHeader) return; // Silently fail if DSN not configured properly

    fetch(storeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': authHeader
      },
      body: JSON.stringify(event)
    }).catch(() => {
      // Silently ignore fetch failures
    });
  } catch (err) {
    console.warn('Failed to send message to Sentry:', err);
  }
}

// Parse stack trace into Sentry frame format
function parseStackTrace(stack: string): Array<{
  filename: string;
  function?: string;
  lineno?: number;
  colno?: number;
}> {
  const lines = stack.split('\n').slice(1); // Skip error message
  const frames: Array<{
    filename: string;
    function?: string;
    lineno?: number;
    colno?: number;
  }> = [];

  for (const line of lines) {
    // Parse format like: "    at functionName (file:///path/to/file.ts:123:45)"
    const match = line.match(/^\s*at\s+(?:(.+?)\s+\()?(file:\/\/[^:]+):(\d+):(\d+)\)?$/);
    if (match) {
      const [, functionName, filename, lineStr, colStr] = match;
      frames.push({
        filename,
        function: functionName,
        lineno: parseInt(lineStr, 10),
        colno: parseInt(colStr, 10)
      });
    }
  }

  return frames.reverse(); // Sentry expects frames in reverse order
}

// Temporary test invocation for end-to-end validation
// Remove this after confirming Sentry integration works
if (Deno.env.get('SENTRY_ENVIRONMENT') !== 'production') {
  // Small delay to ensure module is fully loaded
  setTimeout(() => {
    captureMessage('Sentry backend integration test', 'info', {
      tags: { layer: 'backend', function: 'sentry-test' }
    });
  }, 100);
}