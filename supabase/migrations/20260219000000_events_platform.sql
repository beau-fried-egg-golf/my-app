-- Events Platform: Booking & Registration System
-- Golf outings with ticket types, add-ons, capacity enforcement, waitlists

-- Events
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  date date NOT NULL,
  time time,
  location text,
  total_capacity integer NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'sold_out', 'closed', 'cancelled')),
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  waitlist_enabled boolean NOT NULL DEFAULT false,
  image_url text,
  policy_url text,
  faq_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_slug ON events(slug);

-- Ticket types per event
CREATE TABLE ticket_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price integer NOT NULL DEFAULT 0, -- cents
  capacity integer,
  sort_order integer NOT NULL DEFAULT 0,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'hidden', 'invite_only')),
  sale_starts_at timestamptz,
  sale_ends_at timestamptz,
  waitlist_enabled boolean NOT NULL DEFAULT false,
  min_per_order integer NOT NULL DEFAULT 1,
  max_per_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add-on groups (optional grouping)
CREATE TABLE add_on_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  selection_type text NOT NULL DEFAULT 'any' CHECK (selection_type IN ('any', 'one_only')),
  collapsed_by_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add-ons
CREATE TABLE add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  add_on_group_id uuid REFERENCES add_on_groups(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price integer NOT NULL DEFAULT 0, -- cents
  capacity integer,
  sort_order integer NOT NULL DEFAULT 0,
  required boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'hidden')),
  sale_starts_at timestamptz,
  sale_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bookings
CREATE TABLE event_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id uuid NOT NULL REFERENCES ticket_types(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  total_amount integer NOT NULL DEFAULT 0, -- cents
  ticket_price_at_purchase integer NOT NULL DEFAULT 0, -- cents
  notes text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_bookings_event_status ON event_bookings(event_id, status);
CREATE INDEX idx_event_bookings_ticket_status ON event_bookings(ticket_type_id, status);
CREATE INDEX idx_event_bookings_stripe ON event_bookings(stripe_checkout_session_id);

-- Booking add-ons junction
CREATE TABLE event_booking_add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES event_bookings(id) ON DELETE CASCADE,
  add_on_id uuid NOT NULL REFERENCES add_ons(id),
  price_at_purchase integer NOT NULL DEFAULT 0, -- cents
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Custom form fields per event
CREATE TABLE event_form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text' CHECK (field_type IN ('text', 'textarea', 'select', 'checkbox', 'radio', 'number')),
  options jsonb, -- for select/radio: ["Option A", "Option B"]
  required boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  placeholder text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Form responses per booking
CREATE TABLE event_form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES event_bookings(id) ON DELETE CASCADE,
  form_field_id uuid NOT NULL REFERENCES event_form_fields(id),
  value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Waitlist entries
CREATE TABLE event_waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id uuid REFERENCES ticket_types(id),
  add_on_id uuid REFERENCES add_ons(id),
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  position integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'converted', 'expired', 'cancelled')),
  notified_at timestamptz,
  offer_expires_at timestamptz,
  notes text,
  stripe_setup_intent_id text,
  stripe_payment_method_id text,
  desired_add_on_ids jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_waitlist_queue ON event_waitlist_entries(event_id, ticket_type_id, status, position);

-- ─── Row Level Security ───

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published events" ON events
  FOR SELECT USING (true);

ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read ticket types" ON ticket_types
  FOR SELECT USING (true);

ALTER TABLE add_on_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read add-on groups" ON add_on_groups
  FOR SELECT USING (true);

ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read add-ons" ON add_ons
  FOR SELECT USING (true);

ALTER TABLE event_form_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read form fields" ON event_form_fields
  FOR SELECT USING (true);

ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert bookings" ON event_bookings
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read own bookings by email" ON event_bookings
  FOR SELECT USING (true);

ALTER TABLE event_booking_add_ons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert booking add-ons" ON event_booking_add_ons
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read booking add-ons" ON event_booking_add_ons
  FOR SELECT USING (true);

ALTER TABLE event_form_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert form responses" ON event_form_responses
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read form responses" ON event_form_responses
  FOR SELECT USING (true);

ALTER TABLE event_waitlist_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert waitlist entries" ON event_waitlist_entries
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read waitlist entries" ON event_waitlist_entries
  FOR SELECT USING (true);

-- ─── Atomic Capacity Check RPC ───

CREATE OR REPLACE FUNCTION attempt_event_booking(
  p_event_id uuid,
  p_ticket_type_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_add_on_ids uuid[] DEFAULT '{}'
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

  -- Check ticket sale window
  IF v_ticket.sale_starts_at IS NOT NULL AND v_now < v_ticket.sale_starts_at THEN
    RETURN jsonb_build_object('error', 'ticket_not_on_sale');
  END IF;
  IF v_ticket.sale_ends_at IS NOT NULL AND v_now > v_ticket.sale_ends_at THEN
    RETURN jsonb_build_object('error', 'ticket_sale_ended');
  END IF;

  -- Count event-level bookings (pending + confirmed)
  SELECT count(*) INTO v_event_booked
  FROM event_bookings
  WHERE event_id = p_event_id
    AND status IN ('pending', 'confirmed');

  IF v_event_booked >= v_event.total_capacity THEN
    RETURN jsonb_build_object('error', 'sold_out', 'level', 'event');
  END IF;

  -- Count ticket-level bookings
  IF v_ticket.capacity IS NOT NULL THEN
    SELECT count(*) INTO v_ticket_booked
    FROM event_bookings
    WHERE ticket_type_id = p_ticket_type_id
      AND status IN ('pending', 'confirmed');

    IF v_ticket_booked >= v_ticket.capacity THEN
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

  -- Calculate total
  v_ticket_price := v_ticket.price;
  v_total := v_ticket_price;

  IF array_length(p_add_on_ids, 1) > 0 THEN
    SELECT v_total + coalesce(sum(price), 0) INTO v_total
    FROM add_ons
    WHERE id = ANY(p_add_on_ids) AND event_id = p_event_id;
  END IF;

  -- Insert booking
  INSERT INTO event_bookings (
    event_id, ticket_type_id, first_name, last_name, email, phone,
    status, total_amount, ticket_price_at_purchase, notes,
    expires_at
  ) VALUES (
    p_event_id, p_ticket_type_id, p_first_name, p_last_name, p_email, p_phone,
    'pending', v_total, v_ticket_price, p_notes,
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
    'ticket_price', v_ticket_price
  );
END;
$$;
