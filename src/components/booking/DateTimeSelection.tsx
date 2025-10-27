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
  getTomorrow,
  getAvailableTimeSlotsForDate
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
  const { availabilities, fetchAvailabilities } = useAvailabilities();
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);

  // Fetch booked time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      const fetchBookedSlots = async () => {
        const slots = await fetchBookedTimeSlots(selectedDate);
        setBookedTimeSlots(slots);
      };
      fetchBookedSlots();
    } else {
      setBookedTimeSlots([]);
    }
  }, [selectedDate]);

  // Fetch availabilities when date changes
  useEffect(() => {
    if (selectedDate) {
      const formattedDate = formatDateForDB(selectedDate);
      fetchAvailabilities(formattedDate, formattedDate);
    }
  }, [selectedDate, fetchAvailabilities]);

  // Get available hours for the selected date
  const getAvailableHoursForSelectedDate = () => {
    if (!selectedDate) return [];
    
    const formattedDate = formatDateForDB(selectedDate);
    
    // Get unavailable hours from availabilities context
    const unavailableHours = availabilities
      .filter(a => a.date === formattedDate && !a.is_available)
      .map(a => a.hour.slice(0, 5)); // Convert HH:MM:SS to HH:MM
    
    // Get base time slots based on business rules
    const baseTimeSlots = getAvailableTimeSlotsForDate(selectedDate);
    
    // Filter out both booked and unavailable hours using proper normalization
    const availableHours = baseTimeSlots.filter(hour => {
      // Check if hour is booked
      const isBooked = bookedTimeSlots.some(
        (b) => b === hour || b.padStart(5, "0") === hour.padStart(5, "0") || 
               b.replace(/^0/, "") === hour.replace(/^0/, "")
      );
      
      // Check if hour is unavailable (blocked)
      const isUnavailable = unavailableHours.some(
        (u) => u === hour || u.padStart(5, "0") === hour.padStart(5, "0") || 
               u.replace(/^0/, "") === hour.replace(/^0/, "")
      );
      
      return !isBooked && !isUnavailable;
    });
    
    return availableHours;
  };

  // Check if a date should be disabled in the calendar
  const isDateDisabled = (date: Date) => {
    const tomorrow = getTomorrow();
    const dayOfWeek = date.getDay();
    
    // Disable dates before tomorrow
    if (date < tomorrow) {
      return true;
    }
    
    // Disable Sundays
    if (dayOfWeek === 0) {
      return true;
    }
    
    return false;
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(''); // Reset time when date changes
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg md:text-xl text-violet-300">Selectați data și ora</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:space-x-4">
          <div className="w-full md:w-1/2">
            {/* Calendar Section */}
            <div className="flex items-center mb-3 md:mb-2">
              <CalendarIcon className="mr-2 h-5 w-5 text-violet-400" />
              <span className="font-medium text-violet-200 text-sm md:text-base">Selectați data</span>
            </div>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                className="rounded-md border border-gray-600 bg-gray-700 text-violet-200 pointer-events-auto w-full max-w-sm [&_.rdp-day]:text-violet-200 [&_.rdp-day_selected]:bg-violet-600 [&_.rdp-day_selected]:text-white [&_.rdp-day:hover]:bg-violet-600/20 [&_.rdp-day]:h-10 [&_.rdp-day]:w-10 [&_.rdp-day]:text-sm md:[&_.rdp-day]:h-9 md:[&_.rdp-day]:w-9 md:[&_.rdp-day]:text-base"
              />
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <div className="flex items-center mb-3 md:mb-2">
              <Clock className="mr-2 h-5 w-5 text-violet-400" />
              <span className="font-medium text-violet-200 text-sm md:text-base">Selectați ora</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
              {getAvailableHoursForSelectedDate().map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <Button
                    key={time}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className={`
                      h-14 md:h-12 text-sm md:text-base transition font-medium
                      ${isSelected ? 'bg-violet-600 text-white border-transparent hover:bg-violet-700' : ''}
                      ${!isSelected ? 'bg-gray-700 text-violet-200 border-gray-600 hover:bg-violet-600/20 hover:border-violet-500' : ''}
                    `}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                );
              })}
            </div>
            {selectedDate && getAvailableHoursForSelectedDate().length === 0 && (
              <p className="text-violet-300 text-sm mt-2">
                Nu sunt intervale disponibile pentru această dată.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateTimeSelection;
