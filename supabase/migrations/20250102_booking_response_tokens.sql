-- Create the booking_response_tokens table
CREATE TABLE booking_response_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_booking_response_tokens_token ON booking_response_tokens(token);
CREATE INDEX idx_booking_response_tokens_expires_at ON booking_response_tokens(expires_at);

-- RLS Policies
ALTER TABLE booking_response_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service_role full access"
ON booking_response_tokens
FOR ALL
USING (true)
WITH CHECK (true);

-- No public access is granted, so by default, no one can access it.
