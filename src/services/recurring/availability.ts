import { supabase } from '@/integrations/supabase/client';

export type RecurrenceType = 'daily' | 'weekly' | 'biweekly';

export async function previewCreateRecurringAvailability(
  hour: string,
  recurrenceType: RecurrenceType,
  horizonDays: 30 | 60 | 90,
  startDate?: string,
  weekdays?: number[]
) {
  const { data, error } = await supabase.functions.invoke('create-recurring-availabilities', {
    body: { hour, recurrenceType, horizonDays, startDate, weekdays, confirm: false },
  });
  if (error) throw new Error(error.message || 'Function error');
  return data as any;
}

export async function confirmCreateRecurringAvailability(
  hour: string,
  recurrenceType: RecurrenceType,
  horizonDays: 30 | 60 | 90,
  startDate?: string,
  weekdays?: number[]
) {
  const { data, error } = await supabase.functions.invoke('create-recurring-availabilities', {
    body: { hour, recurrenceType, horizonDays, startDate, weekdays, confirm: true },
  });
  if (error) throw new Error(error.message || 'Function error');
  return data as any;
}

export async function cancelRecurringAvailability(id: string) {
  const { data, error } = await supabase.functions.invoke('cancel-recurring-availabilities', {
    body: { id },
  });
  if (error) throw new Error(error.message || 'Function error');
  return data as any;
}


