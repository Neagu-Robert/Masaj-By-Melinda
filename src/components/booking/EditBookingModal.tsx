import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useAvailabilities } from "@/contexts/AvailabilitiesContext";
import { useServices } from "@/contexts/ServicesContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';
import { useBookingNotifications } from "@/services/notifications/hooks";
import {
  formatDateForDB,
  formatRequestedDateText,
  fetchBookedTimeSlots,
  getTomorrow,
  checkForDoubleBooking,
  checkForHourBookingConflict,
  validateBookingData,
  getAvailableTimeSlotsForDate,
  combineHourAndMinute,
  normalizeHourSlot,
  getMinutePart,
  isHourSlotBooked,
  isHourSlotUnavailable,
  MINUTE_OPTIONS,
} from "@/lib/booking-utils";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function EditBookingModal({ open, onClose, booking, onBookingUpdated }) {
  const { toast } = useToast();
  const [serviceType, setServiceType] = useState("");
  const [bookingDate, setBookingDate] = useState<Date | undefined>();
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [isSaving, setIsSaving] = useState(false);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);
  const [userDetails, setUserDetails] = useState<{ email: string; phone: string; fullName: string } | null>(null);
  const [error, setError] = useState("");
  const [originalDate, setOriginalDate] = useState<string>('');
  const [originalTime, setOriginalTime] = useState<string>('');

  const bookingTime = selectedHour && selectedMinute
    ? combineHourAndMinute(selectedHour, selectedMinute)
    : '';

  const resetForm = () => {
    if (booking) {
      setServiceType(booking.service_type || "");
      setBookingDate(booking.booking_date ? new Date(booking.booking_date) : undefined);
      if (booking.booking_time) {
        setSelectedHour(normalizeHourSlot(booking.booking_time));
        setSelectedMinute(getMinutePart(booking.booking_time));
      } else {
        setSelectedHour("");
        setSelectedMinute("00");
      }
    } else {
      setServiceType("");
      setBookingDate(undefined);
      setSelectedHour("");
      setSelectedMinute("00");
    }
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const { availabilities, fetchAvailabilities } = useAvailabilities();
  const { services, getServiceByName } = useServices();
  const { sendBookingUpdateProfile } = useBookingNotifications();

  useEffect(() => {
    const from = format(new Date(), 'yyyy-MM-dd');
    const to = format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd');

    const fetchUserDetails = async () => {
      if (booking?.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, email')
          .eq('id', booking.user_id)
          .single();

        if (profile) {
          setUserDetails({
            email: profile.email || '',
            phone: profile.phone || '',
            fullName: profile.full_name || `${booking.first_name} ${booking.last_name}`
          });
        }
      } else {
        setUserDetails({
          email: '',
          phone: booking?.phone_number || '',
          fullName: `${booking?.first_name || ''} ${booking?.last_name || ''}`
        });
      }
    };

    fetchUserDetails();
    fetchAvailabilities(from, to);
  }, [booking, fetchAvailabilities]);

  useEffect(() => {
    if (open && booking) {
      resetForm();
      setOriginalDate(booking.booking_date || '');
      setOriginalTime(booking.booking_time ? booking.booking_time.toString().slice(0, 5) : '');
    }
  }, [open, booking]);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!bookingDate) {
        setBookedTimeSlots([]);
        return;
      }
      try {
        const booked = await fetchBookedTimeSlots(bookingDate);
        setBookedTimeSlots(booked);
      } catch (err) {
        console.error('Error fetching booked time slots:', err);
        setBookedTimeSlots([]);
      }
    };
    fetchBookedSlots();
  }, [bookingDate]);

  const handleSave = async () => {
    setError("");

    if (!selectedHour) {
      setError('Vă rugăm să selectați o oră');
      return;
    }

    const validation = validateBookingData(bookingDate, bookingTime, serviceType);
    if (!validation.isValid) {
      setError(validation.error || 'Date de rezervare invalide');
      return;
    }

    const doubleBookingCheck = await checkForDoubleBooking(
      bookingDate!,
      bookingTime,
      booking?.id
    );

    if (doubleBookingCheck.isDoubleBooked) {
      setError(doubleBookingCheck.error || 'Acest interval orar este deja rezervat');
      return;
    }

    const hourConflictCheck = await checkForHourBookingConflict(
      bookingDate!,
      bookingTime,
      booking?.id
    );

    if (hourConflictCheck.hasConflict) {
      setError(hourConflictCheck.error || 'Acest interval orar este deja rezervat');
      return;
    }

    setIsSaving(true);
    try {
      const serviceDetails = getServiceByName(serviceType);
      const serviceId = serviceDetails?.id || null;

      const dateChanged = formatDateForDB(bookingDate!) !== originalDate;
      const timeChanged = bookingTime !== originalTime;
      const dateOrTimeChanged = dateChanged || timeChanged;

      const updatePayload = dateOrTimeChanged
        ? {
            service_type: serviceType,
            service_id: serviceId,
            status: 'unconfirmed' as const,
            requested_date_text: formatRequestedDateText(bookingDate!),
            requested_time_text: bookingTime,
            booking_date: null,
            booking_time: null,
          }
        : {
            service_type: serviceType,
            service_id: serviceId,
            status: 'confirmed' as const,
          };

      const { error: updateError } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', booking.id);

      if (updateError) {
        setError('Eroare la actualizarea rezervării: ' + updateError.message);
        return;
      }

      if (booking.user_id && userDetails) {
        try {
          if (dateOrTimeChanged) {
            await sendBookingUpdateProfile({
              bookingId: booking.id,
              userId: booking.user_id,
              userName: userDetails.fullName,
              userEmail: userDetails.email,
              userPhone: userDetails.phone,
              serviceName: serviceType,
              serviceId: serviceId,
              serviceProvider: 'Melinda',
              bookingDate: bookingDate!,
              bookingTime: bookingTime,
              duration: serviceDetails?.duration || 60,
              price: serviceDetails?.price || 140.00,
              status: 'unconfirmed'
            });

            toast({
              title: "Modificări Salvate",
              description: "Modificările de dată/oră necesită aprobare. Veți fi notificat când rezervarea este confirmată.",
            });
          } else {
            await sendBookingUpdateProfile({
              bookingId: booking.id,
              userId: booking.user_id,
              userName: userDetails.fullName,
              userEmail: userDetails.email,
              userPhone: userDetails.phone,
              serviceName: serviceType,
              serviceId: serviceId,
              serviceProvider: 'Melinda',
              bookingDate: bookingDate!,
              bookingTime: bookingTime,
              duration: serviceDetails?.duration || 60,
              price: serviceDetails?.price || 140.00,
              status: 'confirmed'
            });

            toast({
              title: "Rezervare Actualizată",
              description: "Rezervarea a fost actualizată cu succes.",
            });
          }
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
        }
      }

      onBookingUpdated();
      handleClose();
    } catch (err) {
      console.error('Error updating booking:', err);
      setError('A apărut o eroare neașteptată la actualizarea rezervării.');
    } finally {
      setIsSaving(false);
    }
  };

  const getAvailableHoursForSelectedDate = () => {
    if (!bookingDate) return [];

    const formattedDate = formatDateForDB(bookingDate);

    const unavailableHours = availabilities
      .filter(a => a.date === formattedDate && !a.is_available)
      .map(a => a.hour.slice(0, 5));

    const baseTimeSlots = getAvailableTimeSlotsForDate(bookingDate);

    const slotsForBlocking = booking?.booking_time
      ? bookedTimeSlots.filter(
          (t) => t.toString().slice(0, 5) !== booking.booking_time.toString().slice(0, 5)
        )
      : bookedTimeSlots;

    return baseTimeSlots.filter(hour => {
      const isBooked = isHourSlotBooked(hour, slotsForBlocking);
      const isUnavailable = isHourSlotUnavailable(hour, unavailableHours);
      return !isBooked && !isUnavailable;
    });
  };

  const isDateDisabled = (date: Date) => {
    const tomorrow = getTomorrow();
    const dayOfWeek = date.getDay();

    if (date < tomorrow) return true;
    if (dayOfWeek === 0) return true;

    return false;
  };

  const getOriginalBookingTime = () => {
    if (!booking?.booking_time) return '';
    return booking.booking_time.toString().slice(0, 5);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-violet-300">Editează Rezervarea</DialogTitle>
          <DialogDescription className="text-gray-400">
            Modificați serviciul, data sau ora pentru această rezervare și salvați modificările.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name" className="text-violet-200">Prenume</Label>
              <Input
                id="first_name"
                value={booking?.first_name || ''}
                disabled
                className="bg-gray-700 text-gray-400 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="last_name" className="text-violet-200">Nume</Label>
              <Input
                id="last_name"
                value={booking?.last_name || ''}
                disabled
                className="bg-gray-700 text-gray-400 border-gray-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone_number" className="text-violet-200">Număr de Telefon</Label>
              <Input
                id="phone_number"
                value={booking?.phone_number || ''}
                disabled
                className="bg-gray-700 text-gray-400 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="service_type" className="text-violet-200">Tip de Serviciu</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger className="bg-gray-800 text-white border-gray-600">
                  <SelectValue placeholder="Selectați un serviciu" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-600">
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.name}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-violet-300">Selectare Dată și Oră</h3>
            <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:space-x-6">
              <div className="w-full md:w-1/2">
                <div className="flex items-center mb-3">
                  <CalendarIcon className="mr-2 h-5 w-5 text-violet-400" />
                  <span className="font-medium text-violet-200">Selectați Data</span>
                </div>
                <Calendar
                  mode="single"
                  selected={bookingDate}
                  onSelect={setBookingDate}
                  disabled={isDateDisabled}
                  className="rounded-md border border-gray-600 bg-gray-800 text-violet-200 [&_.rdp-day]:text-violet-200 [&_.rdp-day_selected]:bg-violet-600 [&_.rdp-day_selected]:text-white [&_.rdp-day:hover]:bg-violet-600/20"
                />
              </div>

              <div className="w-full md:w-1/2">
                <div className="flex items-center mb-3">
                  <Clock className="mr-2 h-5 w-5 text-violet-400" />
                  <span className="font-medium text-violet-200">Selectați Ora</span>
                </div>
                {getOriginalBookingTime() && (
                  <p className="text-violet-400 text-sm mb-2">
                    Ora originală: <span className="font-semibold">{getOriginalBookingTime()}</span>
                  </p>
                )}
                <div className="flex gap-3">
                  <Select value={selectedHour} onValueChange={setSelectedHour}>
                    <SelectTrigger className="bg-gray-800 text-white border-gray-600 flex-1">
                      <SelectValue placeholder="Oră" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 text-white border-gray-600">
                      {getAvailableHoursForSelectedDate().map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedMinute}
                    onValueChange={setSelectedMinute}
                    disabled={!selectedHour}
                  >
                    <SelectTrigger className="bg-gray-800 text-white border-gray-600 w-28">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 text-white border-gray-600 max-h-60">
                      {MINUTE_OPTIONS.map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          :{minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {bookingDate && getAvailableHoursForSelectedDate().length === 0 && (
                  <p className="text-violet-300 text-sm mt-2">
                    Nu există intervale orare disponibile pentru această dată.
                  </p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} className="border-gray-600 text-violet-800 hover:bg-gray-700">
              Anulează
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-violet-600 hover:bg-violet-700 text-white">
              {isSaving ? 'Se salvează...' : 'Salvează Modificările'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
