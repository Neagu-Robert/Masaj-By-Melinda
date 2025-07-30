import { useCallback } from 'react';
import { format } from 'date-fns';
import { notify } from './notificationService';
import { 
  NotificationPayload, 
  NotificationType,
  BookingNotificationData
} from './types';

/**
 * Hook for sending booking notifications
 */
export const useBookingNotifications = () => {
  /**
   * Send a booking notification
   */
  const sendBookingNotification = useCallback(async (
    type: NotificationType,
    bookingData: {
      bookingId: string;
      userId: string;
      userName: string;
      userEmail: string;
      userPhone?: string;
      serviceName: string;
      serviceId?: number | null; // New field for services table reference
      serviceProvider?: string;
      bookingDate: string | Date;
      bookingTime: string;
      duration: number;
      price: number;
      location?: string;
      notes?: string;
      status: string;
    }
  ) => {
    // Format the date and time for notification
    const dateTime = typeof bookingData.bookingDate === 'string' 
      ? `${bookingData.bookingDate} ${bookingData.bookingTime}`
      : `${format(bookingData.bookingDate, 'yyyy-MM-dd')} ${bookingData.bookingTime}`;

    const payload: NotificationPayload = {
      type,
      recipient: {
        userId: bookingData.userId,
        email: bookingData.userEmail,
        phone: bookingData.userPhone,
        name: bookingData.userName
      },
      data: {
        bookingId: bookingData.bookingId,
        userId: bookingData.userId,
        userName: bookingData.userName,
        userEmail: bookingData.userEmail,
        userPhone: bookingData.userPhone,
        serviceName: bookingData.serviceName,
        serviceId: bookingData.serviceId, // Include service ID
        serviceProvider: bookingData.serviceProvider,
        dateTime,
        duration: bookingData.duration,
        price: bookingData.price,
        location: bookingData.location,
        notes: bookingData.notes,
        status: bookingData.status
      } as BookingNotificationData
    };

    try {
      const results = await notify(payload);
      return results;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return [];
    }
  }, []);

  /**
   * Send a booking confirmation notification (customer booking)
   */
  const sendBookingConfirmation = useCallback((bookingData: {
    bookingId: string;
    userId: string;
    userName: string;
    userEmail: string;
    userPhone?: string;
    serviceName: string;
    serviceId?: number | null;
    serviceProvider?: string;
    bookingDate: string | Date;
    bookingTime: string;
    duration: number;
    price: number;
    location?: string;
    notes?: string;
    status: string;
  }) => {
    return sendBookingNotification('booking_created_customer', bookingData);
  }, [sendBookingNotification]);

  /**
   * Send a booking update notification (from profile page)
   */
  const sendBookingUpdateProfile = useCallback((bookingData: {
    bookingId: string;
    userId: string;
    userName: string;
    userEmail: string;
    userPhone?: string;
    serviceName: string;
    serviceId?: number | null;
    serviceProvider?: string;
    bookingDate: string | Date;
    bookingTime: string;
    duration: number;
    price: number;
    location?: string;
    notes?: string;
    status: string;
  }) => {
    return sendBookingNotification('booking_updated_profile', bookingData);
  }, [sendBookingNotification]);

  /**
   * Send a booking cancellation notification (from profile page)
   */
  const sendBookingCancellationProfile = useCallback((bookingData: {
    bookingId: string;
    userId: string;
    userName: string;
    userEmail: string;
    userPhone?: string;
    serviceName: string;
    serviceId?: number | null;
    serviceProvider?: string;
    bookingDate: string | Date;
    bookingTime: string;
    duration: number;
    price: number;
    location?: string;
    notes?: string;
    status: string;
  }) => {
    return sendBookingNotification('booking_cancelled_profile', bookingData);
  }, [sendBookingNotification]);

  /**
   * Send a booking confirmation notification (admin booking)
   */
  const sendBookingConfirmationAdmin = useCallback((bookingData: {
    bookingId: string;
    userId: string;
    userName: string;
    userEmail: string;
    userPhone?: string;
    serviceName: string;
    serviceId?: number | null;
    serviceProvider?: string;
    bookingDate: string | Date;
    bookingTime: string;
    duration: number;
    price: number;
    location?: string;
    notes?: string;
    status: string;
  }) => {
    return sendBookingNotification('booking_created_admin', bookingData);
  }, [sendBookingNotification]);

  /**
   * Send a booking update notification (admin update)
   */
  const sendBookingUpdateAdmin = useCallback((bookingData: {
    bookingId: string;
    userId: string;
    userName: string;
    userEmail: string;
    userPhone?: string;
    serviceName: string;
    serviceId?: number | null;
    serviceProvider?: string;
    bookingDate: string | Date;
    bookingTime: string;
    duration: number;
    price: number;
    location?: string;
    notes?: string;
    status: string;
  }) => {
    return sendBookingNotification('booking_updated_admin', bookingData);
  }, [sendBookingNotification]);

  /**
   * Send a booking cancellation notification (admin cancellation)
   */
  const sendBookingCancellationAdmin = useCallback((bookingData: {
    bookingId: string;
    userId: string;
    userName: string;
    userEmail: string;
    userPhone?: string;
    serviceName: string;
    serviceId?: number | null;
    serviceProvider?: string;
    bookingDate: string | Date;
    bookingTime: string;
    duration: number;
    price: number;
    location?: string;
    notes?: string;
    status: string;
  }) => {
    return sendBookingNotification('booking_cancelled_admin', bookingData);
  }, [sendBookingNotification]);

  /**
   * Send a booking reminder notification
   */
  const sendBookingReminder = useCallback((bookingData: {
    bookingId: string;
    userId: string;
    userName: string;
    userEmail: string;
    userPhone?: string;
    serviceName: string;
    serviceId?: number | null;
    serviceProvider?: string;
    bookingDate: string | Date;
    bookingTime: string;
    duration: number;
    price: number;
    location?: string;
    notes?: string;
    status: string;
  }) => {
    return sendBookingNotification('reminder', bookingData);
  }, [sendBookingNotification]);

  return {
    sendBookingNotification,
    sendBookingConfirmation,
    sendBookingReminder,
    sendBookingUpdateProfile,
    sendBookingCancellationProfile,
    sendBookingConfirmationAdmin,
    sendBookingUpdateAdmin,
    sendBookingCancellationAdmin
  };
}; 