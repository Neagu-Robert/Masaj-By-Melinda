import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { getNotificationPreferences, saveNotificationPreferences } from '@/services/notifications/preferencesService';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationPreferencesProps {
  userId: string;
  userRole: string;
}

export default function NotificationPreferences({ userId, userRole }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState({
    bookingCreationEnabled: true,
    bookingUpdateEnabled: true,
    bookingCancellationEnabled: true,
    passwordChangeEnabled: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      setLoading(true);
      try {
        const userPreferences = await getNotificationPreferences(userId);
        if (userPreferences) {
          setPreferences({
            bookingCreationEnabled: userPreferences.bookingCreationEnabled,
            bookingUpdateEnabled: userPreferences.bookingUpdateEnabled,
            bookingCancellationEnabled: userPreferences.bookingCancellationEnabled,
            passwordChangeEnabled: userPreferences.passwordChangeEnabled
          });
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await saveNotificationPreferences(userId, preferences);
      if (success) {
        toast({
          title: "Preferences saved",
          description: "Your notification preferences have been updated successfully."
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save notification preferences. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "An error occurred while saving preferences.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getChannelLabel = () => {
    return userRole === 'admin' ? 'SMS' : 'Email';
  };

  if (loading) {
    return <div className="text-gray-400">Loading notification preferences...</div>;
  }

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg">
      <h3 className="text-xl font-semibold mb-4 text-violet-300">
        Notification Preferences ({getChannelLabel()})
      </h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="booking-creation"
            checked={preferences.bookingCreationEnabled}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, bookingCreationEnabled: !!checked }))
            }
          />
          <Label htmlFor="booking-creation" className="text-white">
            Booking creation
          </Label>
        </div>
        
        <div className="flex items-center space-x-3">
          <Checkbox
            id="booking-update"
            checked={preferences.bookingUpdateEnabled}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, bookingUpdateEnabled: !!checked }))
            }
          />
          <Label htmlFor="booking-update" className="text-white">
            Booking update
          </Label>
        </div>
        
        <div className="flex items-center space-x-3">
          <Checkbox
            id="booking-cancellation"
            checked={preferences.bookingCancellationEnabled}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, bookingCancellationEnabled: !!checked }))
            }
          />
          <Label htmlFor="booking-cancellation" className="text-white">
            Booking cancellation
          </Label>
        </div>
        
        <div className="flex items-center space-x-3">
          <Checkbox
            id="password-change"
            checked={preferences.passwordChangeEnabled}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, passwordChangeEnabled: !!checked }))
            }
          />
          <Label htmlFor="password-change" className="text-white">
            Password changes
          </Label>
        </div>
        
        <div className="pt-4">
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>
    </div>
  );
} 