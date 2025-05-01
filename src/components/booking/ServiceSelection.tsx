
import React from 'react';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UseFormReturn } from 'react-hook-form';

type ServiceSelectionProps = {
  form: UseFormReturn<{
    fullName: string;
    phoneNumber: string;
    serviceType: string;
  }>;
  setSelectedService: (service: string) => void;
};

const ServiceSelection = ({ form, setSelectedService }: ServiceSelectionProps) => {
  // Massage services that match the pricing section
  const massageServices = [
    "Masaj de relaxare",
    "Masaj terapeutic",
    "Masaj de drenaj limfatic",
    "Masaj anticelulitic",
    "Masaj facial",
    "Masaj cu pietre vulcanice",
    "Masaj cu bete de bambus"
  ];
  
  // Device treatments that match the pricing section
  const deviceServices = [
    "Termocuverta Treatment",
    "Volcanic Stone Therapy",
    "40Khz Cavitation Body Remodeling",
    "Electrostimulation Treatment",
    "TECAR Radiofrequency"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selectați serviciul</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="serviceType"
          render={({ field }) => (
            <FormItem className="space-y-6">
              <FormControl>
                <div className="space-y-4">
                  {/* Massage Services Section */}
                  <div>
                    <h4 className="text-lg font-medium text-[#7E69AB] mb-2">Masaje</h4>
                    <RadioGroup 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedService(value);
                      }}
                      value={field.value}
                      className="grid grid-cols-1 md:grid-cols-2 gap-2"
                    >
                      {massageServices.map((service) => (
                        <div key={service} className="flex items-center space-x-2 rounded-md border p-3 hover:bg-slate-50">
                          <RadioGroupItem value={service} id={service} />
                          <label 
                            htmlFor={service} 
                            className="flex-1 cursor-pointer text-sm font-medium"
                          >
                            {service}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  {/* Device Services Section */}
                  <div>
                    <h4 className="text-lg font-medium text-[#7E69AB] mb-2">Tratamente cu aparate</h4>
                    <RadioGroup 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedService(value);
                      }}
                      value={field.value}
                      className="grid grid-cols-1 md:grid-cols-2 gap-2"
                    >
                      {deviceServices.map((service) => (
                        <div key={service} className="flex items-center space-x-2 rounded-md border p-3 hover:bg-slate-50">
                          <RadioGroupItem value={service} id={service} />
                          <label 
                            htmlFor={service} 
                            className="flex-1 cursor-pointer text-sm font-medium"
                          >
                            {service}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
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

export default ServiceSelection;
