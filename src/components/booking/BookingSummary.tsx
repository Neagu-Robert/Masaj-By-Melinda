
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
  );
};

export default BookingSummary;
