import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logAdminAction } from "@/lib/audit-logger";

export default function AuthPage() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [isBanned, setIsBanned] = useState(false);

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
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Wait for the trigger to create the profile row
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
        <input
          className="w-full mb-3 p-2 rounded bg-gray-700 text-white disabled:opacity-50"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          disabled={isBanned}
        />
        {!isLogin && (
          <input
            className="w-full mb-3 p-2 rounded bg-gray-700 text-white disabled:opacity-50"
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            disabled={isBanned}
          />
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
      </form>
    </div>
  );
} 