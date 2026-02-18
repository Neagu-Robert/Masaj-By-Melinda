// supabase/functions/delete-user/index.ts

import { createAdminClient } from '../_shared/supabase-client.ts';
import { compose, corsMiddleware, adminMiddleware, rateLimitMiddleware, validationMiddleware, loggingMiddleware, errorHandlerMiddleware, createJsonResponse, createErrorResponse } from '../_shared/middleware.ts';
import { DeleteUserSchema } from '../_shared/validation.ts';
import { logAdminAction } from '../_shared/logger.ts';

// Handler function with security layers
const handler = async (req: Request, context: any) => {
  const { userId, confirm } = context.validatedData;
  const supabaseAdmin = createAdminClient();

  try {
    // Verify the target user exists and is a customer
    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError || !targetProfile) {
      return createErrorResponse('User not found.', 404, 'USER_NOT_FOUND', context.rateLimitInfo);
    }

    if (targetProfile.role !== 'customer') {
      return createErrorResponse('Can only delete customer accounts.', 400, 'INVALID_ROLE', context.rateLimitInfo);
    }

    // Prevent self-deletion
    if (context.user.id === userId) {
      return createErrorResponse('Cannot delete your own account.', 400, 'SELF_DELETION', context.rateLimitInfo);
    }

    // Delete the user from auth schema
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('User deletion error:', deleteError);
      return createErrorResponse('Failed to delete user account.', 500, 'DELETION_FAILED', context.rateLimitInfo);
    }

    // Log admin action
    logAdminAction('delete_user', context.user.id, userId, {
      targetRole: targetProfile.role,
      confirmed: confirm,
    }, req);

    return createJsonResponse({
      success: true,
      message: 'User account deleted successfully.',
    }, 200, context.rateLimitInfo);

  } catch (error) {
    console.error('Delete user error:', error);
    return createErrorResponse('Failed to delete user account.', 500, 'INTERNAL_ERROR', context.rateLimitInfo);
  }
};

// Apply security middleware
const securedHandler = compose(
  corsMiddleware,
  loggingMiddleware,
  errorHandlerMiddleware,
  adminMiddleware, // CRITICAL: Require admin role
  rateLimitMiddleware({
    identifier: (req, context) => context.user?.id || 'unknown',
    endpoint: 'delete-user',
    limit: 5,
    window: 3600, // 5 deletions per hour per admin
  }),
  validationMiddleware(DeleteUserSchema)
)(handler);

// Export the secured handler
Deno.serve(securedHandler); 