export interface ExperienceLocation {
  id: string;
  name: string;
  slug: string;
  type: 'lodge' | 'course' | 'resort' | 'private_club' | 'public_course' | 'destination';
  description: string | null;
  short_description: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  hero_image: string | null;
  images: string[];
  amenities: string[];
  check_in_time: string | null;
  check_out_time: string | null;
  cancellation_policy: CancellationPolicyTier;
  timezone: string;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Enriched
  room_type_count?: number;
}

export interface RoomType {
  id: string;
  location_id: string;
  name: string;
  description: string | null;
  images: string[];
  max_occupancy: number;
  bed_configuration: string | null;
  amenities: string[];
  base_price_per_night: number; // cents
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface RoomInventory {
  id: string;
  room_type_id: string;
  date: string;
  total_units: number;
  blocked_units: number;
  price_override: number | null; // cents
  notes: string | null;
  // Computed
  available_units?: number;
}

export interface TeeTimeSlot {
  id: string;
  course_id: string;
  date: string;
  time: string;
  max_players: number;
  price_per_player: number; // cents
  price_override: number | null; // cents
  is_blocked: boolean;
  notes: string | null;
  created_at: string;
  // Computed
  booked_players?: number;
}

export interface Package {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  hero_image: string | null;
  images: string[];
  location_id: string;
  price_per_person: number; // cents
  max_group_size: number;
  min_group_size: number;
  duration_nights: number;
  is_active: boolean;
  is_featured: boolean;
  tags: string[];
  inclusions: string[];
  exclusions: string[];
  cancellation_policy: CancellationPolicyTier;
  created_at: string;
  updated_at: string;
  // Enriched
  location_name?: string;
}

export interface PackageItem {
  id: string;
  package_id: string;
  day_number: number;
  type: 'lodging' | 'tee_time' | 'meal' | 'transport' | 'other';
  title: string;
  description: string | null;
  room_type_id: string | null;
  course_id: string | null;
  start_time: string | null;
  end_time: string | null;
  sort_order: number;
}

export type ReservationType = 'lodging' | 'tee_time' | 'package';
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Reservation {
  id: string;
  user_id: string;
  type: ReservationType;
  status: ReservationStatus;
  package_id: string | null;
  location_id: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  room_type_id: string | null;
  room_count: number;
  course_id: string | null;
  player_count: number | null;
  guest_names: string[];
  total_price: number; // cents
  stripe_payment_intent_id: string | null;
  stripe_refund_id: string | null;
  special_requests: string | null;
  admin_notes: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  hold_expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Enriched
  location_name?: string;
  room_type_name?: string;
  course_name?: string;
  package_name?: string;
}

export interface ReservationItem {
  id: string;
  reservation_id: string;
  type: 'room_night' | 'tee_time' | 'meal' | 'fee' | 'discount' | 'other';
  description: string;
  date: string | null;
  unit_price: number; // cents
  quantity: number;
  subtotal: number; // cents
  tee_time_slot_id: string | null;
  metadata: Record<string, any>;
}

export type CancellationPolicyTier = 'flexible' | 'moderate' | 'strict';

// ── Events ──

export interface Event {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string | null;
  total_capacity: number;
  status: 'draft' | 'published' | 'cancelled';
  image_url: string | null;
  timezone: string;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  // Enriched
  total_booked?: number;
  spots_remaining?: number;
}

export interface EventTicketType {
  id: string;
  name: string;
  description: string | null;
  price: number; // cents
  capacity: number | null;
  sold_count: number;
  available: number | null;
  on_sale: boolean;
  sale_status: 'active' | 'not_started' | 'ended';
  requires_code: boolean;
  sort_order: number;
}

export interface EventAddOnGroup {
  id: string;
  name: string;
  description: string | null;
  selection_type: 'single' | 'multiple';
  sort_order: number;
}

export interface EventAddOn {
  id: string;
  name: string;
  description: string | null;
  price: number; // cents
  capacity: number | null;
  sold_count: number;
  available: number | null;
  add_on_group_id: string | null;
  sort_order: number;
}

export interface EventFormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  options: string[] | null;
  sort_order: number;
}
