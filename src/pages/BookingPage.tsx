import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import BookingHeader from '@/components/booking/BookingHeader';
import ContactForm from '@/components/booking/ContactForm';
import ServiceSelection from '@/components/booking/ServiceSelection';
import DateTimeSelection from '@/components/booking/DateTimeSelection';
import { AvailabilitiesProvider } from '@/contexts/AvailabilitiesContext';
import { BookingsProvider } from '@/contexts/BookingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useServices } from '@/contexts/ServicesContext';
import { logAdminAction } from '@/lib/audit-logger';
import { invokeRateLimited } from '@/lib/supabase-functions';
import { usePhoneVerification } from '@/contexts/PhoneVerificationContext';
import { PhoneVerificationModal } from '@/components/auth/PhoneVerificationModal';
import { FormErrorBoundary } from '@/components/FormErrorBoundary';

const AuthPromptMessage = () => {
  const navigate = useNavigate();
  
  return (
    <Card className="bg-violet-600 border-violet-500 mb-6">
      <CardContent className="p-6 text-center">
        <h2 className="text-xl font-bold text-white mb-4">
          Pentru a face o rezervare, vă rugăm să vă autentificați
        </h2>
        <div className="flex gap-4 justify-center">
          <Button 
            onClick={() => navigate('/auth?mode=signup')}
            className="bg-violet-700 hover:bg-violet-800 text-white"
          >
            Înregistrare
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/auth?mode=login')}
            className="bg-white text-violet-700 border-white hover:bg-gray-100"
          >
            Autentificare
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const BookingPageContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [selectedService, setSelectedService] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const form = useForm({
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      serviceType: ''
    }
  });
  const { user } = useAuth();
  const { services, getServiceByName } = useServices();
  const [profileInfo, setProfileInfo] = useState<{ fullName: string; phoneNumber: string | null } | null>(null);
  const [useProfileName, setUseProfileName] = useState(false);
  const [useProfilePhone, setUseProfilePhone] = useState(false);
  const { isVerified, startVerification, verificationStatus, error: verificationError, resetVerification, canRequestOtp, isRateLimited } = usePhoneVerification();

  useEffect(() => {
    if (verificationError) {
      toast("Eroare", { description: verificationError });
      resetVerification(); // Clear the error state after showing
    }
  }, [verificationError, resetVerification]);

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, phone_verified')
          .eq('id', user.id)
          .single();
        setProfileInfo({
          fullName: profile?.full_name || '',
          phoneNumber: profile?.phone || ''
        });
        setIsPhoneVerified(profile?.phone_verified || false);
      } else {
        setProfileInfo(null);
        setIsPhoneVerified(false);
      }
    }
    fetchProfile();
  }, [user]);

  // Preselect service from navigation state or query parameter; scroll to top to show step 1
  useEffect(() => {
    // Always position at the top (step 1: contact info)
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const stateService = (location.state as any)?.service as string | undefined;
    const urlService = new URLSearchParams(location.search).get('service') || undefined;
    const requested = stateService || urlService || undefined;
    if (!requested) return;

    // When services are loaded, validate and set
    const match = services.find(s => s.is_active && s.name.toLowerCase() === requested.toLowerCase());
    if (match) {
      form.setValue('serviceType', match.name);
      setSelectedService(match.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, location.search, services]);

  useEffect(() => {
    if (useProfileName && profileInfo?.fullName) {
      form.setValue('fullName', profileInfo.fullName);
    }
    if (useProfilePhone && profileInfo?.phoneNumber) {
      form.setValue('phoneNumber', profileInfo.phoneNumber);
    }
  }, [useProfileName, useProfilePhone, profileInfo, form]);

  const phoneNumberValue = form.watch('phoneNumber');

  // Compute isVerifyThrottled: derive formatted phone and check throttling
  const isVerifyThrottled = (() => {
    if (!phoneNumberValue) return false;
    // Normalize like the context: strip non-digits, then leading 40 or 0, expect 9 digits
    let digits = phoneNumberValue.replace(/\D/g, '');
    if (digits.startsWith('40')) {
      digits = digits.slice(2);
    } else if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    const formattedPhone = digits.length === 9 ? `+40${digits}` : null;
    return formattedPhone ? (!canRequestOtp(formattedPhone) || isRateLimited) : false;
  })();

  useEffect(() => {
    let isMounted = true;

    const checkVerificationStatus = async () => {
      if (user && profileInfo?.phoneNumber) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone_verified')
          .eq('id', user.id)
          .single();

        if (isMounted) {
          if (profile?.phone_verified && phoneNumberValue === profileInfo.phoneNumber) {
            setIsPhoneVerified(true);
          } else {
            setIsPhoneVerified(false);
          }
        }
      } else {
        if (isMounted) {
          // Normalize like the context: strip non-digits, then leading 40 or 0, expect 9 digits
          let digits = (phoneNumberValue || '').replace(/\D/g, '');
          if (digits.startsWith('40')) {
            digits = digits.slice(2);
          } else if (digits.startsWith('0')) {
            digits = digits.slice(1);
          }
          const normalized = digits.length === 9 ? `+40${digits}` : null;
          setIsPhoneVerified(normalized ? isVerified(normalized) : false);
        }
      }
    };

    checkVerificationStatus();

    return () => {
      isMounted = false;
    };
  }, [phoneNumberValue, user, profileInfo, isVerified]);
  
  const handleVerifyPhone = async () => {
    const phoneNumber = form.getValues('phoneNumber');
    const success = await startVerification(phoneNumber, user?.id);
    if (success) {
      setIsVerificationModalOpen(true);
    }
  };

  const handleVerificationSuccess = async () => {
    // Query profiles (full_name, phone, phone_verified) for user.id from Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, phone, phone_verified')
      .eq('id', user.id)
      .single();

    // Check for error or missing data
    if (error || !profile) {
      toast("Eroare", {
        description: "Nu s-a putut verifica statusul telefonului. Vă rugăm să încercați din nou."
      });
      return;
    }

    // Only proceed if phone_verified is true
    if (!profile.phone_verified) {
      toast("Eroare", {
        description: "Telefonul nu a fost verificat cu succes."
      });
      return;
    }

    // Update profileInfo state with the DB values
    setProfileInfo({
      fullName: profile.full_name || '',
      phoneNumber: profile.phone || ''
    });
    // Set isPhoneVerified to true (sourced from the DB row)
    setIsPhoneVerified(true);
    // Call form.setValue('phoneNumber', profile.phone) so the form field matches the verified DB phone
    form.setValue('phoneNumber', profile.phone || '');
    // Set useProfilePhone(true)
    setUseProfilePhone(true);
  };

  const handleModalClose = () => {
    setIsVerificationModalOpen(false);
    resetVerification();
  };

  const onSubmit = async (data: any) => {
    // Step 1: Phone verification guard
    if (!isPhoneVerified) {
      toast("Eroare de validare", {
        description: "Vă rugăm să vă verificați numărul de telefon înainte de a continua.",
        action: {
          label: "Verifică acum",
          onClick: handleVerifyPhone,
        },
      });
      return;
    }

    // Step 2: Required fields guard
    if (!requestedDate.trim() || !selectedService) {
      toast("Eroare de validare", {
        description: "Vă rugăm să completați toate câmpurile obligatorii"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Step 3: Get service details
      const serviceDetails = getServiceByName(selectedService!);
      const serviceId = serviceDetails?.id || null;

      // Step 4: Build payload for create-booking edge function
      // NOTE: full_name is sent as-is; the edge function splits it into first/last name
      const bookingPayload = {
        full_name: data.fullName,
        phone_number: data.phoneNumber,
        service_type: selectedService,
        service_id: serviceId,
        requested_date_text: requestedDate.trim(),
        requested_time_text: requestedTime.trim() || null,
      };

      // Step 5: Call create-booking edge function via rate-limited wrapper
      // Booking uses server-only enforcement: no countdown timer, just a toast on 429
      const result = await invokeRateLimited(
        'create-booking',
        bookingPayload,
        'booking',
        user?.id || ''
      );

      // Step 6: Handle rate limit (429) — server-only enforcement, no countdown timer
      if (!result.ok && result.status === 429) {
        toast("Prea multe rezervări", {
          description: "Ați atins limita de rezervări. Vă rugăm să încercați din nou mai târziu.",
        });
        return;
      }

      // Step 7: Handle other errors
      if (!result.ok) {
        toast("Eroare", {
          description: "A apărut o eroare la salvarea rezervării. Vă rugăm să încercați din nou."
        });
        return;
      }

      // Step 8: Success — log audit action (edge function handles email notification)
      if (user) {
        await logAdminAction(
          user.id,
          'booking.create.customer',
          'booking',
          result.data.booking_id,
          `Customer created booking request for ${selectedService} - requested date: ${requestedDate}${requestedTime ? ', time: ' + requestedTime : ''}`
        );
      }

      // Step 9: Show success toast using message from edge function
      toast("Rezervare primită!", {
        description: result.data?.message || `Cererea dumneavoastră pentru ${selectedService} (${requestedDate}${requestedTime ? ', ' + requestedTime : ''}) a fost trimisă cu succes. Veți fi contactat pentru confirmare.`,
      });

      // Step 10: Reset form and redirect to profile
      form.reset();
      setRequestedDate('');
      setRequestedTime('');
      setSelectedService(undefined);
      setUseProfileName(false);
      setUseProfilePhone(false);
      navigate('/profile');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast("Eroare", {
        description: "A apărut o eroare neașteptată. Vă rugăm să încercați din nou."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <BookingHeader />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Faceți o rezervare
            </h1>
            <p className="text-gray-300 text-lg">
              Alegeți serviciul, data și ora dorită pentru programarea dumneavoastră
            </p>
          </div>

          {!user && <AuthPromptMessage />}

          <FormErrorBoundary feature="booking">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* 1. Personal Details */}
                <ContactForm
                  form={form}
                  profileInfo={profileInfo}
                  useProfileName={useProfileName}
                  setUseProfileName={setUseProfileName}
                  useProfilePhone={useProfilePhone}
                  setUseProfilePhone={setUseProfilePhone}
                  onVerifyPhone={handleVerifyPhone}
                  isPhoneVerified={isPhoneVerified}
                  disabled={!user}
                  isVerifyPending={verificationStatus === 'pending'}
                  isVerifyThrottled={isVerifyThrottled}
                />
                
                {/* 2. Service Selection */}
                <ServiceSelection 
                  form={form} 
                  setSelectedService={setSelectedService}
                  disabled={!user}
                />
                
                {/* 3. Date and Time Selection */}
                <DateTimeSelection
                  requestedDate={requestedDate}
                  setRequestedDate={setRequestedDate}
                  requestedTime={requestedTime}
                  setRequestedTime={setRequestedTime}
                  disabled={!user}
                />
                
                <div className="flex justify-center">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !requestedDate.trim() || !selectedService || !user}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 text-lg font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Se procesează...' : 'Trimite cererea'}
                  </Button>
                </div>
              </form>
            </Form>
          </FormErrorBoundary>
        </div>
      </div>
      <PhoneVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={handleModalClose}
        phoneNumber={form.getValues('phoneNumber')}
        userId={user?.id}
        onVerified={handleVerificationSuccess}
      />
    </div>
  );
};

const BookingPage = () => {
  return (
    <AvailabilitiesProvider>
      <BookingsProvider>
        <BookingPageContent />
      </BookingsProvider>
    </AvailabilitiesProvider>
  );
};

export default BookingPage;