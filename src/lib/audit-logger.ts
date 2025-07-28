import { supabase } from "@/integrations/supabase/client";

type LogAction = 
  | "user.ban" 
  | "user.unban" 
  | "user.delete"
  | "user.register" // For new user registrations
  | "booking.create.admin" 
  | "booking.create.customer"
  | "booking.update.admin"
  | "booking.update.customer"
  | "booking.delete"
  | "availability.update";

type TargetType = "user" | "booking" | "availability";

export async function logAdminAction(
  adminId: string,
  action: LogAction,
  targetType: TargetType,
  targetId: string,
  details: string
) {
  try {
    const { error } = await supabase
      .from('admin_audit_logs')
      .insert({
        user_id: adminId,
        action,
        target_type: targetType,
        target_id: targetId,
        details,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging admin action:', error);
    }
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
} 