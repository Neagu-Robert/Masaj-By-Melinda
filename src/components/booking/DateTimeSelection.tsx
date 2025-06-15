
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
  setSelectedTime,
}: DateTimeSelectionProps) => {
  // Generate time slots from 8 AM to 8 PM
  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 8; // Start from 8 AM
    return `${hour}:00`;
  });

  // Track booked time slots for the selected date
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Helper: format date correctly
  const formatDateForDB = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch booked slots each time selectedDate changes
  useEffect(() => {
    const fetchBookedTimeSlots = async () => {
      if (!selectedDate) {
        setBookedTimeSlots([]);
        return;
      }
      setIsLoading(true);

      const formattedDate = formatDateForDB(selectedDate);

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('booking_time')
          .eq('booking_date', formattedDate);

        if (error) {
          console.error('Error fetching booked time slots:', error);
          setBookedTimeSlots([]);
          return;
        }

        const booked = (data ?? []).map(booking => {
          // booking.booking_time may be "14:00:00" so adjust to "14:00"
          return (booking.booking_time || "").toString().slice(0, 5);
        });
        setBookedTimeSlots(booked);

        // If the currently selected time is now booked, reset it
        if (selectedTime && booked.includes(selectedTime)) {
          setSelectedTime('');
        }
      } catch (error) {
        console.error('Error in fetching booked slots:', error);
        setBookedTimeSlots([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookedTimeSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // If the current selected time just became booked, reset it
  useEffect(() => {
    if (selectedTime && bookedTimeSlots.includes(selectedTime)) {
      setSelectedTime('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookedTimeSlots]);

  // Is slot booked (normalize/compare)
  const isTimeSlotBooked = (time: string) => {
    // time = "8:00", booked = "08:00"
    const normalized = time.padStart(5, "0");
    return bookedTimeSlots.some(
      (b) => b === time || b === normalized || b.replace(/^0/, "") === time.replace(/^0/, "")
    );
  };

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
                const isSelected = selectedTime === time && !isBooked;
                return (
                  <Button
                    key={time}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className={`
                      h-12 text-sm md:text-base transition
                      ${isSelected ? 'bg-[#7E69AB] text-white hover:bg-[#7E69AB]/90 border-transparent' : ''}
                      ${isBooked
                        ? 'bg-gray-700 text-gray-500 border-gray-600 opacity-60 cursor-not-allowed pointer-events-none'
                        : 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-[#63099c]/20 hover:border-[#63099c]'}
                    `}
                    onClick={() => {
                      if (!isBooked) {
                        setSelectedTime(time);
                      }
                    }}
                    disabled={isBooked}
                    aria-disabled={isBooked}
                    tabIndex={isBooked ? -1 : 0}
                  >
                    {time}
                    {isBooked && (
                      <span className="ml-2 text-xs text-red-400 align-middle">(rezervat)</span>
                    )}
                  </Button>
                );
              })}
            </div>
            {selectedDate && bookedTimeSlots.length > 0 && (
              <div className="mt-2 text-xs text-gray-400">
                * Intervalele marcate "rezervat" nu pot fi selectate
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateTimeSelection;

