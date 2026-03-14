import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { resetPassword, validatePassword, doPasswordsMatch } from '@/services/auth/passwordReset';

import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ name: "robots", content: "noindex, nofollow" }];
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Check if we have the necessary parameters from the reset link
  useEffect(() => {
    // Supabase handles token verification automatically
    // But we need to handle hash fragments that might be present
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check if we have tokens in either search params or hash
    const hasTokens = urlParams.get('access_token') || hash.includes('access_token');
    
    if (hasTokens) {
      console.log('Password reset link with tokens detected');
      // Supabase will handle the authentication automatically
    } else {
      console.log('No tokens found in URL - this might be a direct visit');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setValidationErrors([]);
    setLoading(true);

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setValidationErrors(passwordValidation.errors);
      setLoading(false);
      return;
    }

    // Check if passwords match
    if (!doPasswordsMatch(newPassword, confirmPassword)) {
      setError('Parolele nu se potrivesc');
      setLoading(false);
      return;
    }

    const result = await resetPassword(newPassword);

    if (result.success) {
      setSuccess(result.message);
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } else {
      setError(result.error || result.message);
    }

    setLoading(false);
  };

  const handleBackToLogin = () => {
    navigate('/');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-violet-400">
            Setați Parolă Nouă
          </CardTitle>
          <p className="text-gray-400 mt-2">
            Introduceți noua parolă mai jos.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium text-gray-200">
                Parolă Nouă
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Introduceți parola nouă"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-[#7E69AB]"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-200">
                Confirmați Parola Nouă
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirmați parola nouă"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-[#7E69AB]"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {validationErrors.length > 0 && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded p-3">
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded p-3">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-400 text-sm bg-green-900/20 border border-green-800 rounded p-3">
                {success}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              disabled={loading}
            >
              {loading ? 'Se resetează...' : 'Resetează Parola'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleBackToLogin}
              className="w-full text-violet-400 hover:text-violet-300 hover:bg-violet-900/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Înapoi la Autentificare
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 