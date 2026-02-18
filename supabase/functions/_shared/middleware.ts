// Composable middleware wrapper for applying security layers to Edge Functions

import { corsHeaders, handleCors } from "./cors.ts";
import { slidingWindowRateLimit, tokenBucketRateLimit, fixedWindowRateLimit, checkMultiLayerRateLimit, createRateLimitResponse, RATE_LIMITS } from "./rate-limit.ts";

// Re-export RATE_LIMITS so consumer edge functions can import it from this barrel module
export { RATE_LIMITS };
import { validateRequest, createValidationErrorResponse } from "./validation.ts";
import { requireAuth, requireAdmin } from "./auth.ts";
import { log, logError, logPerformance, extractRequestContext, logRateLimitViolation, logValidationError, logAuthFailure } from "./logger.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Middleware types
export type Middleware = (req: Request, context: Context) => Promise<Response | void>;
export type Handler = (req: Request, context: Context) => Promise<Response>;

// Context object passed through middleware chain
export interface Context {
  user?: any; // From Supabase auth
  profile?: any; // User profile data
  validatedData?: any; // Validated request data
  startTime: number;
  endpoint: string;
  ip?: string;
  userAgent?: string;
  rateLimitInfo?: { remaining: number; resetAt: number; limit: number };
}

// Middleware composer - executes middlewares in order, short-circuits on Response return
export function compose(...middlewares: Middleware[]): (handler: Handler) => (req: Request) => Promise<Response> {
  return (handler: Handler) => {
    return async (req: Request): Promise<Response> => {
      // CRITICAL: Handle OPTIONS preflight requests IMMEDIATELY, before any other processing
      // This ensures CORS works even if other parts of the middleware fail
      if (req.method === 'OPTIONS') {
        try {
          return handleCors();
        } catch {
          // Absolute fallback for CORS
          return new Response(null, {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            },
          });
        }
      }

      const startTime = Date.now();
      
      // Wrap everything in try-catch to prevent any uncaught errors
      let context: Context;
      try {
        const requestContext = extractRequestContext(req);
        context = {
          startTime,
          endpoint: requestContext.endpoint,
          ip: requestContext.ip,
          userAgent: requestContext.userAgent,
        };
      } catch (error) {
        // If context extraction fails, create minimal context and continue
        console.error('Context extraction failed:', error);
        context = {
          startTime,
          endpoint: 'unknown',
          ip: 'unknown',
          userAgent: 'unknown',
        };
      }

      try {
        // Execute middleware chain
        for (const middleware of middlewares) {
          const result = await middleware(req, context);
          if (result instanceof Response) {
            // Middleware returned a response (e.g., error, redirect)
            // Log performance for failed requests
            logPerformance(context.endpoint, Date.now() - startTime, false, req, {
              failurePoint: middleware.name || 'unknown_middleware',
              status: result.status,
            });
            return result;
          }
        }

        // All middlewares passed, execute handler
        const response = await handler(req, context);

        // Log successful performance
        logPerformance(context.endpoint, Date.now() - startTime, true, req);

        return response;
      } catch (error) {
        // Log error and performance
        logError(error instanceof Error ? error : new Error(String(error)), context.endpoint, undefined, req);
        logPerformance(context.endpoint, Date.now() - startTime, false, req, {
          error: error instanceof Error ? error.message : String(error),
        });

        // Return generic error response
        return new Response(
          JSON.stringify({
            error: 'Internal server error',
            message: 'An unexpected error occurred',
            code: 'INTERNAL_ERROR'
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
    };
  };
}

// Pre-built middleware

// CORS middleware - handles OPTIONS requests and adds headers
export const corsMiddleware: Middleware = async (req, context) => {
  // Always handle OPTIONS requests first, before any other logic
  if (req.method === 'OPTIONS') {
    try {
      return handleCors();
    } catch (error) {
      // Fallback: return CORS response even if handleCors fails
      console.error('CORS handler error:', error);
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }
  }
  // For non-OPTIONS requests, headers will be added by the final response
};

// Rate limit middleware factory
export function rateLimitMiddleware(config: {
  identifier: string | ((req: Request, context: Context) => string);
  endpoint: string;
  limit: number;
  window: number;
  strategy?: 'sliding' | 'fixed' | 'token';
  failClosed?: boolean;
}): Middleware {
  return async (req, context) => {
    try {
      // Resolve identifier (can be static string or function)
      const identifier = typeof config.identifier === 'function'
        ? config.identifier(req, context)
        : config.identifier;

      let result;
      switch (config.strategy) {
        case 'fixed':
          result = await fixedWindowRateLimit(identifier, config.endpoint, config.limit, config.window, config.failClosed);
          break;
        case 'token':
          // Convert limit/window to token bucket parameters
          // capacity = limit, refillRate = limit / window (tokens per second)
          result = await tokenBucketRateLimit(identifier, config.endpoint, config.limit, config.limit / config.window, config.failClosed);
          break;
        default:
          // Default to sliding window
          result = await slidingWindowRateLimit(identifier, config.endpoint, config.limit, config.window, config.failClosed);
      }

      if (!result.allowed) {
        logRateLimitViolation(config.endpoint, identifier, config.limit, req);
        return createRateLimitResponse(result.resetAt);
      }

      // Add rate limit headers to response (will be handled by final response)
      context.rateLimitInfo = {
        remaining: result.remaining,
        resetAt: result.resetAt,
        limit: config.limit,
      };

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), context.endpoint, { middleware: 'rateLimit' }, req);
      
      // Check if fail-closed mode is enabled
      if (config.failClosed === true) {
        const headers = {
          'Content-Type': 'application/json',
          ...corsHeaders,
        };

        const response = new Response(JSON.stringify({
          error: 'Service temporarily unavailable',
          message: 'OTP service temporarily unavailable. Please try again later.',
          code: 'SERVICE_UNAVAILABLE',
        }), {
          status: 503,
          headers,
        });

        return addRateLimitHeaders(response, context.rateLimitInfo);
      }
      
      // Fail open - allow request if rate limiting fails
    }
  };
}

// Global IP rate limit middleware - applies to all public-facing endpoints
export const globalIPRateLimitMiddleware: Middleware = async (req, context) => {
  try {
    const ip = context.ip || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    const result = await slidingWindowRateLimit(
      ip,
      'global-ip',
      RATE_LIMITS.GLOBAL_IP.limit,
      RATE_LIMITS.GLOBAL_IP.window
    );

    if (!result.allowed) {
      logRateLimitViolation('global-ip', ip, RATE_LIMITS.GLOBAL_IP.limit, req);
      return createRateLimitResponse(result.resetAt);
    }

    // For global limits, we don't update context.rateLimitInfo to avoid overriding more specific limits
    // The global limit is just a safety net, not the primary limit users see
  } catch (error) {
    // Fail open - allow request if global rate limiting fails
    // This ensures other rate limits can still protect the endpoint
    logError(error instanceof Error ? error : new Error(String(error)), context.endpoint, { middleware: 'globalIPRateLimit' }, req);
  }
};

// Multi-layer rate limit middleware factory
export function multiLayerRateLimitMiddleware(layers: Array<{
  identifier: string | ((req: Request, context: Context) => string);
  endpoint: string;
  limit: number;
  window: number;
}>): Middleware {
  return async (req, context) => {
    try {
      const resolvedLayers = layers.map(layer => ({
        identifier: typeof layer.identifier === 'function'
          ? layer.identifier(req, context)
          : layer.identifier,
        endpoint: layer.endpoint,
        limit: layer.limit,
        window: layer.window,
      }));

      const result = await checkMultiLayerRateLimit(resolvedLayers);

      if (!result.allowed) {
        logRateLimitViolation('multi-layer', resolvedLayers.map(l => l.identifier).join(','), Math.min(...resolvedLayers.map(l => l.limit)), req);
        return createRateLimitResponse(result.resetAt);
      }

      context.rateLimitInfo = {
        remaining: result.remaining,
        resetAt: result.resetAt,
        limit: Math.min(...resolvedLayers.map(l => l.limit)),
      };

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), context.endpoint, { middleware: 'multiLayerRateLimit' }, req);
      // Fail open
    }
  };
}

