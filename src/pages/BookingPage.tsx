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
import BookingSummary from '@/components/booking/BookingSummary';
import { AvailabilitiesProvider } from '@/contexts/AvailabilitiesContext';
import { BookingsProvider } from '@/contexts/BookingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useServices } from '@/contexts/ServicesContext';
import { logAdminAction } from '@/lib/audit-logger';
import { useBookingNotifications } from '@/services/notifications/hooks';
import { 
  formatDateForDB, 
  checkForDoubleBooking, 
  validateBookingData 
} from '@/lib/booking-utils';
import { usePhoneVerification } from '@/contexts/PhoneVerificationContext';
import { PhoneVerificationModal } from '@/components/auth/PhoneVerificationModal';

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
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
  const { isVerified, startVerification, verificationStatus, error: verificationError, resetVerification } = usePhoneVerification();
  
  // Initialize the notifications hook
  const { sendBookingConfirmation, sendBookingConfirmationAdmin } = useBookingNotifications();

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

  const handleModalClose = () => {
    setIsVerificationModalOpen(false);
    const phoneNumber = form.getValues('phoneNumber');
    // Normalize like the context: strip non-digits, then leading 40 or 0, expect 9 digits
    let digits = phoneNumber.replace(/\D/g, '');
    if (digits.startsWith('40')) {
      digits = digits.slice(2);
    } else if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    const normalized = digits.length === 9 ? `+40${digits}` : null;
    if (normalized && isVerified(normalized)) {
      setIsPhoneVerified(true);
      // If user is authenticated, update profile phone and phone_verified, then refetch profile data
      if (user) {
        (async () => {
          try {
            await supabase
              .from('profiles')
              .update({ phone: normalized, phone_verified: true, phone_verified_at: new Date().toISOString() })
              .eq('id', user.id);
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, phone, phone_verified')
              .eq('id', user.id)
              .single();
            setProfileInfo({ fullName: profile?.full_name || '', phoneNumber: profile?.phone || '' });
            setUseProfilePhone(true);
            form.setValue('phoneNumber', profile?.phone || '');
          } catch (e) {
            // Ignore errors silently in UI; verification state already true
            console.error('Post-verify profile refresh failed', e);
          }
        })();
      }
    }
  };

  const onSubmit = async (data: any) => {
    const phoneNumber = form.getValues('phoneNumber');
    const formattedPhone = `+40${phoneNumber.replace(/\s+/g, '')}`;

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
    
    // Validate booking data using shared utility
    const validation = validateBookingData(selectedDate, selectedTime || '', selectedService || '');
    if (!validation.isValid) {
      toast("Eroare de validare", {
        description: validation.error || "Vă rugăm să completați toate câmpurile obligatorii"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Check for double booking using shared utility
      const doubleBookingCheck = await checkForDoubleBooking(selectedDate!, selectedTime!);
      
      if (doubleBookingCheck.isDoubleBooked) {
        toast("Slot indisponibil", {
          description: doubleBookingCheck.error || "Acest interval orar a fost deja rezervat. Vă rugăm să alegeți alt interval."
        });
        setIsSubmitting(false);
        return;
      }

      // Get service details
      const serviceDetails = getServiceByName(selectedService!);
      const serviceId = serviceDetails?.id || null;

      // Create the booking
      const bookingData = {
        first_name: data.fullName.split(' ')[0] || data.fullName,
        last_name: data.fullName.split(' ').slice(1).join(' ') || '',
        phone_number: data.phoneNumber,
        service_type: selectedService,
        service_id: serviceId,
        booking_date: formatDateForDB(selectedDate!),
        booking_time: selectedTime,
        user_id: user?.id || null,
        status: 'unconfirmed'
      };

      const { data: newBooking, error: insertError } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting booking:', insertError);
        toast("Eroare", {
          description: "A apărut o eroare la salvarea rezervării. Vă rugăm să încercați din nou."
        });
        setIsSubmitting(false);
        return;
      }

      // Log the booking creation
      if (user) {
        await logAdminAction(
          user.id,
          'booking.create.customer',
          'booking',
          newBooking.id,
          `Customer created booking for ${selectedService} on ${formatDateForDB(selectedDate!)} at ${selectedTime}`
        );
      }

      // Show success message
      toast("Rezervare primită!", {
        description: `Rezervarea pentru ${selectedService} pe ${formatDateForDB(selectedDate!)} la ${selectedTime} este în așteptare de aprobare.`,
      });

      // Send booking approval notification
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      let userEmail = '';
      if (userData?.user?.email) {
        userEmail = userData.user.email;
      } else if (userId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();
        userEmail = profileData?.email || '';
      }
      if (userId && userEmail) {
        try {
          await sendBookingConfirmation({
            bookingId: newBooking.id,
            userId: userId,
            userName: data.fullName,
            userEmail: userEmail,
            userPhone: data.phoneNumber,
            serviceName: selectedService!,
            serviceId: serviceId,
            serviceProvider: 'Melinda',
            bookingDate: selectedDate!,
            bookingTime: selectedTime!,
            duration: serviceDetails?.duration || 60,
            price: serviceDetails?.price || 140.00,
            status: 'unconfirmed'
          });
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
        }
      }

      // Reset form and redirect
      form.reset();
      setSelectedDate(undefined);
      setSelectedTime(undefined);
      setSelectedService(undefined);
      setUseProfileName(false);
      setUseProfilePhone(false);
      
      // Redirect to profile page
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
              />
              
              {/* 2. Service Selection */}
              <ServiceSelection 
                form={form} 
                setSelectedService={setSelectedService}
                disabled={!user}
              />
              
              {/* 3. Date and Time Selection */}
              <DateTimeSelection
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedTime={selectedTime}
                setSelectedTime={setSelectedTime}
                disabled={!user}
              />
              
              {/* 4. Booking Summary */}
              <BookingSummary
                form={form}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                selectedService={selectedService}
                disabled={!user}
              />
              
              <div className="flex justify-center">
                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedDate || !selectedTime || !selectedService || !user}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 text-lg font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Se procesează...' : 'Confirmă rezervarea'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
      <PhoneVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={handleModalClose}
        phoneNumber={form.getValues('phoneNumber')}
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