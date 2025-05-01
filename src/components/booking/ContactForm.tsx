
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

type ContactFormProps = {
  form: UseFormReturn<{
    fullName: string;
    phoneNumber: string;
    serviceType: string;
  }>;
};

const ContactForm = ({ form }: ContactFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Date de contact</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nume complet</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Introduceți numele complet" 
                    className="pl-10" 
                    {...field}
                    required
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Număr de telefon</FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Introduceți numărul de telefon" 
                    className="pl-10" 
                    {...field}
                    required
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default ContactForm;
