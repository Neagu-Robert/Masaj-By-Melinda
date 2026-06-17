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

export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, '0')
);

export const getHourKey = (time: string): string => {
  const hourPart = (time || '').toString().slice(0, 5).split(':')[0];
  if (!hourPart) return '';
  return String(parseInt(hourPart, 10));
};

export const normalizeHourSlot = (time: string): string => {
  const key = getHourKey(time);
  if (!key) return '';
  return `${parseInt(key, 10)}:00`;
};

export const getMinutePart = (time: string): string => {
  const parts = (time || '').toString().slice(0, 5).split(':');
  return (parts[1] ?? '00').padStart(2, '0');
};

export const combineHourAndMinute = (hour: string, minute: string): string => {
  const hourNum = parseInt(hour.split(':')[0], 10);
  return `${String(hourNum).padStart(2, '0')}:${minute.padStart(2, '0')}`;
};

export const isHourSlotBooked = (hourSlot: string, bookedTimes: string[]): boolean => {
  const hourKey = getHourKey(hourSlot);
  return bookedTimes.some((b) => getHourKey(b) === hourKey);
};

export const isHourSlotUnavailable = (hourSlot: string, unavailableHours: string[]): boolean => {
  const hourKey = getHourKey(hourSlot);
  return unavailableHours.some((u) => getHourKey(u) === hourKey);
};

// Helper: format date correctly for database
export const formatDateForDB = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Calendar date → requested_date_text (dd/MM/yyyy) for profile re-requests */
export const formatRequestedDateText = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/** Parse requested_date_text back to Date (dd/MM/yyyy, dd.MM.yyyy, or yyyy-MM-dd) */
export const parseRequestedDateText = (text: string | null | undefined): Date | undefined => {
  if (!text?.trim()) return undefined;
  const trimmed = text.trim();

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const d = new Date(+isoMatch[1], +isoMatch[2] - 1, +isoMatch[3]);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const dmyMatch = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(trimmed);
  if (dmyMatch) {
    const d = new Date(+dmyMatch[3], +dmyMatch[2] - 1, +dmyMatch[1]);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }

  return undefined;
};

/** Extract HH:MM from requested_time_text for dropdown prefill; null if not parseable */
export const parseRequestedTimeText = (
  text: string | null | undefined
): { hour: string; minute: string } | null => {
  if (!text?.trim()) return null;
  const match = /(\d{1,2}):(\d{2})/.exec(text.trim());
  if (!match) return null;
  return {
    hour: `${parseInt(match[1], 10)}:00`,
    minute: match[2].padStart(2, '0'),
  };
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
  const hourSlot = normalizeHourSlot(time);
  if (!hourSlot) return false;

  const dayOfWeek = date.getDay();

  // Sunday is not available
  if (dayOfWeek === 0) {
    return false;
  }

  // Saturday: only 8 AM to 12 PM
  if (dayOfWeek === 6) {
    return SATURDAY_TIME_SLOTS.includes(hourSlot);
  }

  // Monday to Friday: full day (8 AM to 8 PM)
  return TIME_SLOTS.includes(hourSlot);
};

