import React, { useState } from "react";
import { useBookings } from "../../contexts/BookingsContext";
import { useServices } from "../../contexts/ServicesContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BookingFormModal from "@/components/admin/BookingFormModal";
import { useAuth } from "@/contexts/AuthContext";
import { logAdminAction } from "@/lib/audit-logger";
import { useBookingNotifications } from "@/services/notifications/hooks";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Plus } from "lucide-react";

export default function Bookings() {
  const { bookings, loading, addBooking, updateBooking, deleteBooking } = useBookings();
  const { getServiceByName } = useServices();
  const { user: adminUser } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const { sendBookingCancellationAdmin } = useBookingNotifications();

  // Filter/search state
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchService, setSearchService] = useState("all");

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
      
      // Get service details from the database
      const serviceDetails = getServiceByName(bookingToDelete?.service_type);
      const serviceId = serviceDetails?.id || null;
      
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
              serviceId: serviceId,
              serviceProvider: 'Melinda',
              bookingDate: bookingToDelete.booking_date,
              bookingTime: bookingToDelete.booking_time,
              duration: serviceDetails?.duration || 60,
              price: serviceDetails?.price || 140.00,
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
    const matchesService = !searchService || searchService === "all" || b.service_type === searchService;
    return matchesName && matchesEmail && matchesDate && matchesService;
  });

  // Get unique service types for dropdown
  const serviceTypes = Array.from(new Set(bookings.map((b: any) => b.service_type).filter(Boolean)));

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-900 min-h-screen">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-violet-400">Bookings</h2>
      
      {/* Filter/Search UI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <Input
          type="text"
          placeholder="Search by name"
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
          className="bg-gray-800/50 text-white border-gray-700 h-10 md:h-9"
        />
        <Input
          type="text"
          placeholder="Search by email"
          value={searchEmail}
          onChange={e => setSearchEmail(e.target.value)}
          className="bg-gray-800/50 text-white border-gray-700 h-10 md:h-9"
        />
        <Input
          type="date"
          value={searchDate}
          onChange={e => setSearchDate(e.target.value)}
          className="bg-gray-800/50 text-white border-gray-700 h-10 md:h-9"
        />
        <Select value={searchService} onValueChange={setSearchService}>
          <SelectTrigger className="bg-gray-800/50 text-white border-gray-700 h-10 md:h-9">
            <SelectValue placeholder="All Services" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800/90 text-white">
            <SelectItem value="all">All Services</SelectItem>
            {serviceTypes.map((type: string) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button onClick={handleCreate} className="mb-4 md:mb-6 bg-violet-600 hover:bg-violet-700 text-white h-10 md:h-9 w-full md:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        Add Booking
      </Button>
      
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border border-gray-800 bg-gray-800/50 shadow-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Name</TableHead>
              <TableHead className="text-white">Email</TableHead>
              <TableHead className="text-white">Phone</TableHead>
              <TableHead className="text-white">Service</TableHead>
              <TableHead className="text-white">Date</TableHead>
              <TableHead className="text-white">Time</TableHead>
              <TableHead className="text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-400">Loading...</TableCell>
              </TableRow>
            ) : filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-400">No bookings found.</TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((b: any) => (
                <TableRow key={b.id} className="border-b border-gray-700">
                  <TableCell className="text-gray-300">{b.first_name} {b.last_name}</TableCell>
                  <TableCell className="text-gray-300">{b.profiles?.email || '-'}</TableCell>
                  <TableCell className="text-gray-300">{b.phone_number}</TableCell>
                  <TableCell className="text-gray-300">{b.service_type}</TableCell>
                  <TableCell className="text-gray-300">{b.booking_date}</TableCell>
                  <TableCell className="text-gray-300">{b.booking_time}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(b)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No bookings found.</div>
        ) : (
          filteredBookings.map((b: any) => (
            <Card key={b.id} className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm text-gray-400 mb-1">Name</div>
                    <div className="text-white font-medium">{b.first_name} {b.last_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400 mb-1">Date & Time</div>
                    <div className="text-white text-sm">{b.booking_date} at {b.booking_time}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm text-gray-400 mb-1">Email</div>
                    <div className="text-white text-sm">{b.profiles?.email || '-'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400 mb-1">Phone</div>
                    <div className="text-white text-sm">{b.phone_number}</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-400 mb-1">Service</div>
                  <div className="text-violet-300 font-medium">{b.service_type}</div>
                </div>
                
                                 <div className="flex justify-end space-x-2 pt-2 border-t border-gray-700">
                   <Button variant="ghost" size="sm" onClick={() => handleEdit(b)} className="text-white hover:text-gray-300">
                     <Edit className="h-4 w-4 mr-1" />
                     Edit
                   </Button>
                   <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)} className="text-red-400 hover:text-red-300">
                     <Trash2 className="h-4 w-4 mr-1" />
                     Delete
                   </Button>
                 </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      <BookingFormModal open={modalOpen} onClose={handleModalClose} booking={selectedBooking} />
    </div>
  );
} 