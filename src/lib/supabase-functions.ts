// Shared helpers for Supabase Edge Functions calls

import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const inferFunctionsBase = (): string => {
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
  if (supabaseUrl && /^https?:\/\//.test(supabaseUrl)) {
    // For localhost or hosted URLs, derive functions path from the actual supplied base URL
    return supabaseUrl.replace(/\/?$/, '') + '/functions/v1';
  }
  // Fallback to the known project functions domain (ensure production keeps working)
  return 'https://dgzmqlwqlfmdbnwqjjjr.functions.supabase.co';
};

export const FUNCTIONS_BASE: string = inferFunctionsBase();
export const SUPABASE_ANON: string = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string;

export const getSupabaseFunctionUrl = (fn: string): string => `${FUNCTIONS_BASE}/${fn}`;

export const supabaseAuthHeader = async (): Promise<Record<string, string>> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token ?? SUPABASE_ANON;

  return {
    Authorization: `Bearer ${token}`,
  };
};

import { RateLimitManager } from './rate-limit-manager';

/**
 * Invoke a rate-limited Supabase Edge Function with automatic rate limit handling
 * 
 * @param functionName - Name of the edge function to invoke
 * @param body - Request body
 * @param rateLimitKey - Key for storing rate limit state (e.g., 'auth', 'otp_+40712345678')
 * @param identifier - Identifier for rate limit (e.g., email, phone)
 * @returns Response with ok, data, error, and optional retryAfterSeconds
 */
export async function invokeRateLimited(
  functionName: string,
  body: any,
  rateLimitKey: string,
  identifier: string
): Promise<{ ok: boolean; data?: any; error?: string; retryAfterSeconds?: number; status?: number; }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });

    // Handle successful response (2xx, no error)
    if (!error) {
      RateLimitManager.clear(rateLimitKey);
      return { ok: true, data };
    }

    // For non-2xx responses, supabase.functions.invoke sets `error` (FunctionsHttpError).
    // `data` may or may not be populated depending on the client version.
    // Safely extract the response body from either `data` or `error.context`.
    let errorBody = data;
    if (!errorBody && (error as any)?.context) {
      try {
        errorBody = await (error as any).context.json();
      } catch {
        // context is not JSON-parseable, leave errorBody as null
      }
    }

    // Detect rate limit (429)
    if (
      errorBody?.error === 'Too many requests' ||
      errorBody?.code === 'RATE_LIMIT_EXCEEDED' ||
      (error as any)?.status === 429
    ) {
      RateLimitManager.updateFrom429Response(rateLimitKey, errorBody, identifier);
      return {
        ok: false,
        error: errorBody?.message || 'Rate limit exceeded',
        retryAfterSeconds: errorBody?.retryAfter || errorBody?.retryAfterSeconds,
        status: 429,
      };
    }

    // Detect service unavailable (503 — fail-closed OTP)
    if (errorBody?.code === 'SERVICE_UNAVAILABLE' || (error as any)?.status === 503) {
      return {
        ok: false,
        error: errorBody?.message || 'Service temporarily unavailable',
        status: 503,
      };
    }

    // All other errors
    return {
      ok: false,
      error: errorBody?.error || errorBody?.message || error.message || 'Request failed',
      status: (error as any)?.status || 500,
    };
  } catch (error) {
    console.error(`Error invoking ${functionName}:`, error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500,
    };
  }
}
