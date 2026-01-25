// Centralized input validation using Zod schemas for all Edge Functions

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders, addRateLimitHeaders } from "./middleware.ts";

// Common validation schemas

// Phone number schema - Romanian format
export const phoneSchema = z.string()
  .regex(/^\+40\d{9}$/, 'Invalid Romanian phone format (+40XXXXXXXXX)');

// OTP schema
export const otpSchema = z.string()
  .length(6)
  .regex(/^\d{6}$/, 'OTP must be exactly 6 digits');

// UUID schema
export const uuidSchema = z.string()
  .uuid('Invalid UUID format');

// Date schema - YYYY-MM-DD format
export const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime()) && date === d.toISOString().split('T')[0];
  }, 'Invalid date');

// Time schema - HH:MM or HH:MM:SS format
export const timeSchema = z.string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be in HH:MM or HH:MM:SS format')
  .refine((time) => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours >= 0 && hours <= 23 &&
           minutes >= 0 && minutes <= 59 &&
           (seconds === undefined || (seconds >= 0 && seconds <= 59));
  }, 'Invalid time format');

// Email schema
export const emailSchema = z.string()
  .email('Invalid email format');

// Request validation schemas

// OTP Request Schema
export const RequestPhoneVerificationSchema = z.object({
  phone: phoneSchema,
});

// OTP Verify Schema
export const VerifyPhoneOTPSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
  userId: uuidSchema.optional(),
});

// Create Recurring Bookings Schema
export const CreateRecurringBookingsSchema = z.object({
  bookingId: uuidSchema,
  recurrenceType: z.enum(['weekly', 'biweekly'], {
    errorMap: () => ({ message: 'Recurrence type must be either "weekly" or "biweekly"' })
  }),
  horizonDays: z.union([z.literal(30), z.literal(60), z.literal(90)], {
    errorMap: () => ({ message: 'Horizon days must be 30, 60, or 90' })
  }),
  confirm: z.boolean().optional(),
  selectedDates: z.array(dateSchema).optional(),
});

// Cancel Recurring Bookings Schema
export const CancelRecurringBookingsSchema = z.object({
  bookingId: uuidSchema,
});


// Delete User Schema
export const DeleteUserSchema = z.object({
  userId: uuidSchema,
  confirm: z.boolean().refine((val) => val === true, {
    message: 'Confirmation required to delete user'
  }),
});

// Send Email Schema
export const SendEmailSchema = z.object({
  to: emailSchema,
  subject: z.string().min(1).max(200).trim(),
  htmlContent: z.string().min(1).trim(),
  textContent: z.string().optional(),
});


// Create Recurring Availabilities Schema
export const CreateRecurringAvailabilitiesSchema = z.object({
  hour: timeSchema,
  recurrenceType: z.enum(['daily', 'weekly', 'biweekly'], {
    errorMap: () => ({ message: 'Recurrence type must be "daily", "weekly", or "biweekly"' })
  }),
  horizonDays: z.union([z.literal(30), z.literal(60), z.literal(90)], {
    errorMap: () => ({ message: 'Horizon days must be 30, 60, or 90' })
  }),
  startDate: dateSchema.optional(),
  weekdays: z.array(z.number().min(0).max(6)).optional(),
  confirm: z.boolean().optional(),
});

// Cancel Recurring Availabilities Schema
export const CancelRecurringAvailabilitiesSchema = z.object({
  recurringId: uuidSchema,
});

// Send SMS Schema
export const SendSMSSchema = z.object({
  to: phoneSchema,
  message: z.string().min(1).max(160).trim(),
});

// Booking Response Schema
export const BookingResponseSchema = z.object({
  token: z.string().min(1).max(100).trim(),
  response: z.enum(['accept', 'decline'], {
    errorMap: () => ({ message: 'Response must be either "accept" or "decline"' })
  }),
  reason: z.string().max(500).trim().optional(),
});

// Validation helper function
export async function validateRequest<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await req.json();
    } catch (parseError) {
      return { success: false, error: 'Invalid JSON in request body' };
    }

    // Validate against schema
    const result = schema.safeParse(body);

    if (!result.success) {
      // Format validation errors into user-friendly message
      const errors = result.error.errors.map(err => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      return { success: false, error: `Validation failed: ${errors.join(', ')}` };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Validation error:', error);
    return { success: false, error: 'Internal validation error' };
  }
}

// Error response helper
export function createValidationErrorResponse(error: string, rateLimitInfo?: { remaining: number; resetAt: number; limit: number }): Response {
  const headers = {
    'Content-Type': 'application/json',
    ...corsHeaders,
  };

  const response = new Response(
    JSON.stringify({
      error: 'Validation failed',
      message: error,
      code: 'VALIDATION_ERROR'
    }),
    {
      status: 400,
      headers,
    }
  );

  return addRateLimitHeaders(response, rateLimitInfo);
}

// Sanitization functions

// Sanitize phone number (normalize format)
export function sanitizePhone(phone: string): string {
  // Remove all non-digit characters except +
  let sanitized = phone.replace(/[^\d+]/g, '');

  // Ensure Romanian format
  if (sanitized.startsWith('40') && !sanitized.startsWith('+40')) {
    sanitized = '+' + sanitized;
  } else if (sanitized.startsWith('04')) {
    sanitized = '+4' + sanitized.substring(1);
  } else if (!sanitized.startsWith('+40')) {
    // Assume it's a local number, add +40 prefix
    sanitized = '+40' + sanitized.replace(/^\+?40?0?/, '');
  }

  return sanitized;
}

// Sanitize time (normalize to HH:MM:SS)
export function sanitizeTime(time: string): string {
  const parts = time.split(':');
  const hours = parts[0].padStart(2, '0');
  const minutes = parts[1].padStart(2, '0');
  const seconds = parts[2] ? parts[2].padStart(2, '0') : '00';

  return `${hours}:${minutes}:${seconds}`;
}

// Sanitize email (basic normalization)
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// Sanitize general string input
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, ''); // Basic XSS prevention
}
