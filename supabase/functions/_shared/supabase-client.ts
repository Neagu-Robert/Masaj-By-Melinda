// Centralized Supabase client creation with consistent configuration

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Environment variable validation
function validateEnvironment(): void {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url) {
    throw new Error("Missing SUPABASE_URL environment variable");
  }

  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    throw new Error("Invalid SUPABASE_URL format");
  }
}

// Admin client factory - for admin operations (bypasses RLS)
let adminClient: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (!adminClient) {
    validateEnvironment();

    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    adminClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'supabase-edge-function',
        },
      },
    });
  }

  return adminClient;
}

// User client factory - for user-scoped operations (respects RLS)
const userClientCache = new Map<string, SupabaseClient>();

export function createUserClient(authToken: string): SupabaseClient {
  if (!userClientCache.has(authToken)) {
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!url) {
      throw new Error("Missing SUPABASE_URL environment variable");
    }

    if (!anonKey) {
      throw new Error("Missing SUPABASE_ANON_KEY environment variable");
    }

    const client = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Client-Info': 'supabase-edge-function',
        },
      },
    });

    userClientCache.set(authToken, client);

    // Clean up old clients after some time to prevent memory leaks
    // In a real implementation, you might want a more sophisticated cleanup strategy
    setTimeout(() => {
      userClientCache.delete(authToken);
    }, 30 * 60 * 1000); // 30 minutes
  }

  return userClientCache.get(authToken)!;
}

// Client configuration helper
export function configureClient(client: SupabaseClient): SupabaseClient {
  // Set reasonable timeouts for serverless environment
  // Note: This is more of a documentation of expected behavior
  // as Supabase client doesn't expose direct timeout configuration

  return client;
}

// Health check function for monitoring
export async function healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
  const startTime = Date.now();

  try {
    const client = createAdminClient();

    // Simple health check query
    const { error } = await client
      .from('profiles')
      .select('count')
      .limit(1)
      .single();

    const latency = Date.now() - startTime;

    if (error) {
      return {
        healthy: false,
        latency,
        error: error.message,
      };
    }

    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Type definitions for better DX (if you have a types file)
// These would typically be imported from a generated types file
export interface Database {
  // Add your database types here when available
  // This is a placeholder for type safety
}

export type TypedSupabaseClient = SupabaseClient<Database>;
