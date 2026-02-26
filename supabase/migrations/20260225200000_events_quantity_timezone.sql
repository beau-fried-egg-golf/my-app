-- Add timezone to events and quantity to event_bookings
-- Supports multi-ticket orders and timezone-aware admin UI

-- Add timezone column to events
ALTER TABLE events
  ADD COLUMN timezone text NOT NULL DEFAULT 'America/New_York';

-- Add quantity column to event_bookings
ALTER TABLE event_bookings
  ADD COLUMN quantity integer NOT NULL DEFAULT 1;

-- Replace the atomic booking RPC with quantity support
CREATE OR REPLACE FUNCTION attempt_event_booking(
  p_event_id uuid,
  p_ticket_type_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_add_on_ids uuid[] DEFAULT '{}',
  p_quantity integer DEFAULT 1
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_event RECORD;
  v_ticket RECORD;
  v_event_booked integer;
  v_ticket_booked integer;
  v_add_on_booked integer;
  v_add_on RECORD;
  v_booking_id uuid;
  v_ticket_price integer;
  v_total integer;
  v_now timestamptz := now();
BEGIN
  -- Validate quantity
  IF p_quantity < 1 THEN
    RETURN jsonb_build_object('error', 'invalid_quantity', 'detail', 'Quantity must be at least 1');
  END IF;

  -- Lock event row
  SELECT * INTO v_event
  FROM events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'event_not_found');
  END IF;

  IF v_event.status NOT IN ('published', 'sold_out') THEN
    RETURN jsonb_build_object('error', 'event_not_available', 'detail', v_event.status);
  END IF;

  -- Check registration window
  IF v_event.registration_opens_at IS NOT NULL AND v_now < v_event.registration_opens_at THEN
    RETURN jsonb_build_object('error', 'registration_not_open');
  END IF;
  IF v_event.registration_closes_at IS NOT NULL AND v_now > v_event.registration_closes_at THEN
    RETURN jsonb_build_object('error', 'registration_closed');
  END IF;

  -- Lock ticket type row
  SELECT * INTO v_ticket
  FROM ticket_types
  WHERE id = p_ticket_type_id AND event_id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'ticket_type_not_found');
  END IF;

  -- Validate quantity against min/max per order
  IF p_quantity < v_ticket.min_per_order THEN
    RETURN jsonb_build_object('error', 'below_minimum', 'detail', 'Minimum ' || v_ticket.min_per_order || ' per order');
  END IF;
  IF p_quantity > v_ticket.max_per_order THEN
    RETURN jsonb_build_object('error', 'above_maximum', 'detail', 'Maximum ' || v_ticket.max_per_order || ' per order');
  END IF;

  -- Check ticket sale window
  IF v_ticket.sale_starts_at IS NOT NULL AND v_now < v_ticket.sale_starts_at THEN
    RETURN jsonb_build_object('error', 'ticket_not_on_sale');
  END IF;
  IF v_ticket.sale_ends_at IS NOT NULL AND v_now > v_ticket.sale_ends_at THEN
    RETURN jsonb_build_object('error', 'ticket_sale_ended');
  END IF;

  -- Count event-level bookings using sum(quantity)
  SELECT coalesce(sum(quantity), 0) INTO v_event_booked
  FROM event_bookings
  WHERE event_id = p_event_id
    AND status IN ('pending', 'confirmed');

  IF v_event_booked + p_quantity > v_event.total_capacity THEN
    RETURN jsonb_build_object('error', 'sold_out', 'level', 'event');
  END IF;

  -- Count ticket-level bookings using sum(quantity)
  IF v_ticket.capacity IS NOT NULL THEN
    SELECT coalesce(sum(quantity), 0) INTO v_ticket_booked
    FROM event_bookings
    WHERE ticket_type_id = p_ticket_type_id
      AND status IN ('pending', 'confirmed');

    IF v_ticket_booked + p_quantity > v_ticket.capacity THEN
      RETURN jsonb_build_object('error', 'sold_out', 'level', 'ticket_type');
    END IF;
  END IF;

  -- Check add-on capacities
  IF array_length(p_add_on_ids, 1) > 0 THEN
    FOR v_add_on IN
      SELECT a.* FROM add_ons a WHERE a.id = ANY(p_add_on_ids) AND a.event_id = p_event_id FOR UPDATE
    LOOP
      IF v_add_on.capacity IS NOT NULL THEN
        SELECT count(*) INTO v_add_on_booked
        FROM event_booking_add_ons ba
        JOIN event_bookings b ON b.id = ba.booking_id
        WHERE ba.add_on_id = v_add_on.id
          AND b.status IN ('pending', 'confirmed');

        IF v_add_on_booked >= v_add_on.capacity THEN
          RETURN jsonb_build_object('error', 'add_on_sold_out', 'add_on_id', v_add_on.id, 'add_on_name', v_add_on.name);
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Calculate total: ticket_price * quantity + add-ons (add-ons are per-booking, not multiplied)
  v_ticket_price := v_ticket.price;
  v_total := v_ticket_price * p_quantity;

  IF array_length(p_add_on_ids, 1) > 0 THEN
    SELECT v_total + coalesce(sum(price), 0) INTO v_total
    FROM add_ons
    WHERE id = ANY(p_add_on_ids) AND event_id = p_event_id;
  END IF;

  -- Insert booking with quantity
  INSERT INTO event_bookings (
    event_id, ticket_type_id, first_name, last_name, email, phone,
    status, total_amount, ticket_price_at_purchase, notes, quantity,
    expires_at
  ) VALUES (
    p_event_id, p_ticket_type_id, p_first_name, p_last_name, p_email, p_phone,
    'pending', v_total, v_ticket_price, p_notes, p_quantity,
    v_now + interval '30 minutes'
  )
  RETURNING id INTO v_booking_id;

  -- Insert booking add-ons
  IF array_length(p_add_on_ids, 1) > 0 THEN
    INSERT INTO event_booking_add_ons (booking_id, add_on_id, price_at_purchase)
    SELECT v_booking_id, a.id, a.price
    FROM add_ons a
    WHERE a.id = ANY(p_add_on_ids) AND a.event_id = p_event_id;
  END IF;

  RETURN jsonb_build_object(
    'booking_id', v_booking_id,
    'total_amount', v_total,
    'ticket_price', v_ticket_price,
    'quantity', p_quantity
  );
END;
$$;
