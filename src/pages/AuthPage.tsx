import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logAdminAction } from "@/lib/audit-logger";
import { Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const { user, role, loading: authLoading, enterAsGuest } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [prenume, setPrenume] = useState('');
  const [nume, setNume] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // This effect handles redirection after a successful login
    // or if a logged-in user visits the auth page.
    if (!authLoading && user) {
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'customer') {
        navigate('/home', { replace: true });
      }
    }
  }, [user, role, authLoading, navigate]);

  // Check if user already exists in profiles table
  const checkExistingUser = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.error('Error checking existing user or new user registration:', error);
        return null;
      }

      return data; // Returns user data if found, null if not found
    } catch (error) {
      console.error('Error in checkExistingUser:', error);
      return null;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setIsBanned(false);

    if (isLogin) {
      try {
        // Step 1: Securely check the user's status before attempting to sign in.
        const { data: status, error: rpcError } = await supabase.rpc('get_user_status_by_email', {
          p_email: email,
        });

        if (rpcError) {
          // This will catch if the function doesn't exist or another DB error occurs.
          // We'll treat it as a normal login flow and let the password check fail.
          console.warn('RPC function get_user_status_by_email failed:', rpcError.message);
        }

        if (status === 'banned') {
          setError('Your account has been banned. Please contact support.');
          setIsBanned(true);
          setLoading(false);
          return; // Stop execution here
        }

        // Step 2: If user is not banned, proceed with the actual login.
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          setError(signInError.message);
        }
        // On successful sign-in, the global AuthContext listener will handle the redirect.
      } catch (err) {
        console.error('Login error:', err);
        setError('An unexpected error occurred during login.');
      }
    } else {
      // REGISTER
      // First, check if user already exists
      const existingUser = await checkExistingUser(email);
      
      if (existingUser) {
        setError('User already registered, please login.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Wait for the trigger to create the profile row
        const fullName = `${prenume.trim()} ${nume.trim()}`;
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', data.user.id);

        if (updateError) {
          setError('Failed to update full name: ' + updateError.message);
        } else {
          setSuccess('Registration successful! Please check your email to verify your account.');
          setIsLogin(true); // Switch back to login view
        }
      }
    }
    setLoading(false);
  };

  const toggleFormMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setIsBanned(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleAuth} className="bg-gray-800 p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-violet-400">
          {isLogin ? 'Login' : 'Register'}
        </h2>
        <input
          className="w-full mb-3 p-2 rounded bg-gray-700 text-white disabled:opacity-50"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={isBanned}
        />
        <div className="relative mb-3">
          <input
            className="w-full p-2 rounded bg-gray-700 text-white disabled:opacity-50 pr-10"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={isBanned}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={isBanned}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {!isLogin && (
          <>
            <input
              className="w-full mb-3 p-2 rounded bg-gray-700 text-white disabled:opacity-50"
              type="text"
              placeholder="Prenume"
              value={prenume}
              onChange={e => setPrenume(e.target.value)}
              required
              disabled={isBanned}
            />
            <input
              className="w-full mb-3 p-2 rounded bg-gray-700 text-white disabled:opacity-50"
              type="text"
              placeholder="Nume"
              value={nume}
              onChange={e => setNume(e.target.value)}
              required
              disabled={isBanned}
            />
          </>
        )}
        {error && <div className="text-red-500 mb-3">{error}</div>}
        {success && <div className="text-green-500 mb-3">{success}</div>}
        <button
          className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2 rounded font-semibold disabled:bg-violet-800"
          type="submit"
          disabled={loading || isBanned}
        >
          {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
        </button>
        <button
          type="button"
          className="w-full mt-4 text-sm text-violet-400 underline"
          onClick={toggleFormMode}
        >
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </button>
        {isLogin && (
          <button
            type="button"
            className="w-full mt-2 text-sm text-violet-400 underline"
            onClick={() => navigate('/forgot-password')}
          >
            Forgot your password?
          </button>
        )}

        {/* Guest entry CTA */}
        <div className="mt-6">
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-gray-700" />
            <span className="mx-3 text-gray-400 text-xs">or</span>
            <div className="flex-grow border-t border-gray-700" />
          </div>
          <button
            type="button"
            className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-semibold"
            onClick={async () => {
              await enterAsGuest();
              navigate('/home', { replace: true });
            }}
          >
            Continue as Guest
          </button>
        </div>
      </form>
    </div>
  );
} 