import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useAvailabilities } from '../../contexts/AvailabilitiesContext';
import { 
  TIME_SLOTS, 
  formatDateForDB, 
  fetchBookedTimeSlots, 
  isTimeSlotUnavailable,
  getTomorrow 
} from '@/lib/booking-utils';

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
  // Track booked time slots for the selected date
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { availabilities, fetchAvailabilities } = useAvailabilities();
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);

  // Fetch booked slots each time selectedDate changes
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!selectedDate) {
        setBookedTimeSlots([]);
        return;
      }
      setIsLoading(true);
      try {
        const booked = await fetchBookedTimeSlots(selectedDate);
        setBookedTimeSlots(booked);
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
    fetchBookedSlots();
  }, [selectedDate, selectedTime, setSelectedTime]);

  // Fetch availabilities for the selected date
  useEffect(() => {
    if (!selectedDate) {
      setUnavailableSlots([]);
      return;
    }
    const formattedDate = formatDateForDB(selectedDate);
    // Fetch availabilities for just this date
    fetchAvailabilities(formattedDate, formattedDate);
  }, [selectedDate, fetchAvailabilities]);

  // Compute unavailable slots from availabilities context
  useEffect(() => {
    if (!selectedDate) {
      setUnavailableSlots([]);
      return;
    }
    const formattedDate = formatDateForDB(selectedDate);
    const slots: string[] = [];
    availabilities
      .filter(a => a.date === formattedDate)
      .forEach(a => {
        if (!a.is_available) {
          slots.push(a.hour.slice(0, 5));
        }
      });
    setUnavailableSlots(slots);
  }, [availabilities, selectedDate]);

  // If the current selected time just became unavailable, reset it
  useEffect(() => {
    if (selectedTime && (bookedTimeSlots.includes(selectedTime) || unavailableSlots.includes(selectedTime))) {
      setSelectedTime('');
    }
  }, [bookedTimeSlots, unavailableSlots, selectedTime, setSelectedTime]);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg md:text-xl text-white">Selectați data și ora</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:space-x-4">
          <div className="w-full md:w-1/2">
            {/* Calendar Section */}
            <div className="flex items-center mb-3 md:mb-2">
              <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" />
              <span className="font-medium text-gray-200 text-sm md:text-base">Selectați data</span>
            </div>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border border-gray-600 bg-gray-700 text-white pointer-events-auto w-full max-w-sm [&_.rdp-day]:text-white [&_.rdp-day_selected]:bg-[#7E69AB] [&_.rdp-day_selected]:text-white [&_.rdp-day:hover]:bg-gray-600 [&_.rdp-day]:h-10 [&_.rdp-day]:w-10 [&_.rdp-day]:text-sm md:[&_.rdp-day]:h-9 md:[&_.rdp-day]:w-9 md:[&_.rdp-day]:text-base"
                disabled={(date) => date < getTomorrow()}
              />
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <div className="flex items-center mb-3 md:mb-2">
              <Clock className="mr-2 h-5 w-5 text-gray-400" />
              <span className="font-medium text-gray-200 text-sm md:text-base">Selectați ora</span>
              {isLoading && <span className="ml-2 text-xs md:text-sm text-gray-400">(Încărcare...)</span>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
              {TIME_SLOTS.map((time) => {
                const isUnavailable = isTimeSlotUnavailable(time, bookedTimeSlots, unavailableSlots);
                const isSelected = selectedTime === time && !isUnavailable;
                return (
                  <Button
                    key={time}
                    type="button"
                    variant={isUnavailable ? "outline" : isSelected ? "default" : "outline"}
                    className={`
                      h-14 md:h-12 text-sm md:text-base transition font-medium
                      ${isSelected ? 'bg-[#7E69AB] text-white border-transparent hover:bg-[#7E69AB]/90' : ''}
                      ${isUnavailable
                        ? 'bg-gray-700 text-gray-500 border-gray-600 opacity-60 cursor-not-allowed pointer-events-none'
                        : !isSelected
                          ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-[#63099c]/20 hover:border-[#63099c]'
                          : ''}
                    `}
                    onClick={() => {
                      if (!isUnavailable) {
                        setSelectedTime(time);
                      }
                    }}
                    disabled={isUnavailable}
                    aria-disabled={isUnavailable}
                    tabIndex={isUnavailable ? -1 : 0}
                  >
                    {time}
                    {isUnavailable && (
                      <span className="ml-1 md:ml-2 text-xs text-red-400 align-middle">(indisponibil)</span>
                    )}
                  </Button>
                );
              })}
            </div>
            {selectedDate && (bookedTimeSlots.length > 0 || unavailableSlots.length > 0) && (
              <div className="mt-3 md:mt-2 text-xs text-gray-400">
                * Intervalele marcate "indisponibil" nu pot fi selectate
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateTimeSelection;
