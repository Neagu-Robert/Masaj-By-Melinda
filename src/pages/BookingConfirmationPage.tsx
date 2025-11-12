import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const BookingConfirmationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const action = searchParams.get('action');
    const status = searchParams.get('status');
    const message = searchParams.get('message');
    // const bookingId = searchParams.get('bookingId');

    // Show toast notification based on response
    if (status === 'success') {
      if (action === 'accept') {
        toast.success('Rezervarea a fost confirmată cu noile date sugerate. Vă așteptăm cu nerăbdare!');
      } else if (action === 'decline') {
        toast.info('Am primit răspunsul dumneavoastră și vă vom contacta în curând pentru a găsi o dată potrivită.');
      }
    } else if (status === 'error') {
      toast.error(message || 'A apărut o eroare la procesarea răspunsului.');
    }

    // Redirect after a short delay to allow the user to see the toast
    const redirectTimeout = setTimeout(() => {
      if (!isLoading) {
        if (user) {
          navigate('/profile', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    }, 500); // Small delay for toast visibility

    // Cleanup timeout on unmount
    return () => clearTimeout(redirectTimeout);
  }, [searchParams, user, isLoading, navigate]);

  // This is a transient page, so we just show a loading indicator.
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Se procesează răspunsul...</p>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
