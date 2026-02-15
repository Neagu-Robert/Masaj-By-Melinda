import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logAdminAction } from "@/lib/audit-logger";
import { Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const { user, role, loading: authLoading } = useAuth();
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
          setError('Contul dumneavoastră a fost blocat. Vă rugăm să contactați suportul.');
          setIsBanned(true);
          setLoading(false);
          return; // Stop execution here
        }

        // Step 2: If user is not banned, call auth-proxy edge function for rate-limited authentication
        const { data, error: proxyError } = await supabase.functions.invoke('auth-proxy', {
          body: { email, password }
        });

        // Handle rate limit errors (429)
        if (proxyError && (
          proxyError.message?.includes('FunctionsHttpError: 429') || 
          data?.retryAfter
        )) {
          setError('Prea multe încercări. Vă rugăm să încercați din nou mai târziu.');
          setLoading(false);
          return;
        }

        // Handle other errors from auth-proxy
        if (proxyError || !data?.session) {
          setError('Something went wrong, try again');
          setLoading(false);
          return;
        }

        // Step 3: Set session with tokens from auth-proxy response
        const { access_token, refresh_token } = data.session;
        
        if (!access_token || !refresh_token) {
          setError('Something went wrong, try again');
          setLoading(false);
          return;
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });

        if (sessionError) {
          console.error('Session setting error:', sessionError);
          setError('Something went wrong, try again');
          setLoading(false);
          return;
        }

        // On successful session set, the global AuthContext listener will handle the redirect.
      } catch (err) {
        console.error('Login error:', err);
        setError('Something went wrong, try again');
      }
    } else {
      // REGISTER
      // First, check if user already exists
      const existingUser = await checkExistingUser(email);
      
      if (existingUser) {
        setError('Utilizator deja înregistrat, vă rugăm să vă autentificați.');
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
          setError('Eroare la actualizarea numelui complet: ' + updateError.message);
        } else {
          setSuccess('Înregistrare reușită! Vă rugăm să verificați emailul pentru a vă activa contul.');
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
        <div className="text-white">Se încarcă...</div>
      </div>
    );
  }

return (
  <div className="min-h-screen bg-[url('/lovable-uploads/8659eb40-96fc-4579-9af8-1b649574c3ff.png')] bg-cover bg-center">
    <div className="min-h-screen w-full flex items-center justify-center backdrop-blur-sm bg-gray-900/60">
    <form onSubmit={handleAuth} className="bg-gray-800/90 backdrop-blur-md p-8 rounded shadow-md w-full max-w-sm">
      <div className="text-center mb-4">
        <div className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-500 mb-2">Masaj by Melinda</div>
      </div>
        <h2 className="text-2xl font-bold mb-6 text-center text-violet-400">
          {isLogin ? 'Autentificare' : 'Înregistrare'}
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
            placeholder="Parolă"
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
            aria-label={showPassword ? 'Ascunde parola' : 'Arată parola'}
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
          {loading ? 'Vă rugăm așteptați...' : isLogin ? 'Autentificare' : 'Înregistrare'}
        </button>
        <button
          type="button"
          className="w-full mt-4 text-sm text-violet-400 underline"
          onClick={toggleFormMode}
        >
          {isLogin ? "Nu aveți cont? Înregistrați-vă" : "Aveți deja cont? Autentificați-vă"}
        </button>
        {isLogin && (
          <button
            type="button"
            className="w-full mt-2 text-sm text-violet-400 underline"
            onClick={() => navigate('/forgot-password')}
          >
            Ați uitat parola?
          </button>
        )}
      </form>
    </div>
  </div>
);
} 