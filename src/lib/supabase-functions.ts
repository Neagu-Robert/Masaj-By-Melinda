// Shared helpers for Supabase Edge Functions calls

import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const inferFunctionsBase = (): string => {
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
  if (supabaseUrl && /^https?:\/\//.test(supabaseUrl)) {
    // For localhost or hosted URLs, derive functions path from the actual supplied base URL
    return supabaseUrl.replace(/\/?$/, '') + '/functions/v1';
  }
  // Fallback to the known project functions domain (ensure production keeps working)
  return 'https://dgzmqlwqlfmdbnwqjjjr.functions.supabase.co';
};

export const FUNCTIONS_BASE: string = inferFunctionsBase();
export const SUPABASE_ANON: string = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string;

export const getSupabaseFunctionUrl = (fn: string): string => `${FUNCTIONS_BASE}/${fn}`;

export const supabaseAuthHeader = async (): Promise<Record<string, string>> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token ?? SUPABASE_ANON;

  return {
    Authorization: `Bearer ${token}`,
  };
};


