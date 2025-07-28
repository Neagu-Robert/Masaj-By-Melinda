import { supabase } from '../../integrations/supabase/client';
import { NotificationLogEntry } from './types';

/**
 * Log a notification attempt to the database
 */
export const logNotification = async (logEntry: NotificationLogEntry): Promise<void> => {
  // Skip logging if user ID is null (for demo purposes)
  if (!logEntry.recipientId) {
    console.log('Skipping notification log for demo user');
    return;
  }

  try {
    const { error } = await supabase
      .from('notification_logs')
      .insert({
        notification_type: logEntry.notificationType,
        channel: logEntry.channel,
        recipient_id: logEntry.recipientId,
        recipient_email: logEntry.recipientEmail,
        recipient_phone: logEntry.recipientPhone,
        success: logEntry.success,
        error: logEntry.error,
        message_id: logEntry.messageId,
        sent_at: logEntry.sentAt,
        data: logEntry.data,
        retry_count: logEntry.retryCount || 0
      });

    if (error) {
      // Handle foreign key constraint error gracefully
      if (error.code === '23503' && error.message.includes('users')) {
        console.warn('User not found in database, but logging notification anyway:', logEntry.recipientId);
        // Try to insert without the foreign key constraint by using a different approach
        // or just log to console for demo purposes
        console.log('Notification log (demo):', {
          type: logEntry.notificationType,
          channel: logEntry.channel,
          recipient: logEntry.recipientId,
          success: logEntry.success,
          timestamp: logEntry.sentAt
        });
        return;
      }
      
      console.error('Error logging notification:', error);
    }
  } catch (error) {
    console.error('Error logging notification:', error);
  }
};

/**
 * Get notification logs for a specific user
 */
export const getUserNotificationLogs = async (userId: string): Promise<NotificationLogEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('recipient_id', userId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Error fetching notification logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching notification logs:', error);
    return [];
  }
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (): Promise<{
  total: number;
  successful: number;
  failed: number;
  byChannel: { email: number; sms: number };
}> => {
  try {
    const { data, error } = await supabase
      .from('notification_logs')
      .select('success, channel');

    if (error) {
      console.error('Error fetching notification stats:', error);
      return { total: 0, successful: 0, failed: 0, byChannel: { email: 0, sms: 0 } };
    }

    const logs = data || [];
    const successful = logs.filter(log => log.success).length;
    const failed = logs.filter(log => !log.success).length;
    const emailCount = logs.filter(log => log.channel === 'email').length;
    const smsCount = logs.filter(log => log.channel === 'sms').length;

    return {
      total: logs.length,
      successful,
      failed,
      byChannel: { email: emailCount, sms: smsCount }
    };
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return { total: 0, successful: 0, failed: 0, byChannel: { email: 0, sms: 0 } };
  }
}; 