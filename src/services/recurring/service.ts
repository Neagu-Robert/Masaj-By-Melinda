// Simple client for recurring bookings Edge Functions

const getSupabaseFunctionUrl = (fn: string) =>
  `https://dgzmqlwqlfmdbnwqjjjr.functions.supabase.co/${fn}`;

const AUTH_HEADER = {
  Authorization:
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem1xbHdxbGZtZGJud3FqampyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODcxNDYsImV4cCI6MjA2MTI2MzE0Nn0.Y7sKLnfvQh3t6hoH_TyTVxojWUuKhgwW965Q9cE8pZs',
};

export type RecurrenceType = 'weekly' | 'biweekly';

export async function previewCreateRecurring(
  bookingId: string,
  recurrenceType: RecurrenceType,
  horizonDays: 30 | 60 | 90
) {
  const res = await fetch(getSupabaseFunctionUrl('create-recurring-bookings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...AUTH_HEADER },
    body: JSON.stringify({ bookingId, recurrenceType, horizonDays, confirm: false }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return data as {
    success: true;
    preview: { date: string; time: string; available: boolean; reason?: string }[];
    meta: { horizonDays: number; day: string; hour: string; until: string; recurrenceType: RecurrenceType };
  };
}

export async function confirmCreateRecurring(
  bookingId: string,
  recurrenceType: RecurrenceType,
  horizonDays: 30 | 60 | 90
) {
  const res = await fetch(getSupabaseFunctionUrl('create-recurring-bookings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...AUTH_HEADER },
    body: JSON.stringify({ bookingId, recurrenceType, horizonDays, confirm: true }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return data as {
    success: true;
    createdCount: number;
    skippedCount: number;
    createdInstances: any[];
    skippedInstances: any[];
  };
}

export async function cancelRecurring(bookingId: string) {
  const res = await fetch(getSupabaseFunctionUrl('cancel-recurring-bookings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...AUTH_HEADER },
    body: JSON.stringify({ bookingId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return data as { success: true; deletedCount: number };
}


