import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type DateTimeSelectionProps = {
  requestedDate: string;
  setRequestedDate: (date: string) => void;
  requestedTime: string;
  setRequestedTime: (time: string) => void;
  disabled?: boolean;
};

const DateTimeSelection = ({
  requestedDate,
  setRequestedDate,
  requestedTime,
  setRequestedTime,
  disabled,
}: DateTimeSelectionProps) => {
  return (
    <Card className={`bg-gray-800 border-gray-700 ${disabled ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg md:text-xl text-violet-300">Specificați data și ora dorită</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-violet-200 font-medium">Data dorită *</Label>
          <Input
            type="text"
            value={requestedDate}
            onChange={(e) => setRequestedDate(e.target.value)}
            placeholder="ex: marți viitoare, 15 ianuarie, peste o săptămână"
            disabled={disabled}
            required
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-violet-500 h-12 md:h-14 text-base md:text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-violet-200 font-medium">Ora dorită (opțional)</Label>
          <Input
            type="text"
            value={requestedTime}
            onChange={(e) => setRequestedTime(e.target.value)}
            placeholder="ex: dimineața, 14:00, după-amiază"
            disabled={disabled}
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-violet-500 h-12 md:h-14 text-base md:text-lg"
          />
        </div>

        <p className="text-violet-300 text-sm mt-4 italic">
          Administratorul va confirma disponibilitatea și vă va contacta pentru finalizarea programării.
        </p>
      </CardContent>
    </Card>
  );
};

export default DateTimeSelection;
