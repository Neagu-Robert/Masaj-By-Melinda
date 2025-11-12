CREATE OR REPLACE FUNCTION public.handle_booking_response(
  p_booking_id uuid,
  p_token_id uuid,
  p_action text
)
RETURNS SETOF bookings LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Atomically update the booking and delete the token
  RETURN QUERY
  WITH updated AS (
    UPDATE public.bookings
    SET
      status = CASE
        WHEN p_action = 'accept' THEN 'confirmed'::public.booking_status
        ELSE 'unconfirmed'::public.booking_status
      END,
      booking_date = CASE
        WHEN p_action = 'accept' THEN suggested_date
        ELSE booking_date
      END,
      booking_time = CASE
        WHEN p_action = 'accept' THEN suggested_time
        ELSE booking_time
      END,
      suggested_date = NULL,
      suggested_time = NULL,
      suggested_by_admin = NULL
    WHERE id = p_booking_id AND status = 'suggested'::public.booking_status
    RETURNING *
  ),
  deleted AS (
    DELETE FROM public.booking_response_tokens
    WHERE id = p_token_id
    AND EXISTS (SELECT 1 FROM updated)
  )
  SELECT * FROM updated;
END;
$$;
