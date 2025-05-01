
import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

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
  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 8; // Start from 8 AM
    return `${hour}:00`;
  });

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
  );
};

export default DateTimeSelection;