// Fetch booked time slots for a specific date
export const fetchBookedTimeSlots = async (date: Date): Promise<string[]> => {
  try {
    const formattedDate = formatDateForDB(date);
    const { data, error } = await supabase
      .from('bookings')
      .select('booking_time')
      .eq('booking_date', formattedDate)
      .eq('status', 'confirmed')
      .not('booking_time', 'is', null);
    
    if (error) {
      console.error('Error fetching booked time slots:', error);
      return [];
    }
    
    const concrete = (data ?? [])
      .filter((booking) => booking.booking_time)
      .map(booking => (booking.booking_time || "").toString().slice(0, 5));

    // Also include recurring instances (HH:MM) for that date
    // Note: utils cannot use hooks directly; provide a fallback direct query here
    const { data: rec, error: recErr } = await supabase
      .from('recurring_bookings')
      .select('hour')
      .eq('date', formattedDate)
      .eq('status', true);
    if (recErr) {
      console.warn('Error fetching recurring time slots:', recErr);
      return concrete;
    }
    const recurring = (rec ?? []).map(r => (r.hour || '').toString().slice(0,5));
    return Array.from(new Set([...concrete, ...recurring]));
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
    return { isValid: false, error: 'Vă rugăm să selectați o dată' };
  }
  
  if (!isDateAvailable(bookingDate)) {
    return { isValid: false, error: 'Data selectată nu este disponibilă' };
  }
  
  if (!bookingTime) {
    return { isValid: false, error: 'Vă rugăm să selectați o oră' };
  }
  
  if (!isTimeAvailableForDate(bookingDate, bookingTime)) {
    return { isValid: false, error: 'Ora selectată nu este disponibilă pentru această dată' };
  }
  
  if (!serviceType) {
    return { isValid: false, error: 'Vă rugăm să selectați un serviciu' };
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
      .eq('booking_time', timeFormatted)
      .eq('status', 'confirmed')
      .not('booking_time', 'is', null);
    
    // Exclude current booking if updating
    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error checking for double booking:', error);
      return { isDoubleBooked: false, error: 'Eroare la verificarea disponibilității' };
    }
    
    if (data && data.length > 0) {
      return { isDoubleBooked: true, error: 'Acest interval orar este deja rezervat' };
    }
    
    return { isDoubleBooked: false };
  } catch (error) {
    console.error('Error in checkForDoubleBooking:', error);
    return { isDoubleBooked: false, error: 'Eroare la verificarea disponibilității' };
  }
};

// Check if another booking already occupies the same hour window
export const checkForHourBookingConflict = async (
  date: Date,
  time: string,
  excludeBookingId?: string
): Promise<{ hasConflict: boolean; error?: string }> => {
  try {
    const formattedDate = formatDateForDB(date);
    const selectedHourKey = getHourKey(time);

    let query = supabase
      .from('bookings')
      .select('id, booking_time')
      .eq('booking_date', formattedDate)
      .eq('status', 'confirmed')
      .not('booking_time', 'is', null);

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking for hour booking conflict:', error);
      return { hasConflict: false, error: 'Eroare la verificarea disponibilității' };
    }

    const conflict = (data ?? []).some(
      (booking) => getHourKey((booking.booking_time || '').toString()) === selectedHourKey
    );

    if (conflict) {
      return { hasConflict: true, error: 'Acest interval orar este deja rezervat' };
    }

    return { hasConflict: false };
  } catch (error) {
    console.error('Error in checkForHourBookingConflict:', error);
    return { hasConflict: false, error: 'Eroare la verificarea disponibilității' };
  }
};

/**
 * Generate a secure token for booking response emails
 * Returns: { token: string, expiresAt: Date }
 */
export const generateBookingResponseToken = async (bookingId: string): Promise<{ token: string; expiresAt: Date }> => {
  // Generate a random token (32 characters)
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  
  // Set expiration to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  // Store token in database
  const { error } = await supabase
    .from('booking_response_tokens')
    .insert({
      booking_id: bookingId,
      token: token,
      expires_at: expiresAt.toISOString()
    });
  
  if (error) {
    console.error('Error storing booking response token:', error);
    throw new Error('Failed to generate booking response token');
  }
  
  return { token, expiresAt };
};

/**
 * Validate a booking response token
 * Returns: { valid: boolean, bookingId?: string, error?: string }
 */
export const validateBookingResponseToken = async (token: string): Promise<{ valid: boolean; bookingId?: string; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('booking_response_tokens')
      .select('booking_id, expires_at')
      .eq('token', token)
      .single();
    
    if (error || !data) {
      return { valid: false, error: 'Token not found' };
    }
    
    // Check if token is expired
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      return { valid: false, error: 'Token expired' };
    }
    
    return { valid: true, bookingId: data.booking_id };
  } catch (error) {
    console.error('Error validating booking response token:', error);
    return { valid: false, error: 'Validation error' };
  }
}; 