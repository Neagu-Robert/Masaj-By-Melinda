import { supabase } from '@/integrations/supabase/client';
import { notify } from '@/services/notifications';

export interface PasswordResetResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface PasswordChangeResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Get the correct redirect URL based on environment
 */
const getRedirectUrl = (): string => {
  // In development, use localhost with port 8080
  if (import.meta.env.DEV) {
    return 'http://localhost:8080/reset-password';
  }
  
  // In production, use the current origin (should be your domain)
  return `${window.location.origin}/reset-password`;
};

/**
 * Send password reset email to user
 */
export const sendPasswordResetEmail = async (email: string): Promise<PasswordResetResult> => {
  try {
    const redirectUrl = getRedirectUrl();
    
    console.log('Sending password reset email to:', email);
    console.log('Redirect URL:', redirectUrl);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('Supabase password reset error:', error);
      return {
        success: false,
        message: 'Failed to send password reset email',
        error: error.message,
      };
    }

    // Send notification email about password reset request
    try {
      await notify({
        type: 'password_reset_requested',
        recipient: {
          userId: null, // We don't have user ID at this point
          email: email,
          phone: '',
          name: email.split('@')[0] // Use email prefix as name
        },
        data: {
          bookingId: '',
          userId: null,
          userName: email.split('@')[0],
          userEmail: email,
          userPhone: '',
          serviceName: '',
          serviceId: null,
          dateTime: new Date().toISOString(),
          duration: 0,
          price: 0,
          status: 'pending'
        }
      });
    } catch (notificationError) {
      console.error('Error sending password reset notification:', notificationError);
      // Don't fail the password reset if notification fails
    }

    return {
      success: true,
      message: 'Password reset email sent successfully. Please check your email.',
    };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Reset password using the token from email
 */
export const resetPassword = async (newPassword: string): Promise<PasswordResetResult> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        message: 'Failed to reset password',
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    };
  } catch (error) {
    console.error('Error resetting password:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Change password for logged-in user
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<PasswordChangeResult> => {
  try {
    // First, verify the current password by attempting to sign in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        message: 'User not authenticated',
        error: 'User must be logged in to change password',
      };
    }

    // Verify current password by attempting to sign in with it
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return {
        success: false,
        message: 'Current password is incorrect',
        error: 'Please enter your current password correctly',
      };
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return {
        success: false,
        message: 'Failed to change password',
        error: updateError.message,
      };
    }

    // Send password change notification
    try {
      await notify({
        type: 'password_changed',
        recipient: {
          userId: user.id,
          email: user.email!,
          phone: '',
          name: user.user_metadata?.full_name || user.email!
        },
        data: {
          bookingId: '',
          userId: user.id,
          userName: user.user_metadata?.full_name || user.email!,
          userEmail: user.email!,
          userPhone: '',
          serviceName: '',
          serviceId: null,
          dateTime: new Date().toISOString(),
          duration: 0,
          price: 0,
          status: 'completed'
        }
      });
    } catch (notificationError) {
      console.error('Error sending password change notification:', notificationError);
      // Don't fail the password change if notification fails
    }

    return {
      success: true,
      message: 'Password changed successfully.',
    };
  } catch (error) {
    console.error('Error changing password:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Check if passwords match
 */
export const doPasswordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
}; 