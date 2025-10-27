import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type PhoneVerificationContextType = {
  verificationStatus: 'idle' | 'pending' | 'verified' | 'error';
  isVerified: (phone: string) => boolean;
  startVerification: (phone: string, userId?: string) => Promise<boolean>;
  submitOtp: (phone: string, otp: string) => Promise<boolean>;
  error: string | null;
  resetVerification: () => void;
};

const PhoneVerificationContext = createContext<PhoneVerificationContextType | null>(null);

export const PhoneVerificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'verified' | 'error'>('idle');
  const [verifiedNumber, setVerifiedNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyingUserId, setVerifyingUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // For guests, check session storage on initial load
    try {
      const storedVerifiedNumber = sessionStorage.getItem('verifiedPhoneNumber');
      if (storedVerifiedNumber) {
        setVerifiedNumber(storedVerifiedNumber);
        setVerificationStatus('verified');
      }
    } catch (e) {
      console.error('Could not access session storage:', e);
    }
  }, []);

  const isVerified = useCallback((phone: string) => {
    return verificationStatus === 'verified' && verifiedNumber === phone;
  }, [verificationStatus, verifiedNumber]);

  const normalizeAndValidatePhone = (phone: string) => {
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('40')) {
      // Already has country code, just use the whole number
      digits = digits.substring(2);
    } else if (digits.startsWith('0')) {
      // Starts with 0, remove it
      digits = digits.substring(1);
    }
    // After normalization, should be 9 digits
    if (digits.length !== 9) {
      return null;
    }
    return `+40${digits}`;
  };

  const startVerification = async (phone: string, userId?: string): Promise<boolean> => {
    setVerificationStatus('pending');
    setError(null);
    setVerifyingUserId(userId);
    try {
      const formattedPhone = normalizeAndValidatePhone(phone);
      if (!formattedPhone) {
        throw new Error('Invalid phone number format. Please use a valid Romanian number.');
      }
      
      const { error: invokeError } = await supabase.functions.invoke('request-phone-verification', {
        body: { phone: formattedPhone, userId },
      });

      if (invokeError) throw new Error(invokeError.message);
      return true;
      // Status remains 'pending' until OTP is submitted
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
      setVerificationStatus('error');
      return false;
    }
  };

  const submitOtp = async (phone: string, otp: string) => {
    setError(null);
    try {
      const formattedPhone = normalizeAndValidatePhone(phone);
      if (!formattedPhone) {
        throw new Error('Invalid phone number format during OTP submission.');
      }
      
      const { data, error: invokeError } = await supabase.functions.invoke('verify-phone-otp', {
        body: { phone: formattedPhone, otp, userId: verifyingUserId },
      });

      if (invokeError) throw new Error(invokeError.message);
      if (data?.error) throw new Error(data.error);

      setVerificationStatus('verified');
      setVerifiedNumber(formattedPhone);
      // For guests, persist in session storage
      try {
        sessionStorage.setItem('verifiedPhoneNumber', formattedPhone);
      } catch (e) {
        console.error('Could not access session storage:', e);
      }
      return true;
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
      setVerificationStatus('error');
      return false;
    }
  };
  
  const resetVerification = () => {
    setVerificationStatus('idle');
    setVerifiedNumber(null);
    setError(null);
    setVerifyingUserId(undefined);
    try {
      sessionStorage.removeItem('verifiedPhoneNumber');
    } catch (e) {
      console.error('Could not access session storage:', e);
    }
  };

  return (
    <PhoneVerificationContext.Provider
      value={{ verificationStatus, isVerified, startVerification, submitOtp, error, resetVerification }}
    >
      {children}
    </PhoneVerificationContext.Provider>
  );
};

export const usePhoneVerification = () => {
  const context = useContext(PhoneVerificationContext);
  if (!context) {
    throw new Error('usePhoneVerification must be used within a PhoneVerificationProvider');
  }
  return context;
};
