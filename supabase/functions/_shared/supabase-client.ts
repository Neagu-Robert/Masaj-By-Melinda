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

export function createUserClient(authToken: string): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!url) {
    throw new Error("Missing SUPABASE_URL environment variable");
  }

  if (!anonKey) {
    throw new Error("Missing SUPABASE_ANON_KEY environment variable");
  }

  return createClient(url, anonKey, {
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
