
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { Calendar as CalendarIcon, Clock, User, Phone } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';

const BookingPage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [selectedService, setSelectedService] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 8; // Start from 8 AM
    return `${hour}:00`;
  });
  
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

      // Split full name into first name and last name
      const nameParts = data.fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Format date as YYYY-MM-DD
      const formattedDate = selectedDate.toISOString().split('T')[0];

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

  // Massage services that match the pricing section
  const massageServices = [
    "Masaj de relaxare",
    "Masaj terapeutic",
    "Masaj de drenaj limfatic",
    "Masaj anticelulitic",
    "Masaj facial",
    "Masaj cu pietre vulcanice",
    "Masaj cu bete de bambus"
  ];
  
  // Device treatments that match the pricing section
  const deviceServices = [
    "Termocuverta Treatment",
    "Volcanic Stone Therapy",
    "40Khz Cavitation Body Remodeling",
    "Electrostimulation Treatment",
    "TECAR Radiofrequency"
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white/80 backdrop-blur-sm fixed w-full z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-semibold text-[#7E69AB]">Serenity Spa</div>
            <Button 
              onClick={() => navigate('/')}
              className="bg-[#9b87f5] text-white hover:bg-[#7E69AB]"
            >
              Back to pricing
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center text-[#63099c] mb-12">Book Your Session</h2>
          
          <div className="max-w-3xl mx-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Date de contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nume complet</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                              <Input 
                                placeholder="Introduceți numele complet" 
                                className="pl-10" 
                                {...field}
                                required
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Număr de telefon</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                              <Input 
                                placeholder="Introduceți numărul de telefon" 
                                className="pl-10" 
                                {...field}
                                required
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Service Selection with Radio Group */}
                <Card>
                  <CardHeader>
                    <CardTitle>Selectați serviciul</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem className="space-y-6">
                          <FormControl>
                            <div className="space-y-4">
                              {/* Massage Services Section */}
                              <div>
                                <h4 className="text-lg font-medium text-[#7E69AB] mb-2">Masaje</h4>
                                <RadioGroup 
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    setSelectedService(value);
                                  }}
                                  value={field.value}
                                  className="grid grid-cols-1 md:grid-cols-2 gap-2"
                                >
                                  {massageServices.map((service) => (
                                    <div key={service} className="flex items-center space-x-2 rounded-md border p-3 hover:bg-slate-50">
                                      <RadioGroupItem value={service} id={service} />
                                      <label 
                                        htmlFor={service} 
                                        className="flex-1 cursor-pointer text-sm font-medium"
                                      >
                                        {service}
                                      </label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </div>
                              
                              {/* Device Services Section */}
                              <div>
                                <h4 className="text-lg font-medium text-[#7E69AB] mb-2">Tratamente cu aparate</h4>
                                <RadioGroup 
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    setSelectedService(value);
                                  }}
                                  value={field.value}
                                  className="grid grid-cols-1 md:grid-cols-2 gap-2"
                                >
                                  {deviceServices.map((service) => (
                                    <div key={service} className="flex items-center space-x-2 rounded-md border p-3 hover:bg-slate-50">
                                      <RadioGroupItem value={service} id={service} />
                                      <label 
                                        htmlFor={service} 
                                        className="flex-1 cursor-pointer text-sm font-medium"
                                      >
                                        {service}
                                      </label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Date and Time Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Selectați data și ora</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col md:flex-row md:space-x-4">
                      <div className="mb-4 md:mb-0 md:w-1/2">
                        <div className="flex items-center mb-2">
                          <CalendarIcon className="mr-2 h-5 w-5 text-gray-500" />
                          <span className="font-medium">Selectați data</span>
                        </div>
                        <Calendar 
                          mode="single" 
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          className="rounded-md border pointer-events-auto"
                          disabled={(date) => date < new Date()}
                        />
                      </div>
                      <div className="md:w-1/2">
                        <div className="flex items-center mb-2">
                          <Clock className="mr-2 h-5 w-5 text-gray-500" />
                          <span className="font-medium">Selectați ora</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {timeSlots.map((time) => (
                            <Button
                              key={time}
                              type="button"
                              variant={selectedTime === time ? "default" : "outline"}
                              className={`${selectedTime === time ? 'bg-[#7E69AB] text-white' : 'text-gray-700'}`}
                              onClick={() => setSelectedTime(time)}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Booking Summary */}
                {selectedDate && selectedTime && form.watch('fullName') && form.watch('phoneNumber') && selectedService && (
                  <Card className="border-2 border-[#7E69AB]/30">
                    <CardHeader>
                      <CardTitle>Rezumatul rezervării</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p><strong>Nume:</strong> {form.watch('fullName')}</p>
                      <p><strong>Telefon:</strong> {form.watch('phoneNumber')}</p>
                      <p><strong>Serviciu:</strong> {selectedService}</p>
                      <p><strong>Data:</strong> {selectedDate.toLocaleDateString('ro-RO')}</p>
                      <p><strong>Ora:</strong> {selectedTime}</p>
                    </CardContent>
                  </Card>
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
