
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UseFormReturn } from 'react-hook-form';

type BookingSummaryProps = {
  form: UseFormReturn<{
    fullName: string;
    phoneNumber: string;
    serviceType: string;
  }>;
  selectedDate: Date | undefined;
  selectedTime: string | undefined;
  selectedService: string | undefined;
};

const BookingSummary = ({ 
  form, 
  selectedDate, 
  selectedTime,
  selectedService
}: BookingSummaryProps) => {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Rezumatul rezervării</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-gray-200"><strong className="text-white">Nume:</strong> {form.watch('fullName') || 'Nu a fost selectat'}</p>
        <p className="text-gray-200"><strong className="text-white">Telefon:</strong> {form.watch('phoneNumber') || 'Nu a fost selectat'}</p>
        <p className="text-gray-200"><strong className="text-white">Serviciu:</strong> {selectedService || 'Nu a fost selectat'}</p>
        <p className="text-gray-200"><strong className="text-white">Data:</strong> {selectedDate ? selectedDate.toLocaleDateString('ro-RO') : 'Nu a fost selectată'}</p>
        <p className="text-gray-200"><strong className="text-white">Ora:</strong> {selectedTime || 'Nu a fost selectată'}</p>
      </CardContent>
    </Card>
  );
};

export default BookingSummary;
