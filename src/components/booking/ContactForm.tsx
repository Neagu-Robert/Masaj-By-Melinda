
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

type ContactFormProps = {
  form: UseFormReturn<{
    fullName: string;
    phoneNumber: string;
    serviceType: string;
  }>;
  profileInfo?: { fullName: string; phoneNumber: string | null } | null;
  useProfileName?: boolean;
  setUseProfileName?: (v: boolean) => void;
  useProfilePhone?: boolean;
  setUseProfilePhone?: (v: boolean) => void;
  onVerifyPhone: () => void;
  isPhoneVerified: boolean;
  disabled?: boolean;
};

const ContactForm = ({
  form,
  profileInfo,
  useProfileName,
  setUseProfileName,
  useProfilePhone,
  setUseProfilePhone,
  onVerifyPhone,
  isPhoneVerified,
  disabled,
}: ContactFormProps) => {
  const phoneNumber = form.watch('phoneNumber');

  const handleVerifyPhone = () => {
    if (disabled) {
      toast("Eroare", {
        description: "Vă rugăm să vă autentificați pentru a verifica numărul de telefon"
      });
      return;
    }
    onVerifyPhone();
  };

  return (
    <Card className={`bg-gray-800 border-gray-700 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-white text-lg md:text-xl">Date de contact</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-200 flex flex-col gap-1 text-sm md:text-base">
                Nume complet
                {profileInfo && setUseProfileName && (
                  <label className="flex items-center gap-2 text-xs text-gray-400 font-normal">
                    <input
                      type="checkbox"
                      checked={!!useProfileName}
                      onChange={e => setUseProfileName(e.target.checked)}
                      disabled={disabled || !profileInfo.fullName}
                      className="w-4 h-4"
                    />
                    Folosește numele din profil
                    {!profileInfo.fullName && <span className="text-red-400 ml-2">(nu este setat în profil)</span>}
                  </label>
                )}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                  <Input 
                    placeholder="Introduceți numele complet" 
                    className="pl-10 md:pl-12 h-12 md:h-14 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-[#7E69AB] text-base md:text-lg" 
                    {...field}
                    required
                    disabled={disabled || !!useProfileName}
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
              <FormLabel className="text-gray-200 flex flex-col gap-1 text-sm md:text-base">
                Număr de telefon
                {profileInfo && setUseProfilePhone && (
                  <label className="flex items-center gap-2 text-xs text-gray-400 font-normal">
                    <input
                      type="checkbox"
                      checked={!!useProfilePhone}
                      onChange={e => setUseProfilePhone(e.target.checked)}
                      disabled={disabled || !profileInfo.phoneNumber}
                      className="w-4 h-4"
                    />
                    Folosește numărul din profil
                    {!profileInfo.phoneNumber && <span className="text-red-400 ml-2">(nu este setat în profil)</span>}
                  </label>
                )}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                  <Input 
                    placeholder="Introduceți numărul de telefon" 
                    className="pl-10 md:pl-12 h-12 md:h-14 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-[#7E69AB] text-base md:text-lg" 
                    {...field}
                    required
                    disabled={disabled || !!useProfilePhone}
                    maxLength={15}
                    title="Introduceti un numar de telefon valid"
                  />
                </div>
              </FormControl>
              <FormMessage />
              {!useProfilePhone && (
                <div className="mt-2">
                  {isPhoneVerified ? (
                    <div className="flex items-center text-green-400">
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      <span>Număr verificat</span>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleVerifyPhone}
                      className="bg-gray-600 hover:bg-gray-500 text-white text-sm h-auto px-4 py-2"
                      disabled={disabled || !phoneNumber || phoneNumber.replace(/\D/g, '').length !== 10}
                    >
                      Verifică numărul de telefon
                    </Button>
                  )}
                </div>
              )}
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default ContactForm;
