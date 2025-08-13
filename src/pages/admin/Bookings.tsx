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
import { Edit, Trash2, Plus, Calendar as CalendarIcon } from "lucide-react";
import { Calendar as UICalendar } from '@/components/ui/calendar';
import { previewCreateRecurring, confirmCreateRecurring, cancelRecurring, RecurrenceType } from '@/services/recurring/service';

export default function Bookings() {
  const { bookings, loading, addBooking, updateBooking, deleteBooking } = useBookings();
  const { getServiceByName } = useServices();
  const { user: adminUser } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const { 
    sendBookingCancellationAdmin,
    sendRecurringCreatedAdmin,
    sendRecurringCancelledAdmin
  } = useBookingNotifications();

  // Recurring UI state (admin)
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('weekly');
  const [horizon, setHorizon] = useState<30 | 60 | 90>(30);
  const [preview, setPreview] = useState<{ date: string; time: string; available: boolean; reason?: string }[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedBookingForRecurring, setSelectedBookingForRecurring] = useState<any>(null);

  // Calendar selection state
  const [selectedDay, setSelectedDay] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  });

  // Recurring instances for coloring and list
  const [recurringInstances, setRecurringInstances] = useState<{ booking_id: string; date: string; hour: string; status: boolean; service_type?: string; userName?: string; userEmail?: string; userPhone?: string }[]>([]);

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

  // Load recurring instances for all recurring roots
  React.useEffect(() => {
    const loadRecurring = async () => {
      try {
        const recurringRoots = bookings.filter((b: any) => b.recurring);
        const rootIds = recurringRoots.map((b: any) => b.id);
        const serviceByRoot: Record<string, string> = {};
        const userLabelByRoot: Record<string, { name: string; email: string; phone: string }> = {};
        recurringRoots.forEach((b: any) => {
          serviceByRoot[b.id] = b.service_type;
          userLabelByRoot[b.id] = {
            name: `${b.first_name || ''} ${b.last_name || ''}`.trim(),
            email: b.profiles?.email || '',
            phone: b.phone_number || ''
          };
        });
        if (rootIds.length === 0) { setRecurringInstances([]); return; }
        const { data } = await supabase
          .from('recurring_bookings')
          .select('booking_id,date,hour,status')
          .in('booking_id', rootIds);
        setRecurringInstances((data || []).map((r: any) => ({
          booking_id: r.booking_id,
          date: r.date,
          hour: r.hour,
          status: r.status,
          service_type: serviceByRoot[r.booking_id],
          userName: userLabelByRoot[r.booking_id]?.name,
          userEmail: userLabelByRoot[r.booking_id]?.email,
          userPhone: userLabelByRoot[r.booking_id]?.phone,
        })));
      } catch (e) {
        console.error('Error loading recurring instances (admin):', e);
        setRecurringInstances([]);
      }
    };
    loadRecurring();
  }, [bookings]);

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
  const recurringSet = new Set<string>();
  const pastBookedSet = new Set<string>();
  const futureBookedSet = new Set<string>();
  // mark original recurring
  bookings.forEach((b: any) => { if (b.recurring) recurringSet.add(b.booking_date); });
  // mark planned recurring instances: only add those with TRUE status
  recurringInstances.forEach((r) => { if (r.status) recurringSet.add(r.date); });
  // regular booked
  bookings.forEach((b: any) => {
    const d = parseLocalDate(b.booking_date);
    const key = b.booking_date;
    if (!b.recurring) {
      if (d < todayMidnight) pastBookedSet.add(key);
      else if (d > todayMidnight) futureBookedSet.add(key);
    }
  });

  const openRecurringModal = (booking: any) => {
    setSelectedBookingForRecurring(booking);
    setPreview(null);
    setRecurrenceType('weekly');
    setHorizon(30);
    setRecurringOpen(true);
  };
  const previewRecurring = async () => {
    if (!selectedBookingForRecurring) return;
    setPreviewLoading(true);
    try {
      const result = await previewCreateRecurring(selectedBookingForRecurring.id, recurrenceType, horizon);
      setPreview(result.preview);
    } catch (e) {
      toast({ title: 'Error', description: (e as any).message, variant: 'destructive' });
    } finally { setPreviewLoading(false); }
  };
  const confirmRecurring = async () => {
    if (!selectedBookingForRecurring) return;
    try {
      const result = await confirmCreateRecurring(selectedBookingForRecurring.id, recurrenceType, horizon);
      setRecurringOpen(false);
      setPreview(null);
      toast({ title: 'Recurring created', description: `${result.createdCount} instances created.` });
      // Notify user via email only
      try {
        const serviceDetails = getServiceByName(selectedBookingForRecurring.service_type);
        const serviceId = serviceDetails?.id || null;
        await sendRecurringCreatedAdmin({
          bookingId: selectedBookingForRecurring.id,
          userId: selectedBookingForRecurring.user_id || '',
          userName: `${selectedBookingForRecurring.first_name || ''} ${selectedBookingForRecurring.last_name || ''}`.trim(),
          userEmail: selectedBookingForRecurring.profiles?.email || '',
          userPhone: selectedBookingForRecurring.phone_number || '',
          serviceName: selectedBookingForRecurring.service_type,
          serviceId,
          serviceProvider: 'Melinda',
          bookingDate: selectedBookingForRecurring.booking_date,
          bookingTime: selectedBookingForRecurring.booking_time,
          duration: serviceDetails?.duration || 60,
          price: serviceDetails?.price || 140.0,
          notes: `${recurrenceType} for ${horizon} days`,
          status: 'recurring_enabled_admin',
        });
      } catch (e) { console.error('Admin recurring create notify error:', e); }
    } catch (e) {
      toast({ title: 'Error', description: (e as any).message, variant: 'destructive' });
    }
  };
  const cancelRecurringAdmin = async (booking: any) => {
    try {
      const ok = window.confirm('Cancel recurring and remove all future instances?');
      if (!ok) return;
      const res = await cancelRecurring(booking.id);
      toast({ title: 'Recurring cancelled', description: `${res.deletedCount} future instances removed.` });
      try {
        const serviceDetails = getServiceByName(booking.service_type);
        const serviceId = serviceDetails?.id || null;
        await sendRecurringCancelledAdmin({
          bookingId: booking.id,
          userId: booking.user_id || '',
          userName: `${booking.first_name || ''} ${booking.last_name || ''}`.trim(),
          userEmail: booking.profiles?.email || '',
          userPhone: booking.phone_number || '',
          serviceName: booking.service_type,
          serviceId,
          serviceProvider: 'Melinda',
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          duration: serviceDetails?.duration || 60,
          price: serviceDetails?.price || 140.0,
          status: 'recurring_cancelled_admin',
        });
      } catch (e) { console.error('Admin recurring cancel notify error:', e); }
    } catch (e) {
      toast({ title: 'Error', description: (e as any).message, variant: 'destructive' });
    }
  };

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
      
      {/* Calendar + Day list (mirrors profile UI) */}
      <section id="booking-history" className="mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="mb-3 text-gray-300 flex items-center"><CalendarIcon className="h-4 w-4 mr-2"/>Select date</div>
            <div className="flex justify-center">
              <UICalendar
                mode="single"
                selected={selectedDay}
                onSelect={(d) => { if (d) { d.setHours(0,0,0,0); setSelectedDay(d); } }}
                className="rounded-md border border-gray-600 bg-gray-800 text-violet-200 p-4"
                classNames={{
                  day: "h-12 w-12 md:h-10 md:w-10 p-0 font-normal aria-selected:opacity-100 rounded-lg transition-all duration-200 hover:scale-110 hover:bg-violet-500/20 cursor-pointer",
                  head_cell: "text-muted-foreground rounded-md w-12 md:w-10 font-normal text-sm",
                  cell: "h-12 w-12 md:h-10 md:w-10 text-center text-sm p-0 relative",
                }}
                modifiers={{
                  today: (date) => dateKey(date) === dateKey(todayMidnight),
                  recurring: (date) => recurringSet.has(dateKey(date)),
                  pastBooked: (date) => pastBookedSet.has(dateKey(date)),
                  futureBooked: (date) => futureBookedSet.has(dateKey(date)),
                }}
                modifiersClassNames={{
                  today: "bg-blue-600/60 text-white rounded-lg shadow-lg",
                  recurring: "bg-green-600/60 text-white rounded-lg shadow-lg",
                  pastBooked: "bg-purple-900/70 text-white rounded-lg shadow-lg",
                  futureBooked: "bg-violet-600/80 text-white rounded-lg shadow-lg",
                }}
              />
            </div>
          </div>

          {/* Day list */}
          <div className="bg-gray-800/50 rounded-lg p-4 min-h-[300px]">
            <h3 className="text-lg font-semibold text-violet-300 mb-4">Bookings for {selectedDay.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</h3>
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
              {(() => {
                const dayKey = selectedDay.getTime();
                const dayBookings = filteredBookings
                  .filter((b: any) => { const d = parseLocalDate(b.booking_date); return d.getTime()===dayKey; })
                  .sort((a:any,b:any)=> parseLocalDate(a.booking_date).getTime()-parseLocalDate(b.booking_date).getTime());
                const dayRecurring = recurringInstances
                  .filter(r => r.status && (() => { const d = parseLocalDate(r.date); return d.getTime()===dayKey; })())
                  .sort((a,b)=> parseLocalDate(a.date).getTime()-parseLocalDate(b.date).getTime());
                if (loading) return <div className="text-gray-400">Loading...</div>;
                if (dayBookings.length===0 && dayRecurring.length===0) return <div className="text-gray-400">No bookings for this date.</div>;
                return (
                  <>
                    {dayRecurring.map((r, idx) => (
                      <Card key={`rec-${r.booking_id}-${r.date}-${r.hour}-${idx}`} className="bg-gray-800/50 border-green-600/50 hover:border-green-500/60 transition-colors duration-200">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm text-gray-400">Recurring</div>
                              <div className="text-white font-medium">{r.service_type}</div>
                              <div className="text-xs text-gray-400">{r.userName} ({r.userEmail}) {r.userPhone ? `• ${r.userPhone}` : ''}</div>
                            </div>
                            <div className="text-right text-white text-sm">{r.date} at {String(r.hour).slice(0,5)}</div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t border-gray-700">
                            {/* Only allow cancelling the recurrence series */}
                            <Button variant="ghost" size="sm" className="text-violet-300 hover:text-violet-200 hover:bg-violet-500/20" onClick={() => {
                              const root = bookings.find((b:any) => b.id === r.booking_id);
                              if (root) cancelRecurringAdmin(root);
                            }}>Cancel Recurring</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {dayBookings.map((b: any) => (
                      <Card key={b.id} className="bg-gray-800/50 border-gray-700 hover:border-violet-500/50 transition-colors duration-200">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-white font-medium">{b.first_name} {b.last_name}</div>
                              <div className="text-xs text-gray-400">{b.profiles?.email || '-'} • {b.phone_number}</div>
                              <div className="text-sm text-gray-300">{b.service_type}</div>
                            </div>
                            <div className="text-right text-white text-sm">{b.booking_date} at {b.booking_time}</div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t border-gray-700">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(b)} className="text-white hover:text-gray-300">Edit</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)} className="text-red-400 hover:text-red-300">Delete</Button>
                            {b.recurring ? (
                              <Button variant="ghost" size="sm" className="text-violet-300 hover:text-violet-200" onClick={() => cancelRecurringAdmin(b)}>Cancel Recurring</Button>
                            ) : (
                              <Button variant="ghost" size="sm" className="text-green-300 hover:text-green-200" onClick={() => openRecurringModal(b)}>Make Recurring</Button>
                            )}
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

      {/* Recurring Modal (Admin) */}
      {recurringOpen && selectedBookingForRecurring && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-lg p-6">
            <h3 className="text-xl font-semibold text-violet-300 mb-4">Make Recurring</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Recurrence</label>
                  <select value={recurrenceType} onChange={(e)=> setRecurrenceType(e.target.value as RecurrenceType)} className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2">
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Duration</label>
                  <select value={horizon} onChange={(e)=> setHorizon(Number(e.target.value) as 30|60|90)} className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2">
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={previewRecurring} disabled={previewLoading} className="bg-violet-600 hover:bg-violet-700 text-white">{previewLoading ? 'Previewing...' : 'Preview'}</Button>
                <Button variant="outline" onClick={() => setRecurringOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-800">Close</Button>
              </div>
              {preview && (
                <div className="max-h-64 overflow-auto border border-gray-700 rounded p-3 bg-gray-800">
                  <div className="text-sm text-gray-300 mb-2">Preview ({preview.length} dates)</div>
                  <ul className="space-y-1 text-sm">
                    {preview.map((p, idx) => (
                      <li key={idx} className={p.available ? 'text-green-300' : 'text-gray-400'}>
                        {p.date} at {p.time} {p.available ? '' : `(unavailable: ${p.reason})`}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3">
                    <Button onClick={confirmRecurring} className="bg-green-600 hover:bg-green-700 text-white">Confirm Recurring</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 