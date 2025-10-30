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
    // First, check if the email exists in the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      // Handle cases where the RPC call fails or the email is not found
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116: "The result contains 0 rows"
        console.error('Error checking email existence:', profileError);
        return {
          success: false,
          message: 'Nu s-a putut verifica existența emailului.',
          error: profileError.message,
        };
      }
      
      return {
        success: false,
        message: 'Email-ul introdus nu este inregistrat, va rugam sa va inregistrati',
        error: 'Email neînregistrat',
      };
    }

    const redirectUrl = getRedirectUrl();
    
    console.log('Trimitere email de resetare a parolei către:', email);
    console.log('URL de Redirecționare:', redirectUrl);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('Eroare la resetarea parolei Supabase:', error);
      return {
        success: false,
        message: 'Eroare la trimiterea emailului de resetare a parolei',
        error: error.message,
      };
    }

    // Send notification email about password reset request
    // Note: We don't send notifications for password reset requests since we don't have user preferences
    // and it could be spam. Users will get the actual reset email from Supabase.
   

    return {
      success: true,
      message: 'Emailul de resetare a parolei a fost trimis cu succes. Vă rugăm să verificați emailul.',
    };
  } catch (error) {
    console.error('Eroare la trimiterea emailului de resetare a parolei:', error);
    return {
      success: false,
      message: 'A apărut o eroare neașteptată',
      error: error instanceof Error ? error.message : 'Eroare necunoscută',
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
        message: 'Eroare la resetarea parolei',
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'Parola a fost resetată cu succes. Vă puteți autentifica acum cu noua parolă.',
    };
  } catch (error) {
    console.error('Eroare la resetarea parolei:', error);
    return {
      success: false,
      message: 'A apărut o eroare neașteptată',
      error: error instanceof Error ? error.message : 'Eroare necunoscută',
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
        message: 'Utilizator neautentificat',
        error: 'Utilizatorul trebuie să fie autentificat pentru a schimba parola',
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
        message: 'Parola curentă este incorectă',
        error: 'Vă rugăm să introduceți corect parola curentă',
      };
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return {
        success: false,
        message: 'Eroare la schimbarea parolei',
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
          status: 'completat'
        }
      });
    } catch (notificationError) {
      console.error('Eroare la trimiterea notificării de schimbare a parolei:', notificationError);
      // Don't fail the password change if notification fails
    }

    return {
      success: true,
      message: 'Parola a fost schimbată cu succes.',
    };
  } catch (error) {
    console.error('Eroare la schimbarea parolei:', error);
    return {
      success: false,
      message: 'A apărut o eroare neașteptată',
      error: error instanceof Error ? error.message : 'Eroare necunoscută',
    };
  }
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Parola trebuie să aibă cel puțin 8 caractere');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Parola trebuie să conțină cel puțin o literă mare');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Parola trebuie să conțină cel puțin o literă mică');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Parola trebuie să conțină cel puțin un număr');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Parola trebuie să conțină cel puțin un caracter special');
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