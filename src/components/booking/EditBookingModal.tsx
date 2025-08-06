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
  validateBookingData,
  getAvailableTimeSlotsForDate
} from "@/lib/booking-utils";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

export default function EditBookingModal({ open, onClose, booking, onBookingUpdated }) {
  const [serviceType, setServiceType] = useState("");
  const [bookingDate, setBookingDate] = useState<Date | undefined>();
  const [bookingTime, setBookingTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);
  const [userDetails, setUserDetails] = useState<{ email: string; phone: string; fullName: string } | null>(null);
  const [error, setError] = useState("");

  // Function to reset form to original booking values
  const resetForm = () => {
    if (booking) {
      setServiceType(booking.service_type || "");
      setBookingDate(booking.booking_date ? new Date(booking.booking_date) : undefined);
      setBookingTime(booking.booking_time || "");
    } else {
      setServiceType("");
      setBookingDate(undefined);
      setBookingTime("");
    }
    setError("");
  };

  // Handle modal close with reset
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
    if (open && booking) {
      resetForm();
    }
  }, [open, booking]);

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
      handleClose();
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
    
    // Get base time slots based on business rules
    const baseTimeSlots = getAvailableTimeSlotsForDate(bookingDate);
    
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

  // Get original booking time for display
  const getOriginalBookingTime = () => {
    if (!booking) return '';
    return booking.booking_time || '';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-violet-300">Edit Booking</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name" className="text-violet-200">First Name</Label>
              <Input
                id="first_name"
                value={booking?.first_name || ''}
                disabled
                className="bg-gray-700 text-gray-400 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="last_name" className="text-violet-200">Last Name</Label>
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
              <Label htmlFor="phone_number" className="text-violet-200">Phone Number</Label>
              <Input
                id="phone_number"
                value={booking?.phone_number || ''}
                disabled
                className="bg-gray-700 text-gray-400 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="service_type" className="text-violet-200">Service Type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger className="bg-gray-800 text-white border-gray-600">
                  <SelectValue placeholder="Select a service" />
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
            <h3 className="text-lg font-semibold text-violet-300">Date & Time Selection</h3>
            <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:space-x-6">
              {/* Calendar Section */}
              <div className="w-full md:w-1/2">
                <div className="flex items-center mb-3">
                  <CalendarIcon className="mr-2 h-5 w-5 text-violet-400" />
                  <span className="font-medium text-violet-200">Select Date</span>
                </div>
                <Calendar
                  mode="single"
                  selected={bookingDate}
                  onSelect={setBookingDate}
                  disabled={isDateDisabled}
                  className="rounded-md border border-gray-600 bg-gray-800 text-violet-200 [&_.rdp-day]:text-violet-200 [&_.rdp-day_selected]:bg-violet-600 [&_.rdp-day_selected]:text-white [&_.rdp-day:hover]:bg-violet-600/20"
                />
              </div>
              
              {/* Time Selection Section */}
              <div className="w-full md:w-1/2">
                <div className="flex items-center mb-3">
                  <Clock className="mr-2 h-5 w-5 text-violet-400" />
                  <span className="font-medium text-violet-200">Select Time</span>
                </div>
                {getOriginalBookingTime() && (
                  <p className="text-violet-400 text-sm mb-2">
                    Original time: <span className="font-semibold">{getOriginalBookingTime()}</span>
                  </p>
                )}
                <Select value={bookingTime} onValueChange={setBookingTime}>
                  <SelectTrigger className="bg-gray-800 text-white border-gray-600">
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white border-gray-600">
                    {getAvailableHoursForSelectedDate().map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {bookingDate && getAvailableHoursForSelectedDate().length === 0 && (
                  <p className="text-violet-300 text-sm mt-2">
                    No available time slots for this date.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} className="border-gray-600 text-violet-800 hover:bg-gray-700">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700 text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 