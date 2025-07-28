-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_email TEXT,
  recipient_phone TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  error TEXT,
  message_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data JSONB,
  retry_count INTEGER NOT NULL DEFAULT 0
);

-- Create index on recipient_id for faster lookups
CREATE INDEX IF NOT EXISTS notification_logs_recipient_id_idx ON notification_logs(recipient_id);

-- Create index on sent_at for faster sorting
CREATE INDEX IF NOT EXISTS notification_logs_sent_at_idx ON notification_logs(sent_at);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'both')),
  types TEXT[] NOT NULL DEFAULT ARRAY['booking_created', 'booking_updated', 'booking_cancelled', 'reminder'],
  enabled BOOLEAN NOT NULL DEFAULT true,
  unsubscribed BOOLEAN NOT NULL DEFAULT false,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS notification_preferences_user_id_idx ON notification_preferences(user_id);

-- Add RLS policies for notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view all notification logs" 
  ON notification_logs FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'admin');

-- Users can only view their own logs
CREATE POLICY "Users can view their own notification logs" 
  ON notification_logs FOR SELECT 
  USING (auth.uid() = recipient_id);

-- Only the system can insert logs
CREATE POLICY "System can insert notification logs" 
  ON notification_logs FOR INSERT 
  WITH CHECK (true);

-- Add RLS policies for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Admins can view all preferences
CREATE POLICY "Admins can view all notification preferences" 
  ON notification_preferences FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'admin');

-- Users can only view their own preferences
CREATE POLICY "Users can view their own notification preferences" 
  ON notification_preferences FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own notification preferences" 
  ON notification_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own notification preferences" 
  ON notification_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 