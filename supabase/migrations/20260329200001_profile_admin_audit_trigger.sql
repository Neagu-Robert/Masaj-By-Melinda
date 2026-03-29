-- supabase/migrations/20260329200001_profile_admin_audit_trigger.sql

CREATE OR REPLACE FUNCTION public.log_admin_action_on_profile()
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

  IF COALESCE(v_role, '') = 'admin' THEN
    IF TG_OP = 'UPDATE' THEN
      IF OLD.status != 'banned' AND NEW.status = 'banned' THEN
        v_action := 'user.ban';
      ELSIF OLD.status = 'banned' AND NEW.status = 'active' THEN
        v_action := 'user.unban';
      END IF;
    ELSIF TG_OP = 'DELETE' THEN
      v_action := 'user.delete';
    END IF;

    IF v_action IS NOT NULL THEN
      IF TG_OP = 'UPDATE' THEN
        v_details := format('{"email": "%s", "full_name": "%s", "old_status": "%s", "new_status": "%s"}', 
                             OLD.email, OLD.full_name, OLD.status, NEW.status);
      ELSE
        v_details := format('{"email": "%s", "full_name": "%s", "status": "%s"}', 
                             OLD.email, OLD.full_name, OLD.status);
      END IF;

      INSERT INTO public.admin_audit_logs (user_id, action, target_type, target_id, details)
      VALUES (v_actor_id, v_action, 'user', OLD.id::text, v_details);
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'profile audit trigger: %', SQLERRM;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profile_admin_audit_trigger ON public.profiles;
CREATE TRIGGER profile_admin_audit_trigger
AFTER UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION log_admin_action_on_profile();
