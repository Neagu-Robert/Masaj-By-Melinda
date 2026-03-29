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
import { useBookingNotifications } from "@/services/notifications/hooks";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Plus, Calendar as CalendarIcon } from "lucide-react";
import { Calendar as UICalendar } from '@/components/ui/calendar';

function getStatusBadge(status?: string) {
  if (!status || status === 'confirmed') {
    return <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-500/20 text-green-300">Confirmat</span>;
  }
  
  const statusConfig = {
    unconfirmed: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'În așteptare' },
    suggested: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Sugestie' },
    rejected: { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Respins' },
  };
  
  const config = statusConfig[status] || statusConfig.unconfirmed;
  
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ name: "robots", content: "noindex, nofollow" }];
};

export default function Bookings() {
  const { bookings, loading, addBooking, updateBooking, deleteBooking } = useBookings();
  const { getServiceByName } = useServices();
  const { user: adminUser } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const { sendBookingCancellationAdmin } = useBookingNotifications();

  // Calendar selection state
  const [selectedDay, setSelectedDay] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  });

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
    if (!window.confirm("Sigur doriți să ștergeți această rezervare?")) return;
    
    try {
      // Get booking details before deletion
      const bookingToDelete = bookings.find(b => b.id === id);
      
      // Get service details from the database
      const serviceDetails = getServiceByName(bookingToDelete?.service_type);
      const serviceId = serviceDetails?.id || null;
      
      await deleteBooking(id);
      toast({ title: "Rezervare ștearsă" });

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
      toast({ title: "Eroare la ștergerea rezervării." });
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
      toast({ title: "Rezervare actualizată" });
    } else {
      await addBooking(values);
      toast({ title: "Rezervare creată" });
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

  // Load recurring instances effect removed

  // Calendar modifiers
  const todayMidnight = new Date();
  todayMidnight.setHours(0,0,0,0);
  const dateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const da = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${da}`;
  };
  const parseLocalDate = (s: string) => {
    const [y,m,d] = s.split('-').map(Number);
    const dt = new Date(y, (m||1)-1, d||1);
    dt.setHours(0,0,0,0);
    return dt;
  };
  const confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed');
  const pastBookedSet = new Set<string>();
  const futureBookedSet = new Set<string>();
  const unconfirmedSet = new Set<string>();

  // mark unconfirmed bookings
  bookings.forEach((b: any) => {
    if (b.status === 'unconfirmed' && b.requested_date_text) {
      unconfirmedSet.add(b.requested_date_text);
    }
  });

  // regular booked
  confirmedBookings.forEach((b: any) => {
    const d = parseLocalDate(b.booking_date);
    const key = b.booking_date;
    if (d < todayMidnight) pastBookedSet.add(key);
    else if (d > todayMidnight) futureBookedSet.add(key);
  });

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-900 min-h-screen">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-violet-400">Rezervări</h2>
      
      {/* Filter/Search UI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <Input
          type="text"
          placeholder="Caută după nume"
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
          className="bg-gray-800/50 text-white border-gray-700 h-10 md:h-9"
        />
        <Input
          type="text"
          placeholder="Caută după email"
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
            <SelectValue placeholder="Toate Serviciile" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800/90 text-white">
            <SelectItem value="all">Toate Serviciile</SelectItem>
            {serviceTypes.map((type: string) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button onClick={handleCreate} className="mb-4 md:mb-6 bg-violet-600 hover:bg-violet-700 text-white h-10 md:h-9 w-full md:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        Adaugă Rezervare
      </Button>
      
      {/* Calendar - Visible on both mobile and desktop */}
      <section id="booking-history" className="mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="mb-3 text-gray-300 flex items-center"><CalendarIcon className="h-4 w-4 mr-2"/>Selectați data</div>
            <div className="flex justify-center">
              <UICalendar
                mode="single"
                selected={selectedDay}
                onSelect={(d) => { if (d) { d.setHours(0,0,0,0); setSelectedDay(d); } }}
                className="rounded-md border border-gray-600 bg-gray-800 text-violet-200 p-2 md:p-4 max-w-[300px] md:max-w-none"
                classNames={{
                  day: "h-10 w-10 md:h-12 md:w-12 p-0 font-normal aria-selected:opacity-100 rounded-lg transition-all duration-200 hover:scale-110 hover:bg-violet-500/20 cursor-pointer",
                  head_cell: "text-muted-foreground rounded-md w-10 md:w-12 font-normal text-xs md:text-sm",
                  cell: "h-10 w-10 md:h-12 md:w-12 text-center text-xs md:text-sm p-0 relative",
                }}
                modifiers={{
                  today: (date) => dateKey(date) === dateKey(todayMidnight),
                  pastBooked: (date) => pastBookedSet.has(dateKey(date)),
                  futureBooked: (date) => futureBookedSet.has(dateKey(date)),
                  unconfirmed: (date) => unconfirmedSet.has(dateKey(date))
                }}
                modifiersClassNames={{
                  today: "bg-blue-600/60 text-white rounded-lg shadow-lg",
                  pastBooked: "bg-purple-900/70 text-white rounded-lg shadow-lg",
                  futureBooked: "bg-violet-600/80 text-white rounded-lg shadow-lg",
                  unconfirmed: "bg-yellow-600/40 text-white rounded-lg shadow-lg"
                }}
              />
            </div>
          </div>

          {/* Desktop Day list - Hidden on mobile */}
          <div className="bg-gray-800/50 rounded-lg p-4 min-h-[300px] hidden md:block">
            <h3 className="text-lg font-semibold text-violet-300 mb-4">Rezervări pentru {selectedDay.toLocaleDateString('ro-RO', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</h3>
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
              {(() => {
                const dayKey = selectedDay.getTime();
                const dayBookings = filteredBookings
                  .filter((b: any) => b.status === 'confirmed' && parseLocalDate(b.booking_date).getTime() === dayKey)
                  .sort((a:any,b:any)=> parseLocalDate(a.booking_date).getTime()-parseLocalDate(b.booking_date).getTime());
                if (loading) return <div className="text-gray-400">Se încarcă...</div>;
                if (dayBookings.length===0) return <div className="text-gray-400">Nu există rezervări pentru această dată.</div>;
                return (
                  <>
                    {dayBookings.map((b: any) => (
                      <Card key={b.id} className="bg-gray-800/50 border-gray-700 hover:border-violet-500/50 transition-colors duration-200">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-white font-medium">{b.first_name} {b.last_name}</div>
                              <div className="text-xs text-gray-400">{b.profiles?.email || '-'} • {b.phone_number}</div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-300">{b.service_type}</span>
                                {getStatusBadge(b.status)}
                              </div>
                            </div>
                            <div className="text-right text-white text-sm">{b.booking_date} la {b.booking_time}</div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t border-gray-700">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(b)} className="text-white hover:text-gray-300">Editează</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)} className="text-red-400 hover:text-red-300">Șterge</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Card View - Only show for selected day */}
      <div className="md:hidden space-y-3 mt-6">
        <h3 className="text-lg font-semibold text-violet-300 mb-4">{selectedDay.toLocaleDateString('ro-RO', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Se încarcă...</div>
        ) : (() => {
          const dayKey = selectedDay.getTime();
          const dayBookings = filteredBookings
            .filter((b: any) => b.status === 'confirmed' && parseLocalDate(b.booking_date).getTime() === dayKey)
            .sort((a:any,b:any)=> parseLocalDate(a.booking_date).getTime()-parseLocalDate(b.booking_date).getTime());
          if (dayBookings.length === 0) {
            return <div className="text-center py-8 text-gray-400">Nu există rezervări pentru această dată.</div>;
          }
          
          return (
            <>
              {/* Show regular bookings */}
              {dayBookings.map((b: any) => (
                <Card key={`mobile-${b.id}`} className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm text-gray-400 mb-1">Nume</div>
                        <div className="text-white font-medium">{b.first_name} {b.last_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400 mb-1">Oră</div>
                        <div className="text-white text-sm">{b.booking_time}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm text-gray-400 mb-1">Email</div>
                        <div className="text-white text-sm">{b.profiles?.email || '-'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400 mb-1">Telefon</div>
                        <div className="text-white text-sm">{b.phone_number}</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Serviciu</div>
                      <div className="text-violet-300 font-medium">{b.service_type}</div>
                    </div>
                    
                    <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-700">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(b)} className="text-white hover:text-gray-300 text-xs px-2 py-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Editează
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Șterge
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          );
        })()}
      </div>
      
      <BookingFormModal open={modalOpen} onClose={handleModalClose} booking={selectedBooking} />

    </div>
  );
} 