import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { usePhoneVerification } from '@/contexts/PhoneVerificationContext';
import { FormErrorBoundary } from '@/components/FormErrorBoundary';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  userId?: string;
  onVerified?: () => void;
}

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({ isOpen, onClose, phoneNumber, userId, onVerified }) => {
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResendTime, setLastResendTime] = useState<number | null>(null);
  const [resendCooldownRemaining, setResendCooldownRemaining] = useState(0);
  const { submitOtp, error: verificationError, startVerification } = usePhoneVerification();

  // Countdown effect for resend cooldown
  useEffect(() => {
    if (resendCooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setResendCooldownRemaining(resendCooldownRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldownRemaining]);

  // Initialize cooldown when modal opens
  useEffect(() => {
    if (isOpen) {
      setResendCooldownRemaining(60);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const success = await submitOtp(phoneNumber, otp);
    setIsSubmitting(false);
    if (success) {
      if (onVerified) {
        try {
          await onVerified();
          onClose();
        } catch (error) {
          console.error('Verification callback failed:', error);
          // Show error but don't close modal
        }
      } else {
        onClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={true} className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Verifică numărul de telefon</DialogTitle>
          <DialogDescription>
            Am trimis un cod de verificare la {phoneNumber}. Introduceți codul mai jos.
          </DialogDescription>
        </DialogHeader>
        <FormErrorBoundary feature="otp">
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
            <Button
              type="button"
              onClick={async () => {
                const success = await startVerification(phoneNumber, userId);
                if (success) {
                  setLastResendTime(Date.now());
                  setResendCooldownRemaining(60);
                }
              }}
              disabled={resendCooldownRemaining > 0 || isSubmitting}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {resendCooldownRemaining > 0 ? `Retrimite în ${resendCooldownRemaining}s` : 'Retrimite codul'}
            </Button>
          </div>
        </FormErrorBoundary>
      </DialogContent>
    </Dialog>
  );
};
