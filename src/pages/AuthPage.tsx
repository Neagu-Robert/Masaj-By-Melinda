import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [redirectRole, setRedirectRole] = useState<string|null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (redirectRole === 'admin') {
      navigate('/admin', { replace: true });
    } else if (redirectRole === 'customer') {
      navigate('/home', { replace: true });
    }
  }, [redirectRole, navigate]);

  // Polling function to wait for the profile row to exist
  async function waitForProfileRow(userId, maxAttempts = 10, delayMs = 300) {
    for (let i = 0; i < maxAttempts; i++) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      if (profile) return true;
      await new Promise(res => setTimeout(res, delayMs));
    }
    return false;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isLogin) {
      // LOGIN
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else if (data.user) {
        // Fetch role from profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        if (profileError) setError(profileError.message);
        else if (profile?.role) setRedirectRole(profile.role);
        else setError('No role found for user.');
      }
    } else {
      // REGISTER
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Wait for the trigger to create the profile row
        const profileExists = await waitForProfileRow(data.user.id);
        if (profileExists) {
          // Attempt to update full_name
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', data.user.id);

          if (updateError) {
            console.error('Failed to update full name:', updateError.message);
            setError('Failed to update full name: ' + updateError.message);
          } else {
            setSuccess('Registration successful! Please check your email to verify your account.');
            setIsLogin(true); // Switch back to login view
          }
        } else {
          setError('Profile creation timed out. Please try again.');
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleAuth} className="bg-gray-800 p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-violet-400">
          {isLogin ? 'Login' : 'Register'}
        </h2>
        <input
          className="w-full mb-3 p-2 rounded bg-gray-700 text-white"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full mb-3 p-2 rounded bg-gray-700 text-white"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {!isLogin && (
          <input
            className="w-full mb-3 p-2 rounded bg-gray-700 text-white"
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
          />
        )}
        {error && <div className="text-red-500 mb-3">{error}</div>}
        {success && <div className="text-green-500 mb-3">{success}</div>}
        <button
          className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2 rounded font-semibold"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
        </button>
        <button
          type="button"
          className="w-full mt-4 text-sm text-violet-400 underline"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </button>
      </form>
    </div>
  );
} 