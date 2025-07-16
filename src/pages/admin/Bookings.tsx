import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "@/components/ui/use-toast";
import BookingFormModal from "@/components/admin/BookingFormModal";

export default function Bookings() {
  const [bookings, setBookings] = useState<Tables<"bookings">[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Tables<"bookings"> | null>(null);

  // Fetch bookings
  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("booking_date", { ascending: false });
      if (error) toast({ title: "Error", description: error.message });
      else setBookings(data || []);
      setLoading(false);
    }
    fetchBookings();
  }, []);

  // Handlers for CRUD
  const handleEdit = (booking: Tables<"bookings">) => {
    setSelectedBooking(booking);
    setModalOpen(true); // Placeholder for modal logic
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message });
    else setBookings(bookings.filter(b => b.id !== id));
  };
  const handleCreate = () => {
    setSelectedBooking(null);
    setModalOpen(true); // Placeholder for modal logic
  };
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedBooking(null);
  };
  // Placeholder for modal save logic
  const handleModalSave = (newBooking: Tables<"bookings">) => {
    if (selectedBooking) {
      // Update in place
      setBookings(bookings.map(b => b.id === newBooking.id ? newBooking : b));
    } else {
      // Add new
      setBookings([newBooking, ...bookings]);
    }
    setModalOpen(false);
    setSelectedBooking(null);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Bookings</h2>
      <button onClick={handleCreate} className="mb-4 px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700">Add Booking</button>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 text-white rounded shadow">
          <thead>
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Service</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">Loading...</td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8">No bookings found.</td>
              </tr>
            ) : (
              bookings.map(b => (
                <tr key={b.id} className="border-b border-gray-700">
                  <td className="px-4 py-2">{b.first_name} {b.last_name}</td>
                  <td className="px-4 py-2">{b.phone_number}</td>
                  <td className="px-4 py-2">{b.service_type}</td>
                  <td className="px-4 py-2">{b.booking_date}</td>
                  <td className="px-4 py-2">{b.booking_time}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button onClick={() => handleEdit(b)} className="px-2 py-1 bg-blue-600 rounded hover:bg-blue-700">Edit</button>
                    <button onClick={() => handleDelete(b.id)} className="px-2 py-1 bg-red-600 rounded hover:bg-red-700">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <BookingFormModal open={modalOpen} onClose={handleModalClose} booking={selectedBooking} onSave={handleModalSave} />
    </div>
  );
} 