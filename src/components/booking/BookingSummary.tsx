
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UseFormReturn } from 'react-hook-form';

type BookingSummaryProps = {
  form: UseFormReturn<{
    fullName: string;
    phoneNumber: string;
    serviceType: string;
  }>;
  selectedDate: Date;
  selectedTime: string;
  selectedService: string;
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
        <p className="text-gray-200"><strong className="text-white">Nume:</strong> {form.watch('fullName')}</p>
        <p className="text-gray-200"><strong className="text-white">Telefon:</strong> {form.watch('phoneNumber')}</p>
        <p className="text-gray-200"><strong className="text-white">Serviciu:</strong> {selectedService}</p>
        <p className="text-gray-200"><strong className="text-white">Data:</strong> {selectedDate.toLocaleDateString('ro-RO')}</p>
        <p className="text-gray-200"><strong className="text-white">Ora:</strong> {selectedTime}</p>
      </CardContent>
    </Card>
  );
};

export default BookingSummary;
