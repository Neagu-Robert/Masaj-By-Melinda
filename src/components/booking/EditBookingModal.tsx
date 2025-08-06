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
  TIME_SLOTS, 
  formatDateForDB, 
  fetchBookedTimeSlots, 
  isTimeSlotUnavailable,
  getAvailableHoursForDate,
  getTomorrow,
  checkForDoubleBooking,
  validateBookingData
} from "@/lib/booking-utils";

export default function EditBookingModal({ open, onClose, booking, onBookingUpdated }) {
  const [serviceType, setServiceType] = useState("");
  const [bookingDate, setBookingDate] = useState<Date | undefined>();
  const [bookingTime, setBookingTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);
  const [userDetails, setUserDetails] = useState<{ email: string; phone: string; fullName: string } | null>(null);
  const [error, setError] = useState("");

  const { availabilities, fetchAvailabilities } = useAvailabilities();
  const { services, getServiceByName } = useServices();
  const { sendBookingUpdateProfile } = useBookingNotifications();

  useEffect(() => {
    const from = format(new Date(), 'yyyy-MM-dd');
    const to = format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd');
    
    const fetchUserDetails = async () => {
      if (booking?.user_id) {
        // Get user profile
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
        // For bookings without user_id, use booking data
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
    if (booking) {
      setServiceType(booking.service_type || "");
      setBookingDate(booking.booking_date ? new Date(booking.booking_date) : undefined);
      setBookingTime(booking.booking_time || "");
    }
  }, [booking]);

  // Fetch booked slots each time bookingDate changes
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!bookingDate) {
        setBookedTimeSlots([]);
        return;
      }
      try {
        const booked = await fetchBookedTimeSlots(bookingDate);
        setBookedTimeSlots(booked);
        // If current booking time is now booked by someone else, clear it
        if (bookingTime && booked.includes(bookingTime) && booking?.booking_time !== bookingTime) {
          setBookingTime('');
        }
      } catch (error) {
        console.error('Error fetching booked time slots:', error);
        setBookedTimeSlots([]);
      }
    };
    fetchBookedSlots();
  }, [bookingDate, bookingTime, booking?.booking_time]);

  // Compute unavailable slots from availabilities context
  useEffect(() => {
    if (!bookingDate) return;
    
    const formattedDate = formatDateForDB(bookingDate);
    const slots: string[] = [];
    availabilities
      .filter(a => a.date === formattedDate)
      .forEach(a => {
        if (!a.is_available) {
          slots.push(a.hour.slice(0, 5));
        }
      });
    
    // If current booking time is now unavailable, clear it
    if (bookingTime && slots.includes(bookingTime) && booking?.booking_time !== bookingTime) {
      setBookingTime('');
    }
  }, [availabilities, bookingDate, bookingTime, booking?.booking_time]);

  const handleSave = async () => {
    setError("");
    
    // Validate booking data
    const validation = validateBookingData(bookingDate, bookingTime, serviceType);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid booking data');
      return;
    }

    // Check for double booking
    const doubleBookingCheck = await checkForDoubleBooking(
      bookingDate!, 
      bookingTime, 
      booking?.id
    );
    
    if (doubleBookingCheck.isDoubleBooked) {
      setError(doubleBookingCheck.error || 'This time slot is already booked');
      return;
    }

    setIsSaving(true);
    try {
      // Get service details from the database
      const serviceDetails = getServiceByName(serviceType);
      const serviceId = serviceDetails?.id || null;

      // Update the booking
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          service_type: serviceType,
          booking_date: formatDateForDB(bookingDate!),
          booking_time: bookingTime,
          service_id: serviceId,
        })
        .eq('id', booking.id);

      if (updateError) {
        setError('Failed to update booking: ' + updateError.message);
        return;
      }

      // Send notification if booking has a user
      if (booking.user_id && userDetails) {
        try {
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
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
        }
      }

      onBookingUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating booking:', error);
      setError('An unexpected error occurred while updating the booking.');
    } finally {
      setIsSaving(false);
    }
  };

  // Get available hours for the selected date
  const getAvailableHoursForSelectedDate = () => {
    if (!bookingDate) return [];
    
    const formattedDate = formatDateForDB(bookingDate);
    
    // Get unavailable hours from availabilities context
    const unavailableHours = availabilities
      .filter(a => a.date === formattedDate && !a.is_available)
      .map(a => a.hour.slice(0, 5)); // Convert HH:MM:SS to HH:MM
    
    // Filter out both booked and unavailable hours using proper normalization
    const availableHours = TIME_SLOTS.filter(hour => {
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

  // Get original booking time for display
  const getOriginalBookingTime = () => {
    if (!booking) return '';
    return booking.booking_time || '';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>
            Make changes to your booking here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <div className="text-red-500 text-sm mb-2">{error}</div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="service" className="text-right">
              Service
            </Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.filter(service => service.is_active).map((service) => (
                  <SelectItem key={service.id} value={service.name}>
                    {service.name} - {service.duration}min - {service.price} RON
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Date</Label>
            <div className="col-span-3">
              <Calendar
                mode="single"
                selected={bookingDate}
                onSelect={setBookingDate}
                disabled={(date) => date < getTomorrow()}
                className="rounded-md border"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              Time
              {getOriginalBookingTime() && (
                <span className="block text-xs text-gray-500 font-normal">
                  Original: {getOriginalBookingTime()}
                </span>
              )}
            </Label>
            <Select value={bookingTime} onValueChange={setBookingTime}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {bookingDate && getAvailableHoursForSelectedDate().map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 