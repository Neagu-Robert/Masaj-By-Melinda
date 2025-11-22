import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail } from 'lucide-react';
import { sendPasswordResetEmail } from '@/services/auth/passwordReset';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await sendPasswordResetEmail(email);

    if (result.success) {
      setSuccess(result.message);
      setEmail('');
    } else {
      setError(result.error || result.message);
    }

    setLoading(false);
  };

  const handleBackToLogin = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[url('/lovable-uploads/8659eb40-96fc-4579-9af8-1b649574c3ff.png')] bg-cover bg-center">
      <div className="min-h-screen w-full flex items-center justify-center backdrop-blur-sm bg-gray-900/60">
        <Card className="w-full max-w-md bg-gray-800/90 backdrop-blur-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-center text-white">
              Resetare Parolă
            </CardTitle>
            <p className="text-gray-400 mt-2">
              Introduceți adresa de email și vă vom trimite un link pentru resetarea parolei.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-200">
                  Adresă Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Introduceți emailul"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-[#7E69AB]"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

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
                {loading ? 'Se trimite...' : 'Trimite Link de Resetare'}
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
    </div>
  );
} 