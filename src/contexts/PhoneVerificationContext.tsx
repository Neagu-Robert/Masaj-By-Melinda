import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RateLimitManager } from '@/lib/rate-limit-manager';
import { invokeRateLimited } from '@/lib/supabase-functions';

type PhoneVerificationContextType = {
  verificationStatus: 'idle' | 'pending' | 'verified' | 'error';
  isVerified: (phone: string) => boolean;
  startVerification: (phone: string, userId?: string) => Promise<boolean>;
  submitOtp: (phone: string, otp: string) => Promise<boolean>;
  error: string | null;
  resetVerification: () => void;
  // NEW: Rate limiting state
  isRateLimited: boolean;
  rateLimitCountdown: number;
  canRequestOtp: (phone: string) => boolean;
};

const PhoneVerificationContext = createContext<PhoneVerificationContextType | null>(null);

export const PhoneVerificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'verified' | 'error'>('idle');
  const [verifiedNumber, setVerifiedNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyingUserId, setVerifyingUserId] = useState<string | undefined>(undefined);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [lastOtpRequest, setLastOtpRequest] = useState<{ phone: string; timestamp: number } | null>(null);

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

  // Countdown timer for rate limiting
  useEffect(() => {
    if (!isRateLimited) return;

    const interval = setInterval(() => {
      const remaining = RateLimitManager.getTimeRemaining('otp');
      setRateLimitCountdown(remaining);
      
      if (remaining <= 0) {
        setIsRateLimited(false);
        RateLimitManager.clear('otp');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRateLimited]);

  // Check for existing rate limit on mount
  useEffect(() => {
    const isLimited = RateLimitManager.isLimited('otp');
    if (isLimited) {
      setIsRateLimited(true);
      setRateLimitCountdown(RateLimitManager.getTimeRemaining('otp'));
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

  const canRequestOtp = useCallback((phone: string): boolean => {
    // Check 30-second throttle
    if (lastOtpRequest && lastOtpRequest.phone === phone) {
      const timeSinceLastRequest = Date.now() - lastOtpRequest.timestamp;
      if (timeSinceLastRequest < 30000) { // 30 seconds
        return false;
      }
    }

    // Check rate limit state
    if (RateLimitManager.isLimited('otp')) {
      return false;
    }

    return true;
  }, [lastOtpRequest]);

  const startVerification = async (phone: string, userId?: string): Promise<boolean> => {
    setVerificationStatus('pending');
    setError(null);
    setVerifyingUserId(userId);
    try {
      const formattedPhone = normalizeAndValidatePhone(phone);
      if (!formattedPhone) {
        throw new Error('Invalid phone number format. Please use a valid Romanian number.');
      }

      // Check 30-second throttle
      if (!canRequestOtp(formattedPhone)) {
        const timeSinceLastRequest = lastOtpRequest 
          ? Math.ceil((30000 - (Date.now() - lastOtpRequest.timestamp)) / 1000)
          : 30;
        throw new Error(`Vă rugăm să așteptați ${timeSinceLastRequest} secunde înainte de a solicita un nou cod`);
      }

      // Call OTP request function with rate limiting
      const result = await invokeRateLimited(
        'request-phone-verification',
        { phone: formattedPhone, userId },
        'otp',
        formattedPhone
      );

      if (!result.ok) {
        // Handle rate limit error
        if (result.status === 429) {
          setIsRateLimited(true);
          setRateLimitCountdown(result.retryAfterSeconds || 300);
          throw new Error('Prea multe solicitări. Vă rugăm să încercați din nou mai târziu.');
        }

        // Handle service unavailable (fail-closed)
        if (result.status === 503) {
          throw new Error('Serviciul OTP este temporar indisponibil. Vă rugăm să încercați mai târziu.');
        }

        // Other errors
        throw new Error(result.error || 'Failed to send OTP.');
      }

      // Update last request timestamp
      setLastOtpRequest({ phone: formattedPhone, timestamp: Date.now() });
      
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

      // Call OTP verify function with rate limiting
      const result = await invokeRateLimited(
        'verify-phone-otp',
        { phone: formattedPhone, otp, userId: verifyingUserId },
        'otp_verify',
        formattedPhone
      );

      if (!result.ok) {
        // Handle rate limit error
        if (result.status === 429) {
          throw new Error('Prea multe încercări greșite. Vă rugăm să solicitați un nou cod.');
        }

        // Handle service unavailable (fail-closed)
        if (result.status === 503) {
          throw new Error('Serviciul OTP este temporar indisponibil. Vă rugăm să încercați mai târziu.');
        }

        // Other errors
        throw new Error(result.error || 'OTP verification failed.');
      }

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
      value={{
        verificationStatus,
        isVerified,
        startVerification,
        submitOtp,
        error,
        resetVerification,
        // NEW: Rate limiting state
        isRateLimited,
        rateLimitCountdown,
        canRequestOtp,
      }}
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
