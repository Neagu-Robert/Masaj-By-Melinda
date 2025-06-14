
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type DateTimeSelectionProps = {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string | undefined;
  setSelectedTime: (time: string) => void;
};

const DateTimeSelection = ({ 
  selectedDate, 
  setSelectedDate, 
  selectedTime, 
  setSelectedTime 
}: DateTimeSelectionProps) => {
  // Generate time slots from 8 AM to 8 PM
  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 8; // Start from 8 AM
    return `${hour}:00`;
  });

  // State to track booked time slots for the selected date
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Helper function to format date correctly without timezone issues
  const formatDateForDB = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch booked time slots when the selected date changes
  useEffect(() => {
    const fetchBookedTimeSlots = async () => {
      if (!selectedDate) return;

      setIsLoading(true);
      
      // Format date correctly without timezone conversion
      const formattedDate = formatDateForDB(selectedDate);
      
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('booking_time')
          .eq('booking_date', formattedDate);
          
        if (error) {
          console.error('Error fetching booked time slots:', error);
          return;
        }
        
        // Extract booked times from the response
        const bookedTimes = data.map(booking => booking.booking_time);
        setBookedTimeSlots(bookedTimes);
        
        // If the currently selected time is now booked, reset it
        if (selectedTime && bookedTimes.includes(selectedTime)) {
          setSelectedTime('');
        }
      } catch (error) {
        console.error('Error in fetching booked slots:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookedTimeSlots();
  }, [selectedDate, selectedTime, setSelectedTime]);

  // Check if a time slot is booked
  const isTimeSlotBooked = (time: string) => bookedTimeSlots.includes(time);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl text-white">Selectați data și ora</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:space-x-4">
          <div className="w-full md:w-1/2">
            <div className="flex items-center mb-2">
              <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" />
              <span className="font-medium text-gray-200">Selectați data</span>
            </div>
            <div className="flex justify-center">
              <Calendar 
                mode="single" 
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border border-gray-600 bg-gray-700 text-white pointer-events-auto w-full max-w-sm [&_.rdp-day]:text-white [&_.rdp-day_selected]:bg-[#7E69AB] [&_.rdp-day_selected]:text-white [&_.rdp-day:hover]:bg-gray-600"
                disabled={(date) => date < new Date()}
              />
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <div className="flex items-center mb-2">
              <Clock className="mr-2 h-5 w-5 text-gray-400" />
              <span className="font-medium text-gray-200">Selectați ora</span>
              {isLoading && <span className="ml-2 text-sm text-gray-400">(Încărcare...)</span>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {timeSlots.map((time) => {
                const isBooked = isTimeSlotBooked(time);
                return (
                  <Button
                    key={time}
                    type="button"
                    variant={selectedTime === time ? "default" : "outline"}
                    className={`
                      h-12 text-sm md:text-base
                      ${selectedTime === time ? 'bg-[#7E69AB] text-white hover:bg-[#7E69AB]/90' : 'text-gray-200 bg-gray-700 border-gray-600'}
                      ${isBooked ? 'bg-gray-600 text-gray-500 cursor-not-allowed hover:bg-gray-600 border-gray-600' : 'hover:bg-[#63099c]/20 hover:border-[#63099c]'}
                    `}
                    onClick={() => !isBooked && setSelectedTime(time)}
                    disabled={isBooked}
                  >
                    {time}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateTimeSelection;
