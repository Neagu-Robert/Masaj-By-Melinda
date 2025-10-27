import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { usePhoneVerification } from '@/contexts/PhoneVerificationContext';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
}

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({ isOpen, onClose, phoneNumber }) => {
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitOtp, error: verificationError } = usePhoneVerification();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const success = await submitOtp(phoneNumber, otp);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent showCloseButton={false} className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Verifică numărul de telefon</DialogTitle>
          <DialogDescription>
            Am trimis un cod de verificare la {phoneNumber}. Introduceți codul mai jos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 py-4">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          {verificationError && <p className="text-red-500 text-sm">{verificationError}</p>}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || otp.length < 6}
            className="w-full bg-violet-600 hover:bg-violet-700"
          >
            {isSubmitting ? 'Se verifică...' : 'Verifică'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
