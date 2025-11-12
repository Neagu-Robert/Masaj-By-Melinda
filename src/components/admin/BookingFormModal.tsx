import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useBookings } from "../../contexts/BookingsContext";
import { useServices } from "../../contexts/ServicesContext";
import { useAvailabilities } from "../../contexts/AvailabilitiesContext";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { logAdminAction } from "@/lib/audit-logger";
import { supabase } from "@/integrations/supabase/client";
import { useBookingNotifications } from "@/services/notifications/hooks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Clock } from "lucide-react";
import { 
  formatDateForDB, 
  checkForDoubleBooking, 
  validateBookingData,
  TIME_SLOTS,
  getTomorrow,
  fetchBookedTimeSlots,
  getAvailableTimeSlotsForDate
} from "@/lib/booking-utils";

interface BookingFormModalProps {
  open: boolean;
  onClose: () => void;
  booking: any;
}

type FormValues = {
  first_name: string;
  last_name: string;
  phone_number: string;
  service_type: string;
  booking_date: string;
  booking_time: string;
};

export default function BookingFormModal({ open, onClose, booking }: BookingFormModalProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      first_name: "",
      last_name: "",
      phone_number: "",
      service_type: "",
      booking_date: "",
      booking_time: "",
    },
  });
  const { addBooking, updateBooking } = useBookings();
  const { services, getServiceByName } = useServices();
  const { availabilities, fetchAvailabilities } = useAvailabilities();
  const { user: adminUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sendBookingConfirmationAdmin, sendBookingUpdateAdmin } = useBookingNotifications();

  // State for date/time selection - initialize with empty string to avoid controlled/uncontrolled issues
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);

  useEffect(() => {
    if (booking) {
      form.reset({
        first_name: booking.first_name,
        last_name: booking.last_name,
        phone_number: booking.phone_number,
        service_type: booking.service_type,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
      });
      // Set the selected date and time for editing
      if (booking.booking_date) {
        setSelectedDate(new Date(booking.booking_date));
      }
      if (booking.booking_time) {
        setSelectedTime(booking.booking_time);
      } else {
        setSelectedTime("");
      }
    } else {
      form.reset({
        first_name: "",
        last_name: "",
        phone_number: "",
        service_type: "",
        booking_date: "",
        booking_time: "",
      });
      setSelectedDate(undefined);
      setSelectedTime("");
    }
  }, [booking, open, form]);

  // Fetch booked time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      const fetchBookedSlots = async () => {
        const slots = await fetchBookedTimeSlots(selectedDate);
        setBookedTimeSlots(slots);
      };
      fetchBookedSlots();
    } else {
      setBookedTimeSlots([]);
    }
  }, [selectedDate]);

  // Fetch availabilities when date changes
  useEffect(() => {
    if (selectedDate) {
      const formattedDate = formatDateForDB(selectedDate);
      fetchAvailabilities(formattedDate, formattedDate);
    }
  }, [selectedDate, fetchAvailabilities]);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Get service details from the database
      const serviceDetails = getServiceByName(values.service_type);
      const serviceId = serviceDetails?.id || null;

      // Validate booking data
      const bookingDate = selectedDate || new Date(values.booking_date);
      const bookingTime = selectedTime || values.booking_time;
      const validation = validateBookingData(bookingDate, bookingTime, values.service_type);
      if (!validation.isValid) {
        toast({
          title: "Eroare de Validare",
          description: validation.error || "Vă rugăm să completați toate câmpurile obligatorii",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (booking) {
        // Update existing booking
        // Check for double booking (excluding current booking)
        const doubleBookingCheck = await checkForDoubleBooking(
          bookingDate, 
          bookingTime, 
          booking.id
        );
        
        if (doubleBookingCheck.isDoubleBooked) {
          toast({
            title: "Eroare Rezervare Dublă",
            description: doubleBookingCheck.error || "Acest interval orar este deja rezervat",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        const updatedBooking = {
          ...values,
          service_id: serviceId,
          booking_date: formatDateForDB(bookingDate),
          booking_time: bookingTime,
          status: 'confirmed' as const  // Admin updates are instantly confirmed
        };

        await updateBooking(booking.id, updatedBooking);

        // Log the admin booking update action
        await logAdminAction(
          adminUser?.id || '',
          'booking.update.admin',
          'booking',
          booking.id,
          `Admin a actualizat rezervarea pentru ${values.service_type} pe ${formatDateForDB(bookingDate)} la ${bookingTime}`
        );

        // Send admin notification for booking update
        try {
          await sendBookingUpdateAdmin({
            bookingId: booking.id,
            userId: booking.user_id || '',
            userName: `${values.first_name} ${values.last_name}`,
            userEmail: '',
            userPhone: values.phone_number,
            serviceName: values.service_type,
            serviceId: serviceId,
            serviceProvider: 'Melinda',
            bookingDate: formatDateForDB(bookingDate),
            bookingTime: bookingTime,
            duration: serviceDetails?.duration || 60,
            price: serviceDetails?.price || 140.00,
            status: 'actualizat'
          });
        } catch (notificationError) {
          console.error('Eroare la trimiterea notificării:', notificationError);
        }

        toast({
          title: "Rezervare Actualizată",
          description: "Rezervarea a fost actualizată cu succes.",
        });
      } else {
        // Create new booking
        // Check for double booking
        const doubleBookingCheck = await checkForDoubleBooking(bookingDate, bookingTime);
        
        if (doubleBookingCheck.isDoubleBooked) {
          toast({
            title: "Eroare Rezervare Dublă",
            description: doubleBookingCheck.error || "Acest interval orar este deja rezervat",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        const newBooking = {
          ...values,
          service_id: serviceId,
          booking_date: formatDateForDB(bookingDate),
          booking_time: bookingTime,
          status: 'confirmed' as const  // Admin bookings are instantly confirmed
        };

        await addBooking(newBooking);

        // Log the admin booking creation action
        await logAdminAction(
          adminUser?.id || '',
          'booking.create.admin',
          'booking',
          'new',
          `Admin a creat rezervare pentru ${values.service_type} pe ${formatDateForDB(bookingDate)} la ${bookingTime}`
        );

        // Send admin notification for new booking
        try {
          await sendBookingConfirmationAdmin({
            bookingId: 'new',
            userId: '',
            userName: `${values.first_name} ${values.last_name}`,
            userEmail: '',
            userPhone: values.phone_number,
            serviceName: values.service_type,
            serviceId: serviceId,
            serviceProvider: 'Melinda',
            bookingDate: formatDateForDB(bookingDate),
            bookingTime: bookingTime,
            duration: serviceDetails?.duration || 60,
            price: serviceDetails?.price || 140.00,
            status: 'confirmat'
          });
        } catch (notificationError) {
          console.error('Eroare la trimiterea notificării:', notificationError);
        }

        toast({
          title: "Rezervare Creată",
          description: "Rezervarea a fost creată cu succes.",
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving booking:', error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la salvarea rezervării.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available hours for the selected date
  const getAvailableHoursForSelectedDate = () => {
    if (!selectedDate) return [];
    
    const formattedDate = formatDateForDB(selectedDate);
    
    // Get unavailable hours from availabilities context
    const unavailableHours = availabilities
      .filter(a => a.date === formattedDate && !a.is_available)
      .map(a => a.hour.slice(0, 5)); // Convert HH:MM:SS to HH:MM
    
    // Get base time slots based on business rules
    const baseTimeSlots = getAvailableTimeSlotsForDate(selectedDate);
    
    // Filter out both booked and unavailable hours using proper normalization
    const availableHours = baseTimeSlots.filter(hour => {
      // Check if hour is booked
      const isBooked = bookedTimeSlots.some(
        (b) => b === hour || b.padStart(5, "0") === hour.padStart(5, "0") || 
               b.replace(/^0/, "") === hour.replace(/^0/, "")
      );
      
      // Check if hour is unavailable (blocked)
      const isUnavailable = unavailableHours.some(
        (u) => u === hour || u.padStart(5, "0") === hour.padStart(5, "0") || 
               u.replace(/^0/, "") === hour.replace(/^0/, "")
      );
      
      return !isBooked && !isUnavailable;
    });
    
    return availableHours;
  };

  // Check if a date should be disabled in the calendar
  const isDateDisabled = (date: Date) => {
    const tomorrow = getTomorrow();
    const dayOfWeek = date.getDay();
    
    // Disable dates before tomorrow
    if (date < tomorrow) {
      return true;
    }
    
    // Disable Sundays
    if (dayOfWeek === 0) {
      return true;
    }
    
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent showCloseButton={true} className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-violet-300">
            {booking ? 'Editează Rezervarea' : 'Creează Rezervare Nouă'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {booking
              ? 'Actualizați detaliile clientului, serviciul, data și ora pentru această rezervare.'
              : 'Furnizați detaliile clientului, selectați un serviciu și alegeți o dată și o oră.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name" className="text-violet-200">Prenume</Label>
              <Input
                id="first_name"
                {...form.register('first_name')}
                className="bg-gray-800 text-white border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="last_name" className="text-violet-200">Nume</Label>
              <Input
                id="last_name"
                {...form.register('last_name')}
                className="bg-gray-800 text-white border-gray-600"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone_number" className="text-violet-200">Număr de Telefon</Label>
              <Input
                id="phone_number"
                {...form.register('phone_number')}
                className="bg-gray-800 text-white border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="service_type" className="text-violet-200">Tip Serviciu</Label>
              <Select value={form.watch('service_type')} onValueChange={(value) => form.setValue('service_type', value)}>
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

          {/* Date and Time Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-violet-300">Selectare Dată & Oră</h3>
            <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:space-x-6">
              {/* Calendar Section */}
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
              
              {/* Time Selection Section */}
              <div className="w-full md:w-1/2">
                <div className="flex items-center mb-3">
                  <Clock className="mr-2 h-5 w-5 text-violet-400" />
                  <span className="font-medium text-violet-200">Selectați Ora</span>
                </div>
                {booking?.booking_time && (
                  <p className="text-violet-400 text-sm mb-2">
                    Ora originală: <span className="font-semibold">{booking.booking_time}</span>
                  </p>
                )}
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className="bg-gray-800 text-white border-gray-600">
                    <SelectValue placeholder="Selectați o oră" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white border-gray-600">
                    {selectedDate && getAvailableHoursForSelectedDate().map((hour) => (
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-gray-600 text-violet-800 hover:bg-gray-700">
              Anulează
            </Button>
            <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white">
              {booking ? 'Actualizează Rezervarea' : 'Creează Rezervare'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 