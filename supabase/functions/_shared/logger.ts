// Structured logging for security events, errors, and audit trails

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';

export interface LogEntry {
  timestamp: string; // ISO 8601
  level: LogLevel;
  endpoint: string;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

// Log levels configuration
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SECURITY: 4,
} as const;

// Current log level (configurable via environment variable)
const CURRENT_LOG_LEVEL = LOG_LEVELS[(Deno.env.get('LOG_LEVEL') as keyof typeof LOG_LEVELS) || 'INFO'];

// Core logging functions

// Generic logger
export function log(level: LogLevel, message: string, context?: Record<string, any>): void {
  if (LOG_LEVELS[level] < CURRENT_LOG_LEVEL) {
    return; // Skip logs below current level
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    endpoint: 'unknown', // Will be set by middleware
    message,
    context: sanitizeContext(context),
  };

  // Output to console (captured by Supabase logs)
  const output = JSON.stringify(entry);
  console.log(output);
}

// Security event logger
export function logSecurityEvent(
  event: string,
  req: Request,
  context?: Record<string, any>
): void {
  const requestContext = extractRequestContext(req);

  log('SECURITY', `Security event: ${event}`, {
    ...context,
    ...requestContext,
    event,
  });
}

// Specific event loggers

// Rate limit violation
export function logRateLimitViolation(
  endpoint: string,
  identifier: string,
  limit: number,
  req: Request
): void {
  const requestContext = extractRequestContext(req);

  log('WARN', `Rate limit exceeded: ${endpoint}`, {
    endpoint,
    identifier: sanitizeIdentifier(identifier),
    limit,
    ...requestContext,
    event: 'rate_limit_exceeded',
  });
}

// Authentication failure
export function logAuthFailure(
  endpoint: string,
  reason: string,
  req: Request
): void {
  const requestContext = extractRequestContext(req);

  log('WARN', `Authentication failed: ${reason}`, {
    endpoint,
    reason,
    ...requestContext,
    event: 'auth_failure',
  });
}

// Validation error
export function logValidationError(
  endpoint: string,
  errors: string[],
  req: Request
): void {
  const requestContext = extractRequestContext(req);

  log('WARN', `Validation failed: ${errors.join(', ')}`, {
    endpoint,
    errors,
    errorCount: errors.length,
    ...requestContext,
    event: 'validation_error',
  });
}

// Admin action
export function logAdminAction(
  action: string,
  adminId: string,
  targetId: string,
  details?: Record<string, any>,
  req?: Request
): void {
  const requestContext = req ? extractRequestContext(req) : {};

  log('INFO', `Admin action: ${action}`, {
    action,
    adminId,
    targetId,
    ...details,
    ...requestContext,
    event: 'admin_action',
  });
}

// OTP event
export function logOTPEvent(
  event: 'otp_requested' | 'otp_verified' | 'otp_failed',
  phone: string,
  req: Request,
  context?: Record<string, any>
): void {
  const requestContext = extractRequestContext(req);

  log(event === 'otp_failed' ? 'WARN' : 'INFO', `OTP ${event}`, {
    event: `otp_${event}`,
    phone: sanitizePhone(phone),
    ...context,
    ...requestContext,
  });
}

// Booking event
export function logBookingEvent(
  event: string,
  bookingId: string,
  userId: string,
  req: Request,
  context?: Record<string, any>
): void {
  const requestContext = extractRequestContext(req);

  log('INFO', `Booking ${event}`, {
    event: `booking_${event}`,
    bookingId,
    userId,
    ...context,
    ...requestContext,
  });
}

// Error logging with stack traces
export function logError(
  error: Error,
  endpoint: string,
  context?: Record<string, any>,
  req?: Request
): void {
  const requestContext = req ? extractRequestContext(req) : {};

  log('ERROR', `Error in ${endpoint}: ${error.message}`, {
    endpoint,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
    ...requestContext,
    event: 'error',
  });
}

// Performance logging
export function logPerformance(
  endpoint: string,
  duration: number,
  success: boolean,
  req?: Request,
  context?: Record<string, any>
): void {
  const requestContext = req ? extractRequestContext(req) : {};

  const level = duration > 5000 ? 'WARN' : 'DEBUG'; // Warn on slow requests (>5s)

  log(level, `Request completed: ${endpoint}`, {
    endpoint,
    duration,
    success,
    performance: {
      duration,
      slow: duration > 5000,
    },
    ...context,
    ...requestContext,
    event: 'performance',
  });
}

// Request context extraction
export function extractRequestContext(req: Request): {
  ip?: string;
  userAgent?: string;
  endpoint: string;
} {
  // Extract IP from various headers (in order of preference)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             req.headers.get('x-client-ip') ||
             'unknown';

  const userAgent = req.headers.get('user-agent') || 'unknown';

  // Extract endpoint from URL path
  const url = new URL(req.url);
  const endpoint = url.pathname.replace('/functions/v1/', '') || 'unknown';

  return {
    ip,
    userAgent,
    endpoint,
  };
}

// Context sanitization functions

// Sanitize sensitive data in log context
function sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
  if (!context) return context;

  const sanitized = { ...context };

  // Remove or mask sensitive fields
  const sensitiveFields = ['password', 'token', 'otp', 'secret', 'key', 'authorization'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Sanitize nested objects
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeContext(value as Record<string, any>);
    }
  }

  return sanitized;
}

// Sanitize identifier (phone numbers, emails, etc.)
function sanitizeIdentifier(identifier: string): string {
  if (!identifier) return identifier;

  // Phone numbers: show only last 4 digits
  if (identifier.match(/^\+40\d{9}$/)) {
    return `+40*****${identifier.slice(-4)}`;
  }

  // Email addresses: show only domain
  if (identifier.includes('@')) {
    const [, domain] = identifier.split('@');
    return `***@${domain}`;
  }

  // UUIDs: show only first 8 characters
  if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return `${identifier.substring(0, 8)}...`;
  }

  // For other identifiers, truncate for privacy (first 8 chars + ...)
  if (identifier.length > 10) {
    return `${identifier.substring(0, 8)}...`;
  }

  return identifier;
}

// Sanitize phone number for logging
function sanitizePhone(phone: string): string {
  if (!phone) return phone;
  // Show only country code and last 4 digits
  if (phone.startsWith('+40')) {
    return `+40*****${phone.slice(-4)}`;
  }
  return phone;
}
