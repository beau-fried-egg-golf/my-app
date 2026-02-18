-- Experiences: Booking & Reservation System
-- Locations, rooms, tee times, packages, reservations

-- Locations (lodges, resorts, courses)
CREATE TABLE experience_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('lodge', 'course', 'resort')),
  description text,
  short_description text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip text,
  latitude double precision,
  longitude double precision,
  hero_image text,
  images text[] DEFAULT '{}',
  amenities text[] DEFAULT '{}',
  check_in_time text,
  check_out_time text,
  cancellation_policy text NOT NULL DEFAULT 'moderate',
  timezone text NOT NULL DEFAULT 'America/New_York',
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Room types per location
CREATE TABLE room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES experience_locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  images text[] DEFAULT '{}',
  max_occupancy integer NOT NULL DEFAULT 2,
  bed_configuration text,
  amenities text[] DEFAULT '{}',
  base_price_per_night integer NOT NULL, -- cents
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Room inventory (date-level per room type)
CREATE TABLE room_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id uuid NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_units integer NOT NULL,
  blocked_units integer NOT NULL DEFAULT 0,
  price_override integer, -- cents, null = use base_price
  notes text,
  UNIQUE(room_type_id, date)
);
CREATE INDEX idx_room_inventory_lookup ON room_inventory(room_type_id, date);

-- Extend existing courses table for experience fields
ALTER TABLE courses ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES experience_locations(id);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rating numeric;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS slope integer;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS designer text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS year_opened integer;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_experience_course boolean NOT NULL DEFAULT false;

-- Tee time slots
CREATE TABLE tee_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  date date NOT NULL,
  time time NOT NULL,
  max_players integer NOT NULL DEFAULT 4,
  price_per_player integer NOT NULL, -- cents
  price_override integer, -- cents
  is_blocked boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tee_time_lookup ON tee_time_slots(course_id, date);

-- Packages (curated multi-day experiences)
CREATE TABLE packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  short_description text,
  hero_image text,
  images text[] DEFAULT '{}',
  location_id uuid NOT NULL REFERENCES experience_locations(id),
  price_per_person integer NOT NULL, -- cents
  max_group_size integer NOT NULL DEFAULT 8,
  min_group_size integer NOT NULL DEFAULT 1,
  duration_nights integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  tags text[] DEFAULT '{}',
  inclusions text[] DEFAULT '{}',
  exclusions text[] DEFAULT '{}',
  cancellation_policy text NOT NULL DEFAULT 'moderate',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Package line items (day-by-day itinerary)
CREATE TABLE package_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  type text NOT NULL CHECK (type IN ('lodging', 'tee_time', 'meal', 'transport', 'other')),
  title text NOT NULL,
  description text,
  room_type_id uuid REFERENCES room_types(id),
  course_id text REFERENCES courses(id),
  start_time time,
  end_time time,
  sort_order integer NOT NULL DEFAULT 0
);

-- Reservations
CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('lodging', 'tee_time', 'package')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  package_id uuid REFERENCES packages(id),
  location_id uuid REFERENCES experience_locations(id),
  check_in_date date,
  check_out_date date,
  room_type_id uuid REFERENCES room_types(id),
  room_count integer NOT NULL DEFAULT 1,
  course_id text REFERENCES courses(id),
  player_count integer,
  guest_names text[] DEFAULT '{}',
  total_price integer NOT NULL, -- cents
  stripe_payment_intent_id text,
  stripe_refund_id text,
  special_requests text,
  admin_notes text,
  cancelled_at timestamptz,
  cancellation_reason text,
  hold_expires_at timestamptz, -- for temporary holds during checkout
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Reservation line items (price breakdown)
CREATE TABLE reservation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('room_night', 'tee_time', 'meal', 'fee', 'discount', 'other')),
  description text NOT NULL,
  date date,
  unit_price integer NOT NULL, -- cents
  quantity integer NOT NULL DEFAULT 1,
  subtotal integer NOT NULL, -- cents
  tee_time_slot_id uuid REFERENCES tee_time_slots(id),
  metadata jsonb DEFAULT '{}'
);

-- Junction table for reservation <-> tee time slots
CREATE TABLE reservation_tee_times (
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  tee_time_slot_id uuid NOT NULL REFERENCES tee_time_slots(id),
  player_count integer NOT NULL DEFAULT 1,
  PRIMARY KEY (reservation_id, tee_time_slot_id)
);

-- Row Level Security policies

ALTER TABLE experience_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active locations" ON experience_locations
  FOR SELECT USING (is_active = true);

ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active room types" ON room_types
  FOR SELECT USING (is_active = true);

ALTER TABLE room_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read room inventory" ON room_inventory
  FOR SELECT USING (true);

ALTER TABLE tee_time_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tee time slots" ON tee_time_slots
  FOR SELECT USING (true);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active packages" ON packages
  FOR SELECT USING (is_active = true);

ALTER TABLE package_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read package items" ON package_items
  FOR SELECT USING (true);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own reservations" ON reservations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reservations" ON reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reservations" ON reservations
  FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own reservation items" ON reservation_items
  FOR SELECT USING (reservation_id IN (SELECT id FROM reservations WHERE user_id = auth.uid()));

ALTER TABLE reservation_tee_times ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own reservation tee times" ON reservation_tee_times
  FOR SELECT USING (reservation_id IN (SELECT id FROM reservations WHERE user_id = auth.uid()));
