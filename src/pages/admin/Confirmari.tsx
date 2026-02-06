import { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import { logAdminAction } from '../../lib/audit-logger';
import { useAuth } from '../../contexts/AuthContext';
import { useBookingNotifications } from '../../services/notifications/hooks';
import { useServices } from '../../contexts/ServicesContext';
import { useAvailabilities } from '../../contexts/AvailabilitiesContext';
import { formatDateForDB, checkForDoubleBooking, validateBookingData, getAvailableTimeSlotsForDate, getTomorrow, fetchBookedTimeSlots } from '../../lib/booking-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock } from 'lucide-react';

type Booking = {
  id: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
  service_id: number | null;
  requested_date_text: string | null;
  requested_time_text: string | null;
  status: 'unconfirmed' | 'suggested';
  user_id: string;
  profiles: {
    full_name: string;
    phone: string;
    email: string;
  } | null;
};

const Confirmari = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { services, getServiceByName } = useServices();
  const { availabilities, fetchAvailabilities } = useAvailabilities();
  const {
    sendBookingRejectedByAdmin,
    sendBookingUpdateAdmin,
  } = useBookingNotifications();

  // Modal states
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedBookingForAction, setSelectedBookingForAction] = useState<Booking | null>(null);
  
  // Date/Time selection states
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBookings();

    const subscription = supabase
      .channel('bookings-confirmari')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          console.log('Change received!', payload);
          fetchBookings();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        id,
        booking_date,
        booking_time,
        service_type,
        service_id,
        requested_date_text,
        requested_time_text,
        status,
        user_id,
        profiles (
          full_name,
          phone,
          email
        )
      `,
      )
      .in('status', ['unconfirmed', 'suggested']);

    if (error) {
      toast.error('Eroare la preluarea rezervărilor', {
        description: error.message
      });
      setBookings([]);
    } else if (data) {
      // Properly type the response - profiles is a single object, not an array
      const typedBookings: Booking[] = data.map((item: any) => ({
        ...item,
        profiles: item.profiles && typeof item.profiles === 'object' && !Array.isArray(item.profiles) 
          ? item.profiles 
          : null
      }));
      setBookings(typedBookings);
    } else {
      setBookings([]);
    }
    setLoading(false);
  };

  const handleReject = async (booking: Booking) => {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', booking.id);

    if (error) {
      toast.error('Eroare la respingerea rezervării', {
        description: error.message
      });
    } else {
      toast.success('Rezervare respinsă!');
      logAdminAction(
        user?.id || '',
        'booking.delete',
        'booking',
        booking.id,
        'Booking rejected by admin',
      );
      if (booking.profiles) {
        const serviceDetails = services.find((s) => s.id === booking.service_id);
        sendBookingRejectedByAdmin({
          bookingId: booking.id,
          userId: booking.user_id,
          userName: booking.profiles.full_name,
          userEmail: booking.profiles.email,
          userPhone: booking.profiles.phone,
          serviceName: booking.service_type,
          serviceId: booking.service_id,
          serviceProvider: 'Melinda',
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          duration: serviceDetails?.duration || 60,
          price: serviceDetails?.price || 0,
          status: 'rejected',
        });
      }
      fetchBookings();
    }
  };

  // Fetch availabilities when modal opens
  useEffect(() => {
    if (confirmModalOpen && selectedBookingForAction) {
      const from = new Date();
      from.setMonth(from.getMonth() - 1);
      const to = new Date();
      to.setMonth(to.getMonth() + 3);
      fetchAvailabilities(formatDateForDB(from), formatDateForDB(to));
    }
  }, [confirmModalOpen, selectedBookingForAction, fetchAvailabilities]);

  // Fetch booked time slots when date changes
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!selectedDate) {
        setBookedTimeSlots([]);
        return;
      }
      try {
        const booked = await fetchBookedTimeSlots(selectedDate);
        setBookedTimeSlots(booked);
      } catch (error) {
        console.error('Error fetching booked time slots:', error);
        setBookedTimeSlots([]);
      }
    };
    fetchBookedSlots();
  }, [selectedDate]);

  // Helper: Get available hours for selected date
  const getAvailableHoursForSelectedDate = () => {
    if (!selectedDate) return [];
    
    const formattedDate = formatDateForDB(selectedDate);
    
    // Get unavailable hours from availabilities context
    const unavailableHours = availabilities
      .filter(a => a.date === formattedDate && !a.is_available)
      .map(a => a.hour.slice(0, 5));
    
    // Get base time slots based on business rules
    const baseTimeSlots = getAvailableTimeSlotsForDate(selectedDate);
    
    // Filter out both booked and unavailable hours
    const availableHours = baseTimeSlots.filter(hour => {
      const isBooked = bookedTimeSlots.some(
        (b) => b === hour || b.padStart(5, "0") === hour.padStart(5, "0") || 
               b.replace(/^0/, "") === hour.replace(/^0/, "")
      );
      const isUnavailable = unavailableHours.some(
        (u) => u === hour || u.padStart(5, "0") === hour.padStart(5, "0") || 
               u.replace(/^0/, "") === hour.replace(/^0/, "")
      );
      return !isBooked && !isUnavailable;
    });
    
    return availableHours;
  };

  // Helper: Check if date should be disabled
  const isDateDisabled = (date: Date) => {
    const tomorrow = getTomorrow();
    const dayOfWeek = date.getDay();
    
    if (date < tomorrow) return true;
    if (dayOfWeek === 0) return true; // Disable Sundays
    
    return false;
  };

  const handleOpenConfirmModal = (booking: Booking) => {
    setSelectedBookingForAction(booking);
    setSelectedDate(booking.booking_date ? new Date(booking.booking_date) : undefined);
    setSelectedTime(booking.booking_time || '');
    setConfirmModalOpen(true);
  };

  const handleCloseModal = () => {
    setConfirmModalOpen(false);
    setSelectedBookingForAction(null);
    setSelectedDate(undefined);
    setSelectedTime('');
  };

  const handleSaveConfirm = async () => {
    if (!selectedBookingForAction || !selectedDate || !selectedTime) {
      toast.error('Vă rugăm să selectați data și ora');
      return;
    }

    // Validate booking data
    const validation = validateBookingData(selectedDate, selectedTime, selectedBookingForAction.service_type);
    if (!validation.isValid) {
      toast.error(validation.error || 'Date de rezervare invalide');
      return;
    }

    // Check for double booking (excluding current booking)
    const doubleBookingCheck = await checkForDoubleBooking(
      selectedDate,
      selectedTime,
      selectedBookingForAction.id
    );

    if (doubleBookingCheck.isDoubleBooked) {
      toast.error(doubleBookingCheck.error || 'Acest interval orar este deja rezervat');
      return;
    }

    setIsSaving(true);
    try {
      const serviceDetails = getServiceByName(selectedBookingForAction.service_type);
      const serviceId = serviceDetails?.id || null;

      // Update booking with date/time and confirm it
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          booking_date: formatDateForDB(selectedDate),
          booking_time: selectedTime,
          service_id: serviceId,
          status: 'confirmed',
          requested_date_text: null,
          requested_time_text: null
        })
        .eq('id', selectedBookingForAction.id);

      if (updateError) {
        toast.error('Eroare la confirmarea rezervării', {
          description: updateError.message
        });
        return;
      }

      // Send confirmation notification to customer
      if (selectedBookingForAction.profiles) {
        await sendBookingUpdateAdmin({
          bookingId: selectedBookingForAction.id,
          userId: selectedBookingForAction.user_id,
          userName: selectedBookingForAction.profiles.full_name,
          userEmail: selectedBookingForAction.profiles.email,
          userPhone: selectedBookingForAction.profiles.phone,
          serviceName: selectedBookingForAction.service_type,
          serviceId: serviceId,
          serviceProvider: 'Melinda',
          bookingDate: formatDateForDB(selectedDate),
          bookingTime: selectedTime,
          duration: serviceDetails?.duration || 60,
          price: serviceDetails?.price || 0,
          status: 'confirmed'
        });
      }

      // Log admin action
      await logAdminAction(
        user?.id || '',
        'booking.update.admin',
        'booking',
        selectedBookingForAction.id,
        `Admin confirmed booking: date ${formatDateForDB(selectedDate)} at ${selectedTime}`
      );

      toast.success('Rezervare confirmată!');
      handleCloseModal();
      fetchBookings();
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('A apărut o eroare la confirmarea rezervării');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-white p-4">Se încarcă rezervările pentru confirmare...</div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-900 min-h-screen text-white">
        <h1 className="text-2xl font-bold mb-6">Confirmări Rezervări</h1>
        {bookings.length === 0 ? (
          <p>Nu există rezervări care necesită confirmare.</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-gray-800 p-4 rounded-lg shadow-md"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h2 className="font-bold text-lg text-violet-400">
                      {booking.profiles?.full_name}
                    </h2>
                    <p>{booking.profiles?.email}</p>
                    <p>{booking.profiles?.phone}</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-yellow-500 mb-4">
                    <h3 className="font-semibold text-yellow-400 mb-2">Cererea Clientului</h3>
                    <p className="text-gray-300">Serviciu: {booking.service_type}</p>
                    <p className="text-gray-300">Data dorită: {booking.requested_date_text || 'Nu a specificat'}</p>
                    <p className="text-gray-300">Ora preferată: {booking.requested_time_text || 'Nu a specificat'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Detalii Rezervare</h3>
                    <p>Serviciu: {booking.service_type}</p>
                    <p>
                      Data: {new Date(booking.booking_date).toLocaleDateString()}
                    </p>
                    <p>Ora: {booking.booking_time}</p>
                    <p>
                      Status:{' '}
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          booking.status === 'unconfirmed'
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col space-y-2 md:items-end">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleOpenConfirmModal(booking)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                      >
                        Confirmă
                      </button>
                      <button
                        onClick={() => handleReject(booking)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                      >
                        Respinge
                      </button>
                      <a
                        href={`tel:${booking.profiles?.phone}`}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-block"
                      >
                        Sună
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <Dialog open={confirmModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-violet-300">
              Confirmă Rezervarea
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Selectați data și ora pentru a confirma rezervarea. Este obligatoriu să alegeți o dată și oră validă.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedBookingForAction && (
              <>
                <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-yellow-500">
                  <h3 className="font-semibold text-yellow-400 mb-2">Cererea Clientului</h3>
                  <p className="text-gray-300">Client: {selectedBookingForAction.profiles?.full_name}</p>
                  <p className="text-gray-300">Serviciu: {selectedBookingForAction.service_type}</p>
                  <p className="text-gray-300">Data dorită: {selectedBookingForAction.requested_date_text || 'Nu a specificat'}</p>
                  <p className="text-gray-300">Ora preferată: {selectedBookingForAction.requested_time_text || 'Nu a specificat'}</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-violet-300">Selectare Dată & Oră</h3>
                  <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:space-x-6">
                    <div className="w-full md:w-1/2">
                      <div className="flex items-center mb-3">
                        <CalendarIcon className="mr-2 h-5 w-5 text-violet-400" />
                        <span className="font-medium text-violet-200">Selectați Data</span>
                      </div>
                      <div className="flex justify-center">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={isDateDisabled}
                          className="rounded-md border border-gray-600 bg-gray-800 text-violet-200 [&_.rdp-day]:text-violet-200 [&_.rdp-day_selected]:bg-violet-600 [&_.rdp-day_selected]:text-white [&_.rdp-day:hover]:bg-violet-600/20"
                        />
                      </div>
                    </div>

                    <div className="w-full md:w-1/2">
                      <div className="flex items-center mb-3">
                        <Clock className="mr-2 h-5 w-5 text-violet-400" />
                        <span className="font-medium text-violet-200">Selectați Ora</span>
                      </div>
                      <Select value={selectedTime} onValueChange={setSelectedTime}>
                        <SelectTrigger className="bg-gray-800 text-white border-gray-600">
                          <SelectValue placeholder="Selectați o oră" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 text-white border-gray-600">
                          {getAvailableHoursForSelectedDate().map((hour) => (
                            <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedDate && getAvailableHoursForSelectedDate().length === 0 && (
                        <p className="text-violet-300 text-sm mt-2">
                          Nu există intervale orare disponibile pentru această dată.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={isSaving}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Anulează
            </Button>
            <Button
              onClick={handleSaveConfirm}
              disabled={isSaving || !selectedDate || !selectedTime}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isSaving ? 'Se confirmă...' : 'Confirmă'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Confirmari;
