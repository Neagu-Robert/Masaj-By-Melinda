
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
              {isLoading && <span className="ml-2 text-sm text-gray-500">(Încărcare...)</span>}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((time) => {
                const isBooked = isTimeSlotBooked(time);
                return (
                  <Button
                    key={time}
                    type="button"
                    variant={selectedTime === time ? "default" : "outline"}
                    className={`
                      ${selectedTime === time ? 'bg-[#7E69AB] text-white' : 'text-gray-700'}
                      ${isBooked ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300' : 'border-2 border-[#9b87f5] hover:bg-[#9b87f5]/10'}
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
