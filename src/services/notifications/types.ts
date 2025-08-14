// Notification Types

export type NotificationType = 
  | 'reminder'
  | 'booking_created_customer'
  | 'booking_updated_profile'
  | 'booking_cancelled_profile'
  | 'recurring_created_profile'
  | 'recurring_cancelled_profile'
  | 'recurring_created_admin'
  | 'recurring_cancelled_admin'
  | 'booking_created_admin'
  | 'booking_updated_admin'
  | 'booking_cancelled_admin'
  | 'password_changed'
  | 'password_reset_requested';

export type NotificationChannel = 'email' | 'sms';

// New interface for database preferences
export interface NotificationPreferences {
  id: string;
  user_id: string;
  booking_creation_enabled: boolean;
  booking_update_enabled: boolean;
  booking_cancellation_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Updated interface for application use
export interface NotificationPreference {
  userId: string;
  bookingCreationEnabled: boolean;
  bookingUpdateEnabled: boolean;
  bookingCancellationEnabled: boolean;
  reminderEnabled: boolean;
  passwordChangeEnabled: boolean;
}

export interface NotificationRecipient {
  userId: string | null; // Allow null for demo purposes
  email: string;
  phone: string;
  name: string;
}

export interface BookingNotificationData {
  bookingId: string;
  userId: string | null; // Allow null for demo purposes
  userName: string;
  userEmail: string;
  userPhone: string;
  serviceName: string;
  serviceId?: number | null; // New field for services table reference
  dateTime: string;
  duration: number;
  price: number;
  status: string;
  location?: string;
  notes?: string;
}

export interface NotificationPayload {
  type: NotificationType;
  recipient: NotificationRecipient;
  data: BookingNotificationData;
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: Error;
  timestamp: number;
  details?: any; // Additional details for debugging
}

export interface NotificationLogEntry {
  notificationType: NotificationType;
  channel: NotificationChannel;
  recipientId: string | null; // Allow null for demo purposes
  recipientEmail?: string;
  recipientPhone?: string;
  success: boolean;
  error?: string;
  messageId?: string;
  sentAt: string;
  data?: any;
  retryCount?: number;
}

export interface NotificationTemplate {
  subject: string;
  html: string;
  text: string;
} 