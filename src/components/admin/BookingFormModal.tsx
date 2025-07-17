import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useBookings } from "../../contexts/BookingsContext";
import { toast } from "@/components/ui/use-toast";

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
    if (booking) {
      // Always include user_id in the update to preserve join
      await updateBooking(booking.id, { ...values, user_id: booking.user_id });
      toast({ title: "Booking updated" });
      onClose();
    } else {
      // For new bookings, if booking.user_id is available, use it (fallback for admin-created bookings)
      await addBooking({ ...values, ...(booking?.user_id ? { user_id: booking.user_id } : {}) });
      toast({ title: "Booking created" });
      onClose();
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
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded">{booking ? "Update" : "Create"}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 