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
      requestedDateText?: string | null; // Customer's free-text date preference
      requestedTimeText?: string | null; // Customer's free-text time preference
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
        requestedDateText: bookingData.requestedDateText,
        requestedTimeText: bookingData.requestedTimeText,
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
    requestedDateText?: string | null;
    requestedTimeText?: string | null;
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

  // Recurring created (profile)
  const sendRecurringCreatedProfile = useCallback((bookingData: {
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
    return sendBookingNotification('recurring_created_profile', bookingData as any);
  }, [sendBookingNotification]);

  // Recurring cancelled (profile)
  const sendRecurringCancelledProfile = useCallback((bookingData: {
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
    return sendBookingNotification('recurring_cancelled_profile', bookingData as any);
  }, [sendBookingNotification]);

  // Recurring created (admin)
  const sendRecurringCreatedAdmin = useCallback((bookingData: {
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
    return sendBookingNotification('recurring_created_admin', bookingData as any);
  }, [sendBookingNotification]);

  // Recurring cancelled (admin)
  const sendRecurringCancelledAdmin = useCallback((bookingData: {
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
    return sendBookingNotification('recurring_cancelled_admin', bookingData as any);
  }, [sendBookingNotification]);

  // Single instance cancelled (profile)
  const sendRecurringInstanceCancelledProfile = useCallback((bookingData: {
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
    return sendBookingNotification('recurring_instance_cancelled_profile', bookingData as any);
  }, [sendBookingNotification]);

  // Single instance cancelled (admin)
  const sendRecurringInstanceCancelledAdmin = useCallback((bookingData: {
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
    return sendBookingNotification('recurring_instance_cancelled_admin', bookingData as any);
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

  /**
   * Send a booking approval needed notification
   */
  const sendBookingApprovalNeeded = useCallback((bookingData: {
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
    requestedDateText?: string | null;
    requestedTimeText?: string | null;
    duration: number;
    price: number;
    location?: string;
    notes?: string;
    status: string;
  }) => {
    return sendBookingNotification('booking_approval_needed', bookingData);
  }, [sendBookingNotification]);

  /**
   * Send a booking confirmed by admin notification
   */
  const sendBookingConfirmedByAdmin = useCallback((bookingData: {
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
    requestedDateText?: string | null;
    requestedTimeText?: string | null;
    duration: number;
    price: number;
    location?: string;
    notes?: string;
    status: string;
  }) => {
    return sendBookingNotification('booking_confirmed_by_admin', bookingData);
  }, [sendBookingNotification]);

  /**
   * Send a booking rejected by admin notification
   */
  const sendBookingRejectedByAdmin = useCallback((bookingData: {
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
    return sendBookingNotification('booking_rejected_by_admin', bookingData);
  }, [sendBookingNotification]);

  /**
   * Send a booking suggestion notification
   */
  const sendBookingSuggestion = useCallback((bookingData: {
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
    notes?: string;  // Format: "suggested_date|suggested_time|token"
    status: string;
  }) => {
    return sendBookingNotification('booking_suggestion_sent', bookingData);
  }, [sendBookingNotification]);

  /**
   * Send a booking suggestion accepted notification
   */
  const sendBookingSuggestionAccepted = useCallback((bookingData: {
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
    return sendBookingNotification('booking_suggestion_accepted', bookingData);
  }, [sendBookingNotification]);

  /**
   * Send a booking suggestion declined notification
   */
  const sendBookingSuggestionDeclined = useCallback((bookingData: {
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
    return sendBookingNotification('booking_suggestion_declined', bookingData);
  }, [sendBookingNotification]);

  return {
    sendBookingNotification,
    sendBookingConfirmation,
    sendBookingReminder,
    sendBookingUpdateProfile,
    sendBookingCancellationProfile,
    sendBookingConfirmationAdmin,
    sendBookingUpdateAdmin,
    sendBookingCancellationAdmin,
    sendRecurringCreatedProfile,
    sendRecurringCancelledProfile,
    sendRecurringCreatedAdmin,
    sendRecurringCancelledAdmin,
    sendRecurringInstanceCancelledProfile,
    sendRecurringInstanceCancelledAdmin,
    sendBookingApprovalNeeded,
    sendBookingConfirmedByAdmin,
    sendBookingRejectedByAdmin,
    sendBookingSuggestion,
    sendBookingSuggestionAccepted,
    sendBookingSuggestionDeclined
  };
}; 