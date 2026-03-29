-- supabase/migrations/20260329200000_booking_admin_audit_trigger.sql

CREATE OR REPLACE FUNCTION public.log_admin_action_on_booking()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  v_actor_id uuid;
  v_role text;
  v_action text;
  v_details text;
BEGIN
  v_actor_id := auth.uid();
  
  IF v_actor_id IS NOT NULL THEN
    SELECT role INTO v_role FROM public.profiles WHERE id = v_actor_id;
  END IF;

  -- Only proceed if role is admin OR if the action is DELETE (since customer deletions are also auditable)
  IF COALESCE(v_role, '') = 'admin' OR TG_OP = 'DELETE' THEN
    IF TG_OP = 'INSERT' THEN
      v_action := 'booking.create.admin';
      v_details := format('{"service_type": "%s", "booking_date": "%s", "booking_time": "%s", "status": "%s"}', 
                           NEW.service_type, NEW.booking_date, NEW.booking_time, NEW.status);
    ELSIF TG_OP = 'UPDATE' THEN
      v_action := 'booking.update.admin';
      -- Store details as a valid JSON string
      v_details := format('{"service_type": "%s", "booking_date": "%s", "booking_time": "%s", "old_status": "%s", "new_status": "%s"}', 
                           NEW.service_type, NEW.booking_date, NEW.booking_time, OLD.status, NEW.status);
    ELSE
      v_action := 'booking.delete';
      v_details := format('{"service_type": "%s", "booking_date": "%s", "booking_time": "%s", "status": "%s"}', 
                           OLD.service_type, OLD.booking_date, OLD.booking_time, OLD.status);
    END IF;

    INSERT INTO public.admin_audit_logs (user_id, action, target_type, target_id, details)
    VALUES (v_actor_id, v_action, 'booking', COALESCE(NEW.id, OLD.id)::text, v_details);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'booking audit trigger: %', SQLERRM;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS booking_admin_audit_trigger ON public.bookings;
CREATE TRIGGER booking_admin_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION log_admin_action_on_booking();
