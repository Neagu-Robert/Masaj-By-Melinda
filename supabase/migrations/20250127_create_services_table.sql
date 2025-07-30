-- Enable RLS on services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for services table

-- Policy 1: Allow all authenticated users to read active services
-- This allows customers to see available services for booking
CREATE POLICY "Allow authenticated users to read active services" ON services
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy 2: Allow admins to read all services (including inactive ones)
-- This allows admins to see all services for management purposes
CREATE POLICY "Allow admins to read all services" ON services
  FOR SELECT
  TO authenticated
  USING (
    is_active = true OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy 3: Allow admins to insert new services
-- This allows admins to add new services
CREATE POLICY "Allow admins to insert services" ON services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy 4: Allow admins to update services
-- This allows admins to modify existing services
CREATE POLICY "Allow admins to update services" ON services
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy 5: Allow admins to delete services
-- This allows admins to remove services (though soft delete via is_active is preferred)
CREATE POLICY "Allow admins to delete services" ON services
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy 6: Allow service access for anonymous users (for public service listing)
-- This allows unauthenticated users to see services on the public website
CREATE POLICY "Allow anonymous users to read active services" ON services
  FOR SELECT
  TO anon
  USING (is_active = true); 