// Validation middleware factory
export function validationMiddleware<T>(schema: z.ZodSchema<T>): Middleware {
  return async (req, context) => {
    const result = await validateRequest(req, schema);

    if (!result.success) {
      logValidationError(context.endpoint, [result.error], req);
      return createValidationErrorResponse(result.error, context.rateLimitInfo);
    }

    // Store validated data in context
    context.validatedData = result.data;
  };
}

// Authentication middleware - requires authenticated user
export const authMiddleware: Middleware = async (req, context) => {
  const authResult = await requireAuth(req);

  if (authResult instanceof Response) {
    logAuthFailure(context.endpoint, 'Authentication required', req);
    return authResult;
  }

  context.user = authResult.user;
};

// Admin middleware - requires admin role
export const adminMiddleware: Middleware = async (req, context) => {
  const adminResult = await requireAdmin(req);

  if (adminResult instanceof Response) {
    logAuthFailure(context.endpoint, 'Admin access required', req);
    return adminResult;
  }

  context.user = adminResult.user;
  context.profile = adminResult.profile;
};

// Logging middleware - logs request start
export const loggingMiddleware: Middleware = async (req, context) => {
  log('INFO', `Request started: ${req.method} ${context.endpoint}`, {
    method: req.method,
    userAgent: context.userAgent,
    ip: context.ip,
  });
};

// Error handler middleware - catches and logs errors
export const errorHandlerMiddleware: Middleware = async (req, context) => {
  // This middleware doesn't do anything by itself
  // It's here to ensure errors are caught by the composer
};

// Helper function to add rate limit headers to responses
export function addRateLimitHeaders(response: Response, rateLimitInfo?: { remaining: number; resetAt: number; limit: number }): Response {
  if (!rateLimitInfo) return response;

  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString());
  headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.floor(rateLimitInfo.resetAt / 1000).toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Helper function to create successful JSON responses with proper headers
export function createJsonResponse(data: any, status: number = 200, rateLimitInfo?: Context['rateLimitInfo']): Response {
  const headers = {
    'Content-Type': 'application/json',
    ...corsHeaders,
  };

  const response = new Response(JSON.stringify(data), {
    status,
    headers,
  });

  return addRateLimitHeaders(response, rateLimitInfo);
}

// Helper function to create error responses with proper headers
export function createErrorResponse(message: string, status: number = 400, code?: string, rateLimitInfo?: Context['rateLimitInfo']): Response {
  const headers = {
    'Content-Type': 'application/json',
    ...corsHeaders,
  };

  const response = new Response(JSON.stringify({
    error: message,
    code: code || 'ERROR',
  }), {
    status,
    headers,
  });

  return addRateLimitHeaders(response, rateLimitInfo);
}
