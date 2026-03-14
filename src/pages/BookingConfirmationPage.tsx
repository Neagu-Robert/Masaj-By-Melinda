import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { getSupabaseFunctionUrl, supabaseAuthHeader } from '@/lib/supabase-functions';

const BookingConfirmationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: isAuthLoading } = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const action = searchParams.get('action');
    const bookingId = searchParams.get('booking_id');

    if (token && action && bookingId) {
      const processBookingResponse = async () => {
        setIsProcessing(true);
        setError(null);
        
        try {
          const functionUrl = getSupabaseFunctionUrl('booking-response');
          const url = new URL(functionUrl);
          url.searchParams.set('token', token);
          url.searchParams.set('action', action);
          url.searchParams.set('booking_id', bookingId);
          
          const headers = await supabaseAuthHeader();

          const response = await fetch(url.toString(), {
            method: 'GET',
            headers,
            // Edge function handles redirects manually, so we don't follow them automatically
            redirect: 'manual' 
          });

          // A 0 status with 'cors' type indicates a successful but opaque redirect.
          // This is the expected success scenario for cross-origin redirects.
          if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
            // Since we can't access the redirect URL directly due to CORS,
            // we assume the server-side logic handled it correctly.
            if (action === 'accept') {
              toast.success('Rezervarea a fost confirmată cu noile date sugerate. Vă așteptăm cu nerăbdare!');
            } else if (action === 'decline') {
              toast.info('Am primit răspunsul dumneavoastră și vă vom contacta în curând pentru a găsi o dată potrivită.');
            }
          // Handle non-redirect success responses that might return JSON
          } else if (response.ok) {
            try {
              const data = await response.json();
              if (data.status === 'success') {
                 if (action === 'accept') {
                    toast.success('Rezervare confirmată cu succes!');
                } else if (action === 'decline') {
                    toast.info('Răspunsul a fost înregistrat.');
                }
              } else {
                throw new Error(data.error || 'Răspuns neașteptat de la server.');
              }
            } catch (e) {
               // If response.ok is true but body is not JSON or parsing fails, 
               // it might be a simple success with no body. Treat as success.
                if (action === 'accept') {
                    toast.success('Acțiune procesată cu succes!');
                } else if (action === 'decline') {
                    toast.info('Acțiune procesată cu succes!');
                }
            }
          } else {
            // Handle cases where the function returns a JSON error instead of redirecting.
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.error || 'A apărut o eroare necunoscută. Vă rugăm să încercați din nou.';
            throw new Error(errorMessage);
          }
        } catch (e: any) {
          const errorMessage = e.message || "A apărut o eroare la procesarea răspunsului.";
          setError(errorMessage);
          toast.error(errorMessage);
        } finally {
          setIsProcessing(false);
        }
      };
      
      processBookingResponse();
    } else {
      // This handles the redirect from the edge function (now obsolete) or direct access
      const status = searchParams.get('status');
      const message = searchParams.get('message');
      const actionParam = searchParams.get('action');

      if (status) {
        if (status === 'success') {
          if (actionParam === 'accept') {
            toast.success('Rezervare confirmată cu succes!');
          } else if (actionParam === 'decline') {
            toast.info('Răspunsul a fost înregistrat.');
          }
        } else if (status === 'error') {
          const errorMessage = message || 'A apărut o eroare la procesarea răspunsului.';
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } else {
         const errorMessage = "Link invalid sau expirat. Vă rugăm să folosiți link-ul din email.";
         setError(errorMessage);
         toast.error(errorMessage);
      }
      setIsProcessing(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isProcessing || isAuthLoading) {
      return;
    }
    
    const redirectTimeout = setTimeout(() => {
      if (user) {
        navigate('/profile', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }, 1500); // Increased delay for toast visibility

    return () => clearTimeout(redirectTimeout);
  }, [isProcessing, isAuthLoading, user, navigate]);


  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center px-4">
        {isProcessing ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Se procesează răspunsul...</p>
          </>
        ) : (
          <p className="text-muted-foreground">
            {error ? error : 'Procesare finalizată. Vei fi redirecționat în curând.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
