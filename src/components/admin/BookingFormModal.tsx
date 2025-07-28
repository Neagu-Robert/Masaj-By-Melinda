import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useBookings } from "../../contexts/BookingsContext";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { logAdminAction } from "@/lib/audit-logger";
import { supabase } from "@/integrations/supabase/client";
import { useBookingNotifications } from "@/services/notifications/hooks";

// Service durations in minutes (default if not specified)
const SERVICE_DURATIONS = {
  'Masaj de relaxare': 60,
  'Masaj terapeutic': 60,
  'Masaj de drenaj limfatic': 60,
  'Masaj anticelulitic': 60,
  'Masaj facial': 45,
  'Masaj cu pietre vulcanice': 75,
  'Masaj cu bete de bambus': 75,
  'Termocuverta Treatment': 60,
  '40Khz Cavitation Body Remodeling': 45,
  'Electrostimulation Treatment': 45,
  'TECAR Radiofrequency': 60,
  // Default duration
  'default': 60
};

// Service prices in RON (default if not specified)
const SERVICE_PRICES = {
  'Masaj de relaxare': 150,
  'Masaj terapeutic': 170,
  'Masaj de drenaj limfatic': 180,
  'Masaj anticelulitic': 180,
  'Masaj facial': 120,
  'Masaj cu pietre vulcanice': 200,
  'Masaj cu bete de bambus': 200,
  'Termocuverta Treatment': 180,
  '40Khz Cavitation Body Remodeling': 250,
  'Electrostimulation Treatment': 200,
  'TECAR Radiofrequency': 250,
  // Default price
  'default': 150
};

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
  const { user: adminUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sendBookingConfirmation, sendBookingUpdate } = useBookingNotifications();

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
    } else {
      form.reset({
        first_name: "",
        last_name: "",
        phone_number: "",
        service_type: "",
        booking_date: "",
        booking_time: "",
      });
    }
  }, [booking, open, form]);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (booking) {
        // Update existing booking
        const updatedData = { ...values, user_id: booking.user_id };
        await updateBooking(booking.id, updatedData);
        
        toast({ title: "Booking updated" });
        
        // Log the admin action
        await logAdminAction(
          adminUser?.id || "",
          "booking.update.admin",
          "booking",
          booking.id,
          `Updated booking for ${values.first_name} ${values.last_name}`
        );
        
        // Send notification if user has an email
        if (booking.user_id) {
          // Get user email
          const { data: userData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', booking.user_id)
            .single();
          
          if (userData?.email) {
            await sendBookingUpdate({
              bookingId: booking.id,
              userId: booking.user_id,
              userName: `${values.first_name} ${values.last_name}`,
              userEmail: userData.email,
              userPhone: values.phone_number,
              serviceName: values.service_type,
              serviceProvider: 'Melinda', // Default provider
              bookingDate: values.booking_date,
              bookingTime: values.booking_time,
              duration: SERVICE_DURATIONS[values.service_type] || SERVICE_DURATIONS.default,
              price: SERVICE_PRICES[values.service_type] || SERVICE_PRICES.default,
              status: 'updated'
            });
          }
        }
      } else {
        // Create new booking
        const bookingData = { 
          ...values, 
          ...(booking?.user_id ? { user_id: booking.user_id } : {}) 
        };
        
        // Since addBooking doesn't return the created booking, we need to insert directly
        // and then call addBooking to update the state
        const { data: newBooking, error } = await supabase
          .from('bookings')
          .insert([bookingData])
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        // Update the state using the context's addBooking
        await addBooking(bookingData);
        
        toast({ title: "Booking created" });
        
        // Log the admin action
        await logAdminAction(
          adminUser?.id || "",
          "booking.create.admin",
          "booking",
          newBooking?.id || '',
          `Created booking for ${values.first_name} ${values.last_name}`
        );
        
        // Send notification if user has an email
        if (newBooking?.user_id) {
          // Get user email
          const { data: userData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', newBooking.user_id)
            .single();
          
          if (userData?.email) {
            await sendBookingConfirmation({
              bookingId: newBooking.id,
              userId: newBooking.user_id,
              userName: `${values.first_name} ${values.last_name}`,
              userEmail: userData.email,
              userPhone: values.phone_number,
              serviceName: values.service_type,
              serviceProvider: 'Melinda', // Default provider
              bookingDate: values.booking_date,
              bookingTime: values.booking_time,
              duration: SERVICE_DURATIONS[values.service_type] || SERVICE_DURATIONS.default,
              price: SERVICE_PRICES[values.service_type] || SERVICE_PRICES.default,
              status: 'confirmed'
            });
          }
        }
      }
      onClose();
    } catch (error) {
      console.error('Error handling booking:', error);
      toast({ title: "Error", description: "Failed to process booking. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{booking ? "Edit Booking" : "Add Booking"}</DialogTitle>
          <DialogDescription>
            {booking ? "Update the details for this booking." : "Create a new booking by filling out the form."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input {...form.register("first_name", { required: true })} className="w-full bg-gray-700 border-gray-600 text-white rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input {...form.register("last_name", { required: true })} className="w-full bg-gray-700 border-gray-600 text-white rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input {...form.register("phone_number", { required: true })} className="w-full bg-gray-700 border-gray-600 text-white rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Service Type</label>
            <input {...form.register("service_type", { required: true })} className="w-full bg-gray-700 border-gray-600 text-white rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Booking Date</label>
            <input type="date" {...form.register("booking_date", { required: true })} className="w-full bg-gray-700 border-gray-600 text-white rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Booking Time</label>
            <input type="time" {...form.register("booking_time", { required: true })} className="w-full bg-gray-700 border-gray-600 text-white rounded p-2" />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-gray-600 text-white rounded"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-violet-600 text-white rounded"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : (booking ? "Update" : "Create")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 