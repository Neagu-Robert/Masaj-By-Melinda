import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useBookings } from "../../contexts/BookingsContext";
import { useServices } from "../../contexts/ServicesContext";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { logAdminAction } from "@/lib/audit-logger";
import { supabase } from "@/integrations/supabase/client";
import { useBookingNotifications } from "@/services/notifications/hooks";

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
  const { user: adminUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sendBookingConfirmationAdmin, sendBookingUpdateAdmin } = useBookingNotifications();

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
      // Get service details from the database
      const serviceDetails = getServiceByName(values.service_type);
      const serviceId = serviceDetails?.id || null;

      if (booking) {
        // Update existing booking
        const updatedBooking = {
          ...booking,
          ...values,
          service_id: serviceId, // Add service_id to the booking
        };

        await updateBooking(booking.id, updatedBooking);

        // Log the admin booking update action
        await logAdminAction(
          adminUser?.id || '',
          'booking.update.admin',
          'booking',
          booking.id,
          `Admin updated booking for ${values.service_type} on ${values.booking_date} at ${values.booking_time}`
        );

        // Send notification if booking has a user
        if (booking.user_id) {
          try {
            // Get user details for notification
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', booking.user_id)
              .single();

            if (userProfile) {
              await sendBookingUpdateAdmin({
                bookingId: booking.id,
                userId: booking.user_id,
                userName: userProfile.full_name || `${values.first_name} ${values.last_name}`,
                userEmail: userProfile.email || '',
                userPhone: values.phone_number,
                serviceName: values.service_type,
                serviceId: serviceId,
                serviceProvider: 'Melinda',
                bookingDate: values.booking_date,
                bookingTime: values.booking_time,
                duration: serviceDetails?.duration || 60,
                price: serviceDetails?.price || 140.00,
                status: 'confirmed'
              });
            }
          } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
          }
        } else {
          // Send admin notification for booking without user
          try {
            await sendBookingUpdateAdmin({
              bookingId: booking.id,
              userId: '',
              userName: `${values.first_name} ${values.last_name}`,
              userEmail: '',
              userPhone: values.phone_number,
              serviceName: values.service_type,
              serviceId: serviceId,
              serviceProvider: 'Melinda',
              bookingDate: values.booking_date,
              bookingTime: values.booking_time,
              duration: serviceDetails?.duration || 60,
              price: serviceDetails?.price || 140.00,
              status: 'confirmed'
            });
          } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
          }
        }

        toast({
          title: "Booking Updated",
          description: "The booking has been updated successfully.",
        });
      } else {
        // Create new booking
        const newBooking = {
          ...values,
          service_id: serviceId, // Add service_id to the booking
        };

        await addBooking(newBooking);

        // Log the admin booking creation action
        await logAdminAction(
          adminUser?.id || '',
          'booking.create.admin',
          'booking',
          'new',
          `Admin created booking for ${values.service_type} on ${values.booking_date} at ${values.booking_time}`
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
            bookingDate: values.booking_date,
            bookingTime: values.booking_time,
            duration: serviceDetails?.duration || 60,
            price: serviceDetails?.price || 140.00,
            status: 'confirmed'
          });
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
        }

        toast({
          title: "Booking Created",
          description: "The booking has been created successfully.",
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving booking:', error);
      toast({
        title: "Error",
        description: "An error occurred while saving the booking.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {booking ? "Edit Booking" : "Create New Booking"}
          </DialogTitle>
          <DialogDescription>
            {booking
              ? "Make changes to the booking here."
              : "Fill in the details to create a new booking."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">First Name</label>
              <input
                {...form.register("first_name", { required: true })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Last Name</label>
              <input
                {...form.register("last_name", { required: true })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Phone Number</label>
            <input
              {...form.register("phone_number", { required: true })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Service Type</label>
            <select
              {...form.register("service_type", { required: true })}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a service</option>
              {services.filter(service => service.is_active).map((service) => (
                <option key={service.id} value={service.name}>
                  {service.name} - {service.duration}min - {service.price} RON
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Booking Date</label>
            <input
              type="date"
              {...form.register("booking_date", { required: true })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Booking Time</label>
            <input
              type="time"
              {...form.register("booking_time", { required: true })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : booking ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 