// Simple client for recurring bookings Edge Functions
import { getSupabaseFunctionUrl, supabaseAuthHeader } from '@/lib/supabase-functions';

export type RecurrenceType = 'weekly' | 'biweekly';

export async function previewCreateRecurring(
  bookingId: string,
  recurrenceType: RecurrenceType,
  horizonDays: 30 | 60 | 90
) {
  const AUTH_HEADER = await supabaseAuthHeader();
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
  horizonDays: 30 | 60 | 90,
  selectedDates?: string[]
) {
  const AUTH_HEADER = await supabaseAuthHeader();
  const res = await fetch(getSupabaseFunctionUrl('create-recurring-bookings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...AUTH_HEADER },
    body: JSON.stringify({ bookingId, recurrenceType, horizonDays, confirm: true, selectedDates }),
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
  const AUTH_HEADER = await supabaseAuthHeader();
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


export const cancelRecurringInstance = async (instanceId: number) => {
  const functionUrl = getSupabaseFunctionUrl('cancel-recurring-instance');
  const AUTH_HEADER = await supabaseAuthHeader();

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...AUTH_HEADER
    },
    body: JSON.stringify({ instanceId }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  return data as { success: true; deletedInstance: any };
}


