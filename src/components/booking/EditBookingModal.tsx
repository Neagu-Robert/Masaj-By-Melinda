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

const HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

export default function EditBookingModal({ open, onClose, booking, onBookingUpdated }) {
  const [serviceType, setServiceType] = useState("");
  const [bookingDate, setBookingDate] = useState<Date | undefined>();
  const [bookingTime, setBookingTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);
  const [userDetails, setUserDetails] = useState<{ email: string; phone: string; fullName: string } | null>(null);

  const { availabilities, fetchAvailabilities } = useAvailabilities();
  const { services, getServiceByName } = useServices();
  const { sendBookingUpdateProfile } = useBookingNotifications();

  // Helper function to format date correctly
  const formatDateForDB = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
    const fetchBookedTimeSlots = async () => {
      if (!bookingDate) {
        setBookedTimeSlots([]);
        return;
      }
      const formattedDate = formatDateForDB(bookingDate);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('booking_time')
          .eq('booking_date', formattedDate);
        if (error) {
          console.error('Error fetching booked time slots:', error);
          setBookedTimeSlots([]);
          return;
        }
        const booked = (data ?? []).map(booking => {
          return (booking.booking_time || "").toString().slice(0, 5);
        });
        setBookedTimeSlots(booked);
        // If current selected time is now booked, reset it
        if (bookingTime && booked.includes(bookingTime)) {
          setBookingTime('');
        }
      } catch (error) {
        console.error('Error in fetching booked slots:', error);
        setBookedTimeSlots([]);
      }
    };
    fetchBookedTimeSlots();
  }, [bookingDate, bookingTime]);

  const handleSave = async () => {
    if (!serviceType || !bookingDate || !bookingTime) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setIsSaving(true);

      // Get service details
      const serviceDetails = getServiceByName(serviceType);
      const serviceId = serviceDetails?.id || null;

      // Check for double booking (excluding current booking)
      const formattedDate = formatDateForDB(bookingDate);
      const conflictingBooking = bookedTimeSlots.includes(bookingTime);

      if (conflictingBooking) {
        alert("This time slot is already booked. Please choose a different time.");
        return;
      }

      // Update the booking
      const { error } = await supabase
        .from('bookings')
        .update({
          service_type: serviceType,
          service_id: serviceId,
          booking_date: formattedDate,
          booking_time: bookingTime,
        })
        .eq('id', booking.id);

      if (error) {
        console.error('Error updating booking:', error);
        alert("Error updating booking");
        return;
      }

      // Send notification if user details are available
      if (userDetails) {
        try {
          await sendBookingUpdateProfile({
            bookingId: booking.id,
            userId: booking.user_id || '',
            userName: userDetails.fullName,
            userEmail: userDetails.email,
            userPhone: userDetails.phone,
            serviceName: serviceType,
            serviceId: serviceId,
            serviceProvider: 'Melinda',
            bookingDate: formattedDate,
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
      console.error('Error saving booking:', error);
      alert("Error saving booking");
    } finally {
      setIsSaving(false);
    }
  };

  const isDayAvailable = (date: Date) => {
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 6; // Monday to Saturday
  };

  const getAvailableHoursForDate = (date: Date | undefined) => {
    if (!date) return [];
    
    const formattedDate = formatDateForDB(date);
    
    // Get unavailable hours from availabilities context
    const unavailableHours = availabilities
      .filter(a => a.date === formattedDate && !a.is_available)
      .map(a => a.hour.slice(0, 5)); // Convert HH:MM:SS to HH:MM
    
    // Filter out both booked and unavailable hours
    return HOURS.filter(hour => 
      !bookedTimeSlots.includes(hour) && 
      !unavailableHours.includes(hour)
    );
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
                disabled={(date) => !isDayAvailable(date)}
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
                {bookingDate && getAvailableHoursForDate(bookingDate).map((hour) => (
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
} 