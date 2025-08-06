import { supabase } from '@/integrations/supabase/client';

// Time slots from 8 AM to 8 PM
export const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8; // Start from 8 AM
  return `${hour}:00`;
});

// Time slots for Saturday (8 AM to 12 PM only)
export const SATURDAY_TIME_SLOTS = Array.from({ length: 5 }, (_, i) => {
  const hour = i + 8; // Start from 8 AM, end at 12 PM
  return `${hour}:00`;
});

// Helper: format date correctly for database
export const formatDateForDB = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get tomorrow's date (minimum selectable date)
export const getTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Set to start of day
  return tomorrow;
};

// Check if a date is available (not in the past and within business days)
export const isDateAvailable = (date: Date) => {
  const tomorrow = getTomorrow();
  
  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);
  
  // Date must be tomorrow or later
  if (selectedDate < tomorrow) {
    return false;
  }
  
  // Check if it's a business day (Monday to Saturday, no Sundays)
  const dayOfWeek = date.getDay();
  return dayOfWeek >= 1 && dayOfWeek <= 6; // Monday = 1, Saturday = 6, Sunday = 0
};

// Get available time slots for a specific date (considering business rules)
export const getAvailableTimeSlotsForDate = (date: Date): string[] => {
  const dayOfWeek = date.getDay();
  
  // Sunday is not available
  if (dayOfWeek === 0) {
    return [];
  }
  
  // Saturday: only 8 AM to 12 PM
  if (dayOfWeek === 6) {
    return SATURDAY_TIME_SLOTS;
  }
  
  // Monday to Friday: full day (8 AM to 8 PM)
  return TIME_SLOTS;
};

// Check if a specific time is available for a date (considering business rules)
export const isTimeAvailableForDate = (date: Date, time: string): boolean => {
  const dayOfWeek = date.getDay();
  
  // Sunday is not available
  if (dayOfWeek === 0) {
    return false;
  }
  
  // Saturday: only 8 AM to 12 PM
  if (dayOfWeek === 6) {
    return SATURDAY_TIME_SLOTS.includes(time);
  }
  
  // Monday to Friday: full day (8 AM to 8 PM)
  return TIME_SLOTS.includes(time);
};

// Fetch booked time slots for a specific date
export const fetchBookedTimeSlots = async (date: Date): Promise<string[]> => {
  try {
    const formattedDate = formatDateForDB(date);
    const { data, error } = await supabase
      .from('bookings')
      .select('booking_time')
      .eq('booking_date', formattedDate);
    
    if (error) {
      console.error('Error fetching booked time slots:', error);
      return [];
    }
    
    return (data ?? []).map(booking => {
      return (booking.booking_time || "").toString().slice(0, 5);
    });
  } catch (error) {
    console.error('Error in fetchBookedTimeSlots:', error);
    return [];
  }
};

// Check if a time slot is unavailable (either booked or blocked)
export const isTimeSlotUnavailable = (
  time: string, 
  bookedTimeSlots: string[], 
  unavailableSlots: string[],
  date?: Date
): boolean => {
  // First check business rules
  if (date && !isTimeAvailableForDate(date, time)) {
    return true;
  }
  
  const normalized = time.padStart(5, "0");
  return (
    bookedTimeSlots.some(
      (b) => b === time || b === normalized || b.replace(/^0/, "") === time.replace(/^0/, "")
    ) ||
    unavailableSlots.some(
      (u) => u === time || u === normalized || u.replace(/^0/, "") === time.replace(/^0/, "")
    )
  );
};

// Get available hours for a specific date (considering business rules)
export const getAvailableHoursForDate = (
  date: Date | undefined,
  bookedTimeSlots: string[],
  unavailableSlots: string[]
): string[] => {
  if (!date) return [];
  
  // Get base time slots based on business rules
  const baseTimeSlots = getAvailableTimeSlotsForDate(date);
  
  return baseTimeSlots.filter(hour => 
    !isTimeSlotUnavailable(hour, bookedTimeSlots, unavailableSlots, date)
  );
};

// Validate booking data before submission
export const validateBookingData = (
  bookingDate: Date | undefined,
  bookingTime: string,
  serviceType: string
): { isValid: boolean; error?: string } => {
  if (!bookingDate) {
    return { isValid: false, error: 'Please select a date' };
  }
  
  if (!isDateAvailable(bookingDate)) {
    return { isValid: false, error: 'Selected date is not available' };
  }
  
  if (!bookingTime) {
    return { isValid: false, error: 'Please select a time' };
  }
  
  if (!isTimeAvailableForDate(bookingDate, bookingTime)) {
    return { isValid: false, error: 'Selected time is not available for this date' };
  }
  
  if (!serviceType) {
    return { isValid: false, error: 'Please select a service' };
  }
  
  return { isValid: true };
};

// Check for double booking before submission
export const checkForDoubleBooking = async (
  date: Date,
  time: string,
  excludeBookingId?: string
): Promise<{ isDoubleBooked: boolean; error?: string }> => {
  try {
    const formattedDate = formatDateForDB(date);
    const timeFormatted = time.padStart(5, '0');
    
    let query = supabase
      .from('bookings')
      .select('id')
      .eq('booking_date', formattedDate)
      .eq('booking_time', timeFormatted);
    
    // Exclude current booking if updating
    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error checking for double booking:', error);
      return { isDoubleBooked: false, error: 'Error checking availability' };
    }
    
    if (data && data.length > 0) {
      return { isDoubleBooked: true, error: 'This time slot is already booked' };
    }
    
    return { isDoubleBooked: false };
  } catch (error) {
    console.error('Error in checkForDoubleBooking:', error);
    return { isDoubleBooked: false, error: 'Error checking availability' };
  }
}; 