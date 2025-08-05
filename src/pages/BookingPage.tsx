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

  // Helper function to format date correctly without timezone issues
  const formatDateForDB = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const onSubmit = async (data: any) => {
    if (!selectedDate || !selectedTime || !selectedService) {
      toast("Selectați data și ora", {
        description: "Vă rugăm să alegeți data, ora și serviciul pentru rezervare"
      });
      return;
    }
    try {
      setIsSubmitting(true);

      // Format date correctly without timezone conversion
      const formattedDate = formatDateForDB(selectedDate);

      // Check one more time if the slot is already booked (prevents race conditions)
      const {
        data: existingBookings,
        error: checkError
      } = await supabase.from('bookings').select('id').eq('booking_date', formattedDate).eq('booking_time', selectedTime);
      if (checkError) {
        console.error('Error checking booking availability:', checkError);
        toast("Eroare", {
          description: "A apărut o eroare la verificarea disponibilității. Vă rugăm să încercați din nou."
        });
        setIsSubmitting(false);
        return;
      }
      if (existingBookings && existingBookings.length > 0) {
        toast("Slot indisponibil", {
          description: "Acest interval orar a fost deja rezervat. Vă rugăm să alegeți alt interval."
        });
        setIsSubmitting(false);
        return;
      }

      // Get service details
      const serviceDetails = getServiceByName(selectedService);
      const serviceId = serviceDetails?.id || null;

      // Create the booking
      const bookingData = {
        first_name: data.fullName.split(' ')[0] || data.fullName,
        last_name: data.fullName.split(' ').slice(1).join(' ') || '',
        phone_number: data.phoneNumber,
        service_type: selectedService,
        service_id: serviceId,
        booking_date: formattedDate,
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
          `Customer created booking for ${selectedService} on ${formattedDate} at ${selectedTime}`
        );
      }

      // Show success message
      toast("Rezervare confirmată!", {
        description: `Rezervarea pentru ${selectedService} pe ${formattedDate} la ${selectedTime} a fost confirmată.`,
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
      try {
        await sendBookingConfirmation({
          bookingId: newBooking.id,
          userId: userId || newBooking.user_id || '',
          userName: data.fullName,
          userEmail: userEmail,
          userPhone: data.phoneNumber,
          serviceName: selectedService,
          serviceId: serviceId, // Include service_id in notification data
          serviceProvider: 'Melinda', // Default provider
          bookingDate: formattedDate,
          bookingTime: selectedTime,
          duration: serviceDetails?.duration || 60,
          price: serviceDetails?.price || 140.00,
          status: 'confirmed'
        });
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't block the booking process if notification fails
      }

      // Reset form after successful submission
      setTimeout(() => {
        form.reset();
        setSelectedDate(undefined);
        setSelectedTime(undefined);
        setSelectedService(undefined);
        navigate('/home', {
          state: {
            fromBooking: true
          }
        });
      }, 2000);
    } catch (error) {
      console.error('Submission error:', error);
      toast("Eroare", {
        description: "A apărut o eroare la salvarea rezervării. Vă rugăm să încercați din nou."
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900">
      <BookingHeader />

      <div className="pt-20 md:pt-24 pb-16 md:pb-20 px-3 md:px-0">
        <div className="container mx-auto">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-center mb-6 md:mb-8 lg:mb-12 text-purple-500">Rezervăți Masajul</h2>
          <div className="max-w-3xl mx-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6 lg:space-y-8">
                {/* Contact Information */}
                <ContactForm 
                  form={form} 
                  profileInfo={profileInfo}
                  useProfileName={useProfileName}
                  setUseProfileName={setUseProfileName}
                  useProfilePhone={useProfilePhone}
                  setUseProfilePhone={setUseProfilePhone}
                />
                {/* Service Selection */}
                <ServiceSelection form={form} setSelectedService={setSelectedService} />
                {/* Date and Time Selection */}
                <DateTimeSelection selectedDate={selectedDate} setSelectedDate={setSelectedDate} selectedTime={selectedTime} setSelectedTime={setSelectedTime} />
                {/* Booking Summary */}
                {selectedDate && selectedTime && form.watch('fullName') && form.watch('phoneNumber') && selectedService && <BookingSummary form={form} selectedDate={selectedDate} selectedTime={selectedTime} selectedService={selectedService} />}
                {/* Submit Button */}
                <div className="flex justify-center pt-4">
                  <Button type="submit" className="bg-[#63099c] hover:bg-[#63099c]/90 text-white text-base md:text-lg lg:text-xl py-4 md:py-6 px-6 md:px-8 w-full md:w-auto h-14 md:h-auto" disabled={isSubmitting}>
                    {isSubmitting ? "Se procesează..." : "Confirmă rezervarea"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookingPage = () => {
  return (
    <BookingsProvider>
      <AvailabilitiesProvider>
        <BookingPageContent />
      </AvailabilitiesProvider>
    </BookingsProvider>
  );
};

export default BookingPage;