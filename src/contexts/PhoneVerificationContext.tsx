import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type PhoneVerificationContextType = {
  verificationStatus: 'idle' | 'pending' | 'verified' | 'error';
  isVerified: (phone: string) => boolean;
  startVerification: (phone: string, userId?: string) => Promise<void>;
  submitOtp: (phone: string, otp: string) => Promise<boolean>;
  error: string | null;
  resetVerification: () => void;
};

const PhoneVerificationContext = createContext<PhoneVerificationContextType | null>(null);

export const PhoneVerificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'verified' | 'error'>('idle');
  const [verifiedNumber, setVerifiedNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const startVerification = async (phone: string, userId?: string) => {
    setVerificationStatus('pending');
    setError(null);
    try {
      const { error: invokeError } = await supabase.functions.invoke('request-phone-verification', {
        body: { phone, userId },
      });

      if (invokeError) throw new Error(invokeError.message);

      // Status remains 'pending' until OTP is submitted
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
      setVerificationStatus('error');
    }
  };

  const submitOtp = async (phone: string, otp: string) => {
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('verify-phone-otp', {
        body: { phone, otp },
      });

      if (invokeError) throw new Error(invokeError.message);
      if (data?.error) throw new Error(data.error);

      setVerificationStatus('verified');
      setVerifiedNumber(phone);
      // For guests, persist in session storage
      try {
        sessionStorage.setItem('verifiedPhoneNumber', phone);
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
