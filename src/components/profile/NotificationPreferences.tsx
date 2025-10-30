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
    reminderEnabled: true,
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
            reminderEnabled: userPreferences.reminderEnabled,
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
          title: "Preferințe salvate",
          description: "Preferințele dumneavoastră de notificare au fost actualizate cu succes."
        });
      } else {
        toast({
          title: "Eroare",
          description: "Eroare la salvarea preferințelor de notificare. Vă rugăm să încercați din nou.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la salvarea preferințelor.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return <div className="text-gray-400">Se încarcă preferințele de notificare...</div>;
  }

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg">
      <h3 className="text-xl font-semibold mb-4 text-violet-300">
        Preferințe Notificări Email
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
            Creare rezervare
          </Label>
        </div>

        <div className="flex items-center space-x-3">
          <Checkbox
            id="booking-reminders"
            checked={preferences.reminderEnabled}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, reminderEnabled: !!checked }))
            }
          />
          <Label htmlFor="booking-reminders" className="text-white">
            Memento rezervare (email cu o zi înainte)
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
            Actualizare rezervare
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
            Anulare rezervare
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
            Schimbări de parolă și cereri de resetare
          </Label>
        </div>
        
        <div className="pt-4">
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {saving ? "Se salvează..." : "Salvează Preferințele"}
          </Button>
        </div>
      </div>
    </div>
  );
} 