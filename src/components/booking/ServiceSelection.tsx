import React from 'react';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UseFormReturn } from 'react-hook-form';
import { useServices } from '@/contexts/ServicesContext';

type ServiceSelectionProps = {
  form: UseFormReturn<{
    fullName: string;
    phoneNumber: string;
    serviceType: string;
  }>;
  setSelectedService: (service: string) => void;
  disabled?: boolean;
};

const ServiceSelection = ({ form, setSelectedService, disabled }: ServiceSelectionProps) => {
  const { services, loading, error } = useServices();

  // Filter for massage services (services that contain "Masaj" in the name)
  const massageServices = services.filter(service => 
    service.name.toLowerCase().includes('masaj') && service.is_active
  );

  // Filter for device treatments (services that don't contain "Masaj" in the name)
  const deviceServices = services.filter(service => 
    !service.name.toLowerCase().includes('masaj') && service.is_active
  );

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Selectați serviciul</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-600 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-600 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-600 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Selectați serviciul</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-400">
            Eroare la încărcarea serviciilor: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gray-800 border-gray-700 ${disabled ? 'opacity-60' : ''}`}>
      <CardHeader>
        <CardTitle className="text-white">Selectați serviciul</CardTitle>
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
                    <h4 className="text-lg font-medium text-[#9b87f5] mb-2">Masaje</h4>
                    <RadioGroup 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedService(value);
                      }}
                      value={field.value}
                      className="grid grid-cols-1 md:grid-cols-2 gap-2"
                      disabled={disabled}
                    >
                      {massageServices.map((service) => (
                        <label htmlFor={service.name} key={service.id} className={`flex items-center space-x-2 rounded-md border border-gray-600 bg-gray-700 p-3 hover:bg-gray-600 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                          <RadioGroupItem value={service.name} id={service.name} className="border-gray-500 text-[#7E69AB]" disabled={disabled} />
                          <span className="flex-1 text-sm font-medium text-white">
                            {service.name}
                          </span>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  {/* Device Services Section */}
                  <div>
                    <h4 className="text-lg font-medium text-[#9b87f5] mb-2">Tratamente cu aparate</h4>
                    <RadioGroup 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedService(value);
                      }}
                      value={field.value}
                      className="grid grid-cols-1 md:grid-cols-2 gap-2"
                      disabled={disabled}
                    >
                      {deviceServices.map((service) => (
                        <label htmlFor={service.name} key={service.id} className={`flex items-center space-x-2 rounded-md border border-gray-600 bg-gray-700 p-3 hover:bg-gray-600 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                          <RadioGroupItem value={service.name} id={service.name} className="border-gray-500 text-[#7E69AB]" disabled={disabled} />
                          <span className="flex-1 text-sm font-medium text-white">
                            {service.name}
                          </span>
                        </label>
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
