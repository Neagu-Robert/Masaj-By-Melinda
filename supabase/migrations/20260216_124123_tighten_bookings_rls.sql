-- Tighten RLS policies on bookings table to prevent direct client inserts
-- Only allow inserts from service role (Edge Functions) or admins

-- Drop any existing INSERT policies that allow client inserts
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can insert bookings" ON bookings;
DROP POLICY IF EXISTS "Allow authenticated users to insert bookings" ON bookings;

-- Create policy for service role (Edge Functions)
CREATE POLICY "Service role can insert bookings"
  ON bookings
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create policy for admin users
CREATE POLICY "Admins can insert bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Keep existing SELECT, UPDATE, DELETE policies unchanged
-- Users should still be able to view and manage their own bookings
