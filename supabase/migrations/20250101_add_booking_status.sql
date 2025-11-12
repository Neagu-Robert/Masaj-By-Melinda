-- Define enum type for booking status
CREATE TYPE booking_status AS ENUM ('unconfirmed', 'confirmed', 'rejected', 'suggested');

-- Add status and suggestion columns to the bookings table
ALTER TABLE bookings
ADD COLUMN status booking_status DEFAULT 'confirmed',
ADD COLUMN suggested_date DATE,
ADD COLUMN suggested_time TIME,
ADD COLUMN suggested_by_admin BOOLEAN;

-- Update existing bookings to have the 'confirmed' status
UPDATE bookings
SET status = 'confirmed'
WHERE status IS NULL;

-- Add index on the new status column for better query performance
CREATE INDEX idx_bookings_status ON bookings(status);

