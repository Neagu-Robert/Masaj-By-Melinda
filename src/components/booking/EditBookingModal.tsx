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
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

const allServices = [
  "Masaj de relaxare",
  "Masaj terapeutic",
  "Masaj de drenaj limfatic",
  "Masaj anticelulitic",
  "Masaj facial",
  "Masaj cu pietre vulcanice",
  "Masaj cu bete de bambus",
  "Termocuverta Treatment",
  "40Khz Cavitation Body Remodeling",
  "Electrostimulation Treatment",
  "TECAR Radiofrequency"
];

const HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

export default function EditBookingModal({ open, onClose, booking, onBookingUpdated }) {
  const [serviceType, setServiceType] = useState("");
  const [bookingDate, setBookingDate] = useState<Date | undefined>();
  const [bookingTime, setBookingTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [allBookings, setAllBookings] = useState([]);

  const { availabilities, fetchAvailabilities } = useAvailabilities();

  useEffect(() => {
    const from = format(new Date(), 'yyyy-MM-dd');
    const to = format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd');
    
    const fetchAllBookings = async () => {
      const { data } = await supabase.from('bookings').select('*').gte('booking_date', from).lte('booking_date', to);
      if (data) setAllBookings(data);
    };

    if (booking) {
      setServiceType(booking.service_type);
      setBookingDate(new Date(booking.booking_date));
      setBookingTime(booking.booking_time.slice(0, 5));
    }

    if (open) {
      fetchAvailabilities(from, to);
      fetchAllBookings();
    }
  }, [booking, open]);

  useEffect(() => {
    const newAvailMap: Record<string, Record<string, boolean>> = {};
    availabilities.forEach((row) => {
      const key = row.date;
      if (!newAvailMap[key]) newAvailMap[key] = {};
      newAvailMap[key][row.hour.slice(0,5)] = row.is_available;
    });
    setAvailabilityMap(newAvailMap);
  }, [availabilities]);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("bookings")
      .update({
        service_type: serviceType,
        booking_date: bookingDate ? format(bookingDate, 'yyyy-MM-dd') : undefined,
        booking_time: `${bookingTime}:00`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id);
    
    if (error) {
      console.error("Failed to update booking:", error);
    } else {
      onBookingUpdated();
      onClose();
    }
    setIsSaving(false);
  };

  const isDayAvailable = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    const dayAvail = availabilityMap[key];
    if (!dayAvail) return true;
    return HOURS.some(h => dayAvail[h] !== false);
  };

  const getScheduledHoursForDate = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    const dayAvail = availabilityMap[key];
    if (!dayAvail) return HOURS; // If no specific availability, all hours are considered available
    return HOURS.filter(h => dayAvail[h] !== false);
  };

  const getAvailableHoursForDate = (date: Date | undefined) => {
    if (!date) return [];
    const scheduledHours = getScheduledHoursForDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const bookedHours = allBookings
      .filter(b => b.booking_date === dateStr && b.id !== booking.id) // Exclude current booking
      .map(b => b.booking_time.slice(0, 5));

    return scheduledHours.filter(h => !bookedHours.includes(h));
  };
  
  const availableHours = getAvailableHoursForDate(bookingDate);

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>
            Make changes to your booking here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="service-type" className="text-right">Service</Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger className="col-span-3 bg-gray-700 border-gray-600">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 text-white border-gray-600">
                {allServices.map(service => (
                  <SelectItem key={service} value={service} className="hover:bg-gray-700">{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="booking-date" className="text-right">Date</Label>
            <Calendar
              mode="single"
              selected={bookingDate}
              onSelect={(date) => {
                setBookingDate(date);
                setBookingTime(""); // Reset time when date changes
              }}
              className="col-span-3 rounded-md border"
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (date < today) return true;
                
                // A day is only available if it has at least one open slot
                const hours = getAvailableHoursForDate(date);
                return hours.length === 0;
              }}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="booking-time" className="text-right">Time</Label>
            <Select value={bookingTime} onValueChange={setBookingTime} disabled={!bookingDate}>
              <SelectTrigger className="col-span-3 bg-gray-700 border-gray-600">
                <SelectValue placeholder="Select a time" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 text-white border-gray-600">
                {availableHours.map(hour => (
                  <SelectItem key={hour} value={hour} className="hover:bg-gray-700">{hour}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 