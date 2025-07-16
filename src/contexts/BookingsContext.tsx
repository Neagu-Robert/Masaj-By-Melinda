import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types';

// Booking type from Supabase types
export type Booking = Tables<'bookings'>;
export type BookingInsert = TablesInsert<'bookings'>;
export type BookingUpdate = TablesUpdate<'bookings'>;

interface BookingsContextType {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  addBooking: (data: BookingInsert) => Promise<void>;
  updateBooking: (id: string, updates: BookingUpdate) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  refreshBookings: () => Promise<void>;
}

const BookingsContext = createContext<BookingsContextType | undefined>(undefined);

export const BookingsProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all bookings
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('bookings').select('*').order('booking_date', { ascending: true });
    if (error) setError(error.message);
    setBookings(data || []);
    setLoading(false);
  };

  // Add booking
  const addBooking = async (data: BookingInsert) => {
    setError(null);
    const { error } = await supabase.from('bookings').insert([data]);
    if (error) setError(error.message);
    // fetchBookings(); // Real-time will update
  };

  // Update booking
  const updateBooking = async (id: string, updates: BookingUpdate) => {
    setError(null);
    const { error } = await supabase.from('bookings').update(updates).eq('id', id);
    if (error) setError(error.message);
    // fetchBookings(); // Real-time will update
  };

  // Delete booking
  const deleteBooking = async (id: string) => {
    setError(null);
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) setError(error.message);
    // fetchBookings(); // Real-time will update
  };

  // Manual refresh
  const refreshBookings = fetchBookings;

  // Real-time subscription
  useEffect(() => {
    fetchBookings();
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          // Handle insert, update, delete
          if (payload.eventType === 'INSERT') {
            setBookings((prev) => [...prev, payload.new as Booking]);
          } else if (payload.eventType === 'UPDATE') {
            setBookings((prev) => prev.map(b => b.id === payload.new.id ? (payload.new as Booking) : b));
          } else if (payload.eventType === 'DELETE') {
            setBookings((prev) => prev.filter(b => b.id !== payload.old.id));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line
  }, []);

  return (
    <BookingsContext.Provider value={{ bookings, loading, error, addBooking, updateBooking, deleteBooking, refreshBookings }}>
      {children}
    </BookingsContext.Provider>
  );
};

export const useBookings = () => {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error('useBookings must be used within a BookingsProvider');
  return ctx;
}; 