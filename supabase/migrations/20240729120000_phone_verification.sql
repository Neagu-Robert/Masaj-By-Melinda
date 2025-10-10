-- Add verification columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN phone_verified_at TIMESTAMPTZ;


-- Create a table for OTP verification attempts
CREATE TABLE public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_phone_verification UNIQUE (phone)
);

-- Add indexes for faster lookups
CREATE INDEX idx_otp_verifications_phone ON public.otp_verifications(phone);
CREATE INDEX idx_otp_verifications_user_id ON public.otp_verifications(user_id);

-- Enable Row-Level Security (RLS) for the new table
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies for otp_verifications table
-- Allow users to create and manage their own verification attempts
CREATE POLICY "Allow individual user access to their own verification attempts"
ON public.otp_verifications
FOR ALL
USING (auth.uid() = user_id);

-- Allow server-side operations (e.g., from Edge Functions) to bypass RLS
-- This is crucial for creating guest sessions and performing admin tasks
-- Note: Supabase Edge Functions with the service_role key can bypass RLS by default,
-- but having an explicit policy can be useful for clarity and other backend roles.
CREATE POLICY "Allow service_role full access"
ON public.otp_verifications
FOR ALL
USING (true)
WITH CHECK (true);
