import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
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

const BookingPageContent = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [selectedService, setSelectedService] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  
  // Initialize the notifications hook
  const { sendBookingConfirmation } = useBookingNotifications();

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();
        setProfileInfo({
          fullName: profile?.full_name || '',
          phoneNumber: profile?.phone || ''
        });
      } else {
        setProfileInfo(null);
      }
    }
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (useProfileName && profileInfo?.fullName) {
      form.setValue('fullName', profileInfo.fullName);
    }
    if (useProfilePhone && profileInfo?.phoneNumber) {
      form.setValue('phoneNumber', profileInfo.phoneNumber);
    }
  }, [useProfileName, useProfilePhone, profileInfo, form]);
  
  const onSubmit = async (data: any) => {
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
        user_id: user?.id || null
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
      toast("Rezervare confirmată!", {
        description: `Rezervarea pentru ${selectedService} pe ${formatDateForDB(selectedDate!)} la ${selectedTime} a fost confirmată.`,
      });

      // Get user data for notification
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      // Get user email from auth or profile
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

      // Send booking confirmation notification
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
            status: 'confirmed'
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
      
      // Navigate to profile page to show the new booking
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
              Rezervați o programare
            </h1>
            <p className="text-gray-300 text-lg">
              Alegeți serviciul, data și ora dorită pentru programarea dumneavoastră
            </p>
          </div>

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
              />
              
              {/* 2. Service Selection */}
              <ServiceSelection 
                form={form} 
                setSelectedService={setSelectedService} 
              />
              
              {/* 3. Date and Time Selection */}
              <DateTimeSelection
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedTime={selectedTime}
                setSelectedTime={setSelectedTime}
              />
              
              {/* 4. Booking Summary */}
              <BookingSummary
                form={form}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                selectedService={selectedService}
              />
              
              <div className="flex justify-center">
                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedDate || !selectedTime || !selectedService}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 text-lg font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Se procesează...' : 'Confirmă rezervarea'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
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