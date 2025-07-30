import React, { useState } from "react";
import { useBookings } from "../../contexts/BookingsContext";
import { toast } from "@/components/ui/use-toast";
import BookingFormModal from "@/components/admin/BookingFormModal";
import { useAuth } from "@/contexts/AuthContext";
import { logAdminAction } from "@/lib/audit-logger";
import { useBookingNotifications } from "@/services/notifications/hooks";
import { supabase } from "@/integrations/supabase/client";

export default function Bookings() {
  const { bookings, loading, addBooking, updateBooking, deleteBooking } = useBookings();
  const { user: adminUser } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const { sendBookingCancellationAdmin } = useBookingNotifications();

  // Filter/search state
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchService, setSearchService] = useState("");

  // Handlers for CRUD
  const handleEdit = (booking: any) => {
    setSelectedBooking(booking);
    setModalOpen(true);
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    
    try {
      // Get booking details before deletion
      const bookingToDelete = bookings.find(b => b.id === id);
      
      // Delete the booking
      await deleteBooking(id);
      toast({ title: "Booking deleted" });
      
      // Log the admin action
      await logAdminAction(
        adminUser?.id || "",
        "booking.delete",
        "booking",
        id,
        `Deleted booking ID ${id}`
      );

      // Send notification if booking had a user
      if (bookingToDelete && (bookingToDelete as any).user_id) {
        try {
          // Get user email
          const { data: userData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', (bookingToDelete as any).user_id)
            .single();
          
          if (userData?.email) {
            await sendBookingCancellationAdmin({
              bookingId: bookingToDelete.id,
              userId: (bookingToDelete as any).user_id,
              userName: `${bookingToDelete.first_name} ${bookingToDelete.last_name}`,
              userEmail: userData.email,
              userPhone: bookingToDelete.phone_number,
              serviceName: bookingToDelete.service_type,
              serviceProvider: 'Melinda',
              bookingDate: bookingToDelete.booking_date,
              bookingTime: bookingToDelete.booking_time,
              duration: 60, // Default duration
              price: 150, // Default price
              status: 'cancelled'
            });
          }
        } catch (notificationError) {
          console.error('Error sending cancellation notification:', notificationError);
          // Don't block the deletion process if notification fails
        }
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast({ title: "Failed to delete booking." });
    }
  };
  const handleCreate = () => {
    setSelectedBooking(null);
    setModalOpen(true);
  };
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedBooking(null);
  };
  // Save logic uses context
  const handleModalSave = async (values: any) => {
    if (selectedBooking) {
      await updateBooking(selectedBooking.id, values);
      toast({ title: "Booking updated" });
    } else {
      await addBooking(values);
      toast({ title: "Booking created" });
    }
    setModalOpen(false);
    setSelectedBooking(null);
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b: any) => {
    // Name filter (first or last name)
    const matchesName =
      !searchName ||
      (b.first_name && b.first_name.toLowerCase().includes(searchName.toLowerCase())) ||
      (b.last_name && b.last_name.toLowerCase().includes(searchName.toLowerCase()));
    // Email filter (from profiles)
    const matchesEmail =
      !searchEmail ||
      (b.profiles?.email && b.profiles.email.toLowerCase().includes(searchEmail.toLowerCase()));
    // Date filter
    const matchesDate = !searchDate || b.booking_date === searchDate;
    // Service filter
    const matchesService = !searchService || b.service_type === searchService;
    return matchesName && matchesEmail && matchesDate && matchesService;
  });

  // Get unique service types for dropdown
  const serviceTypes = Array.from(new Set(bookings.map((b: any) => b.service_type).filter(Boolean)));

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Bookings</h2>
      {/* Filter/Search UI */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name"
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
          className="px-2 py-1 rounded bg-gray-700 text-white"
        />
        <input
          type="text"
          placeholder="Search by email"
          value={searchEmail}
          onChange={e => setSearchEmail(e.target.value)}
          className="px-2 py-1 rounded bg-gray-700 text-white"
        />
        <input
          type="date"
          value={searchDate}
          onChange={e => setSearchDate(e.target.value)}
          className="px-2 py-1 rounded bg-gray-700 text-white"
        />
        <select
          value={searchService}
          onChange={e => setSearchService(e.target.value)}
          className="px-2 py-1 rounded bg-gray-700 text-white"
        >
          <option value="">All Services</option>
          {serviceTypes.map((type: string) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      <button onClick={handleCreate} className="mb-4 px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700">Add Booking</button>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 text-white rounded shadow">
          <thead>
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
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
                <td colSpan={7} className="text-center py-8">Loading...</td>
              </tr>
            ) : filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8">No bookings found.</td>
              </tr>
            ) : (
              filteredBookings.map((b: any) => (
                <tr key={b.id} className="border-b border-gray-700">
                  <td className="px-4 py-2">{b.first_name} {b.last_name}</td>
                  <td className="px-4 py-2">{b.profiles?.email || '-'}</td>
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
      <BookingFormModal open={modalOpen} onClose={handleModalClose} booking={selectedBooking} />
    </div>
  );
} 