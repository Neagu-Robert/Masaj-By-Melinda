-- Migration: Add Free-Text Booking Request Fields
-- Description: Adds requested_date_text and requested_time_text columns for customer free-text
--              date/time requests, and makes booking_date and booking_time nullable to
--              accommodate unconfirmed bookings.

-- Add new text columns for customer free-text requests
ALTER TABLE public.bookings
ADD COLUMN requested_date_text TEXT,
ADD COLUMN requested_time_text TEXT;

-- Modify existing date/time columns to allow null values
-- This supports the new workflow where customers submit requests with free-text
-- and admin confirms with specific date/time values
ALTER TABLE public.bookings
ALTER COLUMN booking_date DROP NOT NULL,
ALTER COLUMN booking_time DROP NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.bookings.requested_date_text IS 'Customer free-text date preference (e.g., "next Monday", "sometime this week")';
COMMENT ON COLUMN public.bookings.requested_time_text IS 'Customer free-text time preference (e.g., "morning", "after 3pm")';
