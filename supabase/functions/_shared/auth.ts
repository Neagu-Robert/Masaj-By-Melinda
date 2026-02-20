// Centralized authentication and authorization middleware for Edge Functions

import { SupabaseClient, User } from "@supabase/supabase-js";
import { corsHeaders } from "./cors.ts";
import { createAdminClient, createUserClient } from "./supabase-client.ts";

// Types for our profiles table
interface Profile {
  id: string;
  user_id: string;
  role: 'customer' | 'admin';
  phone?: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}


// Authentication functions

// Get authenticated user from JWT token
export async function getAuthenticatedUser(req: Request): Promise<{ user: User | null; error?: string }> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Missing or invalid Authorization header' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const client = createUserClient(token);

    const { data: { user }, error } = await client.auth.getUser(token);

    if (error) {
      return { user: null, error: error.message };
    }

    if (!user) {
      return { user: null, error: 'User not found' };
    }

    return { user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

// Require authentication - returns user or 401 response
export async function requireAuth(req: Request): Promise<{ user: User } | Response> {
  const result = await getAuthenticatedUser(req);

  if (!result.user) {
    return createUnauthorizedResponse(result.error);
  }

  return { user: result.user };
}

// Authorization functions

// Check admin role - returns user + profile or 403 response
export async function requireAdmin(req: Request): Promise<{ user: User; profile: Profile } | Response> {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { user } = authResult;
  const client = createAdminClient();

  try {
    const { data: profile, error } = await client
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Profile lookup error:', error);
      return createUnauthorizedResponse('Profile not found');
    }

    if (!profile) {
      return createUnauthorizedResponse('Profile not found');
    }

    if (profile.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    return { user, profile };
  } catch (error) {
    console.error('Admin check error:', error);
    return createUnauthorizedResponse('Authorization check failed');
  }
}

// Check user ownership - allows users to manage their own resources, admins to manage all
export async function requireOwnership(
  req: Request,
  resourceUserId: string
): Promise<{ user: User } | Response> {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { user } = authResult;

  // If user owns the resource, allow access
  if (user.id === resourceUserId) {
    return { user };
  }

  // Check if user is admin
  const client = createAdminClient();
  try {
    const { data: profile, error } = await client
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (error || !profile || profile.role !== 'admin') {
      return createForbiddenResponse('Access denied: ownership or admin role required');
    }

    return { user };
  } catch (error) {
    console.error('Ownership check error:', error);
    return createForbiddenResponse('Authorization check failed');
  }
}

// Guest session validation (for phone-based guest bookings)
export async function validateGuestSession(
  req: Request,
  phone: string
): Promise<{ valid: boolean; sessionId?: string }> {
  try {
    // Check for session cookie or header
    const sessionId = req.headers.get('X-Session-ID') || req.headers.get('session-id');

    if (!sessionId) {
      return { valid: false };
    }

    const client = createAdminClient();

    // Check if session exists and is valid
    const { data: session, error } = await client
      .from('guest_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('phone', phone)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      return { valid: false };
    }

    return { valid: true, sessionId };
  } catch (error) {
    console.error('Guest session validation error:', error);
    return { valid: false };
  }
}

// User context extraction (helper for rate limiting and logging)
export async function getUserContext(req: Request): Promise<{
  userId?: string;
  isAdmin: boolean;
  isGuest: boolean;
}> {
  try {
    const authResult = await getAuthenticatedUser(req);

    if (authResult.user) {
      const client = createAdminClient();
      const { data: profile } = await client
        .from('profiles')
        .select('role')
        .eq('user_id', authResult.user.id)
        .single();

      return {
        userId: authResult.user.id,
        isAdmin: profile?.role === 'admin',
        isGuest: false,
      };
    }

    // Check if it's a guest session
    const phone = req.headers.get('X-Phone-Number');
    if (phone) {
      const sessionResult = await validateGuestSession(req, phone);
      if (sessionResult.valid) {
        return {
          userId: `guest:${phone}`,
          isAdmin: false,
          isGuest: true,
        };
      }
    }

    // Anonymous/unauthenticated
    return {
      userId: undefined,
      isAdmin: false,
      isGuest: false,
    };
  } catch (error) {
    console.error('User context extraction error:', error);
    // Return safe defaults
    return {
      userId: undefined,
      isAdmin: false,
      isGuest: false,
    };
  }
}

// Error response helpers

export function createUnauthorizedResponse(message?: string): Response {
  return new Response(
    JSON.stringify({
      error: 'Unauthorized',
      message: message || 'Authentication required',
      code: 'UNAUTHORIZED'
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

export function createForbiddenResponse(message?: string): Response {
  return new Response(
    JSON.stringify({
      error: 'Forbidden',
      message: message || 'Access denied',
      code: 'FORBIDDEN'
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}
