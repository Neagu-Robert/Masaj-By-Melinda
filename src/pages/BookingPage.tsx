
import React, { useState } from 'react';
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

const BookingPage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [selectedService, setSelectedService] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm({
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      serviceType: '',
    }
  });

  const onSubmit = async (data: any) => {
    if (!selectedDate || !selectedTime || !selectedService) {
      toast("Selectați data și ora", {
        description: "Vă rugăm să alegeți data, ora și serviciul pentru rezervare"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);

      // Format date as YYYY-MM-DD
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      // Check one more time if the slot is already booked (prevents race conditions)
      const { data: existingBookings, error: checkError } = await supabase
        .from('bookings')
        .select('id')
        .eq('booking_date', formattedDate)
        .eq('booking_time', selectedTime);
        
      if (checkError) {
        console.error('Error checking booking availability:', checkError);
        toast("Eroare", {
          description: "A apărut o eroare la verificarea disponibilității. Vă rugăm să încercați din nou.",
        });
        setIsSubmitting(false);
        return;
      }
      
      if (existingBookings && existingBookings.length > 0) {
        toast("Slot rezervat", {
          description: "Ne pare rău, acest slot a fost deja rezervat. Vă rugăm să selectați altă dată sau oră."
        });
        setIsSubmitting(false);
        return;
      }

      // Split full name into first name and last name
      const nameParts = data.fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Insert booking data into Supabase
      const { error } = await supabase
        .from('bookings')
        .insert({
          first_name: firstName,
          last_name: lastName,
          phone_number: data.phoneNumber,
          service_type: selectedService,
          booking_date: formattedDate,
          booking_time: selectedTime
        });

      if (error) {
        console.error('Error saving booking:', error);
        toast("Eroare", {
          description: "A apărut o eroare la salvarea rezervării. Vă rugăm să încercați din nou.",
        });
      } else {
        toast("Confirmare trimisă", {
          description: "Rezervarea dumneavoastră a fost trimisă cu succes!"
        });
        
        // Reset form after successful submission
        setTimeout(() => {
          form.reset();
          setSelectedDate(undefined);
          setSelectedTime(undefined);
          setSelectedService(undefined);
          navigate('/', { state: { fromBooking: true } });
        }, 2000);
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast("Eroare", {
        description: "A apărut o eroare la salvarea rezervării. Vă rugăm să încercați din nou.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <BookingHeader />

      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center text-[#63099c] mb-12">Book Your Session</h2>
          
          <div className="max-w-3xl mx-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Contact Information */}
                <ContactForm form={form} />

                {/* Service Selection */}
                <ServiceSelection form={form} setSelectedService={setSelectedService} />

                {/* Date and Time Selection */}
                <DateTimeSelection 
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  selectedTime={selectedTime}
                  setSelectedTime={setSelectedTime}
                />

                {/* Booking Summary */}
                {selectedDate && selectedTime && form.watch('fullName') && form.watch('phoneNumber') && selectedService && (
                  <BookingSummary 
                    form={form} 
                    selectedDate={selectedDate} 
                    selectedTime={selectedTime}
                    selectedService={selectedService}
                  />
                )}

                {/* Submit Button */}
                <div className="flex justify-center">
                  <Button 
                    type="submit"
                    className="bg-[#63099c] hover:bg-[#63099c]/90 text-white text-xl py-6 px-8 w-full md:w-auto"
                    disabled={isSubmitting}
                  >
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

export default BookingPage;
