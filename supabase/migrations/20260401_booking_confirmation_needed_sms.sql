-- Extend booking SMS trigger with confirmation_needed event for profile re-requests
-- (confirmed → unconfirmed when customer changes date/time on profile page).
-- Also skip SMS for service-only profile edits while status stays confirmed.

CREATE OR REPLACE FUNCTION notify_admin_on_booking_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_id UUID;
  v_role TEXT;
  v_event TEXT;
  v_sms_message TEXT;
  v_secret TEXT;
  v_supabase_url TEXT;
  v_anon_key TEXT;
  v_admin_phones TEXT;
  v_phone TEXT;
  v_phones TEXT[];
  v_row RECORD;
  v_customer_name TEXT;
  v_service TEXT;
  v_date_text TEXT;
  v_time_text TEXT;
  v_datetime_part TEXT;
  v_booking_id_short TEXT;
BEGIN
  -- 1. Suppress system/service-role and admin notifications
  -- auth.uid() is NULL for service-role operations (cron jobs, cleanup, etc.)
  v_actor_id := auth.uid();

  IF v_actor_id IS NULL THEN
    -- No authenticated user context — this is a service-role/cron operation.
    -- Skip SMS to avoid false alerts from maintenance tasks (e.g. cleanup-old-data).
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  BEGIN
    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = v_actor_id;
  EXCEPTION WHEN OTHERS THEN
    v_role := NULL;
  END;

  IF v_role = 'admin' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- 2. Determine event type
  IF TG_OP = 'DELETE' THEN
    v_event := 'cancellation';
    v_row := OLD;
  ELSIF NEW.status::text = 'cancelled' THEN
    v_event := 'cancellation';
    v_row := NEW;
  ELSIF NEW.status = 'confirmed' AND OLD.status = 'suggested' THEN
    v_event := 'suggestion_accepted';
    v_row := NEW;
  ELSIF NEW.status = 'unconfirmed' AND OLD.status = 'suggested' THEN
    v_event := 'suggestion_declined';
    v_row := NEW;
  ELSIF NEW.status = 'unconfirmed' AND OLD.status = 'confirmed' THEN
    v_event := 'confirmation_needed';
    v_row := NEW;
  ELSE
    v_event := 'booking_updated';
    v_row := NEW;
  END IF;

  -- Skip SMS for service-only profile edits (status stays confirmed, no date/time change)
  IF TG_OP = 'UPDATE'
     AND v_event = 'booking_updated'
     AND NEW.status = 'confirmed'
     AND OLD.status = 'confirmed'
     AND NEW.booking_date IS NOT DISTINCT FROM OLD.booking_date
     AND NEW.booking_time IS NOT DISTINCT FROM OLD.booking_time
     AND NEW.requested_date_text IS NOT DISTINCT FROM OLD.requested_date_text
     AND NEW.requested_time_text IS NOT DISTINCT FROM OLD.requested_time_text THEN
    RETURN NEW;
  END IF;

  -- SMS notification block — wrapped in exception handler to never block the operation
  BEGIN
    -- 3. Read secrets from Vault
    SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets
    WHERE name = 'INTERNAL_SMS_SHARED_SECRET';

    SELECT decrypted_secret INTO v_supabase_url
    FROM vault.decrypted_secrets
    WHERE name = 'SUPABASE_URL';

    SELECT decrypted_secret INTO v_anon_key
    FROM vault.decrypted_secrets
    WHERE name = 'SUPABASE_ANON_KEY';

    SELECT decrypted_secret INTO v_admin_phones
    FROM vault.decrypted_secrets
    WHERE name = 'ADMIN_PHONE_NUMBERS';

    -- Bail out if critical secrets are missing
    IF v_supabase_url IS NULL OR v_anon_key IS NULL OR v_admin_phones IS NULL THEN
      RAISE WARNING 'SMS trigger: missing Vault secrets (URL=%, KEY=%, PHONES=%)',
        v_supabase_url IS NOT NULL, v_anon_key IS NOT NULL, v_admin_phones IS NOT NULL;
      IF TG_OP = 'DELETE' THEN
        RETURN OLD;
      ELSE
        RETURN NEW;
      END IF;
    END IF;

    -- 4. Build SMS message (Romanian, ≤160 chars)
    v_customer_name := COALESCE(v_row.first_name, '') || ' ' || COALESCE(v_row.last_name, '');
    v_customer_name := TRIM(v_customer_name);
    v_service := COALESCE(v_row.service_type, 'N/A');
    v_date_text := COALESCE(v_row.requested_date_text, TO_CHAR(v_row.booking_date, 'DD.MM.YYYY'));
    v_time_text := COALESCE(v_row.requested_time_text, TO_CHAR(v_row.booking_time, 'HH24:MI'));
    v_booking_id_short := LEFT(v_row.id::TEXT, 8);

    -- Build date/time part: include time when available
    IF v_time_text IS NOT NULL AND v_time_text <> '' THEN
      v_datetime_part := v_date_text || ', ' || v_time_text;
    ELSE
      v_datetime_part := v_date_text;
    END IF;

    CASE v_event
      WHEN 'cancellation' THEN
        v_sms_message := 'Anulare: ' || v_service || ' - ' || v_datetime_part || '. Client: ' || v_customer_name || '. ID: ' || v_booking_id_short;
      WHEN 'suggestion_accepted' THEN
        v_sms_message := 'Sugestie acceptata: ' || v_service || ' - ' || v_datetime_part || '. Client: ' || v_customer_name || '. ID: ' || v_booking_id_short;
      WHEN 'suggestion_declined' THEN
        v_sms_message := 'Sugestie refuzata: ' || v_service || ' - ' || v_datetime_part || '. Client: ' || v_customer_name || '. ID: ' || v_booking_id_short;
      WHEN 'confirmation_needed' THEN
        v_sms_message := 'Rezervare noua: ' || v_service || ' - ' || v_datetime_part
          || '. Client: ' || v_customer_name || ' ' || COALESCE(v_row.phone_number, '')
          || '. ID: ' || v_booking_id_short;
      ELSE
        v_sms_message := 'Actualizare: ' || v_service || ' - ' || v_datetime_part || '. Client: ' || v_customer_name || '. ID: ' || v_booking_id_short;
    END CASE;

    -- Truncate to 160 chars
    IF LENGTH(v_sms_message) > 160 THEN
      v_sms_message := LEFT(v_sms_message, 157) || '...';
    END IF;

    -- 5. Call net.http_post for each admin phone
    v_phones := string_to_array(v_admin_phones, ',');

    FOR i IN 1..array_length(v_phones, 1) LOOP
      v_phone := TRIM(v_phones[i]);
      IF v_phone <> '' THEN
        PERFORM net.http_post(
          url    := v_supabase_url || '/functions/v1/send-sms',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_anon_key,
            'x-internal-secret', COALESCE(v_secret, '')
          ),
          body   := jsonb_build_object(
            'to', v_phone,
            'message', v_sms_message
          )
        );
      END IF;
    END LOOP;

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'SMS trigger error: %', SQLERRM;
  END;

  -- 7. Return appropriate row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;
