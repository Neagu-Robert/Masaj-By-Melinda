import { supabase } from '../../integrations/supabase/client';
import { NotificationPreferences, NotificationPreference } from './types';

export const getNotificationPreferences = async (userId: string): Promise<NotificationPreference | null> => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      userId: data.user_id,
      bookingCreationEnabled: data.booking_creation_enabled,
      bookingUpdateEnabled: data.booking_update_enabled,
      bookingCancellationEnabled: data.booking_cancellation_enabled
    };
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return null;
  }
};

export const saveNotificationPreferences = async (
  userId: string, 
  preferences: {
    bookingCreationEnabled: boolean;
    bookingUpdateEnabled: boolean;
    bookingCancellationEnabled: boolean;
  }
): Promise<boolean> => {
  try {
    // Check if preferences already exist
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Update existing preferences
      const { error } = await supabase
        .from('notification_preferences')
        .update({
          booking_creation_enabled: preferences.bookingCreationEnabled,
          booking_update_enabled: preferences.bookingUpdateEnabled,
          booking_cancellation_enabled: preferences.bookingCancellationEnabled,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating notification preferences:', error);
        return false;
      }
    } else {
      // Insert new preferences
      const { error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          booking_creation_enabled: preferences.bookingCreationEnabled,
          booking_update_enabled: preferences.bookingUpdateEnabled,
          booking_cancellation_enabled: preferences.bookingCancellationEnabled
        });

      if (error) {
        console.error('Error creating notification preferences:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    return false;
  }
}; 