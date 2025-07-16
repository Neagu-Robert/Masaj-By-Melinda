import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types';

export type Availability = Tables<'availabilities'>;
export type AvailabilityInsert = TablesInsert<'availabilities'>;
export type AvailabilityUpdate = TablesUpdate<'availabilities'>;

interface AvailabilitiesContextType {
  availabilities: Availability[];
  loading: boolean;
  error: string | null;
  fetchAvailabilities: (from: string, to: string) => Promise<void>;
  upsertAvailabilities: (rows: AvailabilityInsert[]) => Promise<void>;
  deleteAvailability: (id: string) => Promise<void>;
}

const AvailabilitiesContext = createContext<AvailabilitiesContextType | undefined>(undefined);

export const AvailabilitiesProvider = ({ children }: { children: ReactNode }) => {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch availabilities for a date range (inclusive)
  const fetchAvailabilities = useCallback(async (from: string, to: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('availabilities')
      .select('*')
      .gte('date', from)
      .lte('date', to);
    if (error) setError(error.message);
    setAvailabilities(data || []);
    setLoading(false);
  }, []);

  // Upsert (add/update) availabilities
  const upsertAvailabilities = async (rows: AvailabilityInsert[]) => {
    setError(null);
    const { error } = await supabase.from('availabilities').upsert(rows, { onConflict: 'date,hour' });
    if (error) setError(error.message);
    // fetchAvailabilities should be called after to refresh, or rely on real-time
  };

  // Delete an availability by id
  const deleteAvailability = async (id: string) => {
    setError(null);
    const { error } = await supabase.from('availabilities').delete().eq('id', id);
    if (error) setError(error.message);
    // fetchAvailabilities should be called after to refresh, or rely on real-time
  };

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('availabilities-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'availabilities' },
        (payload) => {
          setAvailabilities((prev) => {
            if (payload.eventType === 'INSERT') {
              // Add or replace
              const exists = prev.find(a => a.id === payload.new.id);
              if (exists) {
                return prev.map(a => a.id === payload.new.id ? payload.new as Availability : a);
              } else {
                return [...prev, payload.new as Availability];
              }
            } else if (payload.eventType === 'UPDATE') {
              return prev.map(a => a.id === payload.new.id ? payload.new as Availability : a);
            } else if (payload.eventType === 'DELETE') {
              return prev.filter(a => a.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <AvailabilitiesContext.Provider value={{ availabilities, loading, error, fetchAvailabilities, upsertAvailabilities, deleteAvailability }}>
      {children}
    </AvailabilitiesContext.Provider>
  );
};

export const useAvailabilities = () => {
  const ctx = useContext(AvailabilitiesContext);
  if (!ctx) throw new Error('useAvailabilities must be used within an AvailabilitiesProvider');
  return ctx;
}; 