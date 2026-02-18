export interface Profile {
  id: string;
  name: string;
  image: string | null;
  location: string;
  handicap: number | null;
  home_course: string;
  favorite_ball: string;
  member_since: string;
  suspended?: boolean;
  is_verified?: boolean;
  dms_disabled?: boolean;
}

export interface Course {
  id: string;
  name: string;
  short_name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_private: boolean;
  holes: number;
  par: number;
  year_established: number;
  description: string;
  latitude: number;
  longitude: number;
  fe_hero_image: string | null;
  fe_profile_url: string | null;
  fe_profile_author: string | null;
  fe_egg_rating: number | null;
  fe_bang_for_buck: boolean;
  fe_profile_date: string | null;
}

export interface Photo {
  id: string;
  writeup_id: string;
  user_id: string;
  url: string;
  caption: string;
  created_at: string;
  hidden: boolean;
}

export interface Writeup {
  id: string;
  user_id: string;
  course_id: string;
  title: string;
  content: string;
  created_at: string;
  hidden: boolean;
  photos?: Photo[];
  upvote_count?: number;
}

export interface PostPhoto {
  id: string;
  post_id: string;
  user_id: string;
  url: string;
  caption: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  hidden: boolean;
  photos: PostPhoto[];
  reaction_count: number;
  reply_count: number;
  author_name?: string;
  link_url?: string | null;
  link_title?: string | null;
  link_description?: string | null;
  link_image?: string | null;
}

export interface PostReply {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

export interface WriteupReply {
  id: string;
  writeup_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  user1_name?: string;
  user2_name?: string;
  message_count: number;
  last_message?: string;
  last_message_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

export interface Meetup {
  id: string;
  name: string;
  description: string;
  host_id: string;
  course_id: string | null;
  location_name: string;
  meetup_date: string;
  cost: string;
  total_slots: number;
  host_takes_slot: boolean;
  image: string | null;
  is_fe_coordinated: boolean;
  suspended?: boolean;
  stripe_payment_url: string | null;
  cost_cents?: number | null;
  created_at: string;
  updated_at: string;
  host_name?: string;
  member_count?: number;
}

export interface CancellationRequest {
  id: string;
  meetup_id: string;
  user_id: string;
  member_id: string;
  note: string;
  status: 'pending' | 'approved' | 'denied';
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
  user_name?: string;
  meetup_name?: string;
  meetup_date?: string;
}

export interface WaitlistEntry {
  id: string;
  meetup_id: string;
  user_id: string;
  position: number;
  created_at: string;
  user_name?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  invited_by: string | null;
  created_at: string;
}

export interface MeetupMember {
  id: string;
  meetup_id: string;
  user_id: string;
  joined_at: string;
  payment_status: string;
  stripe_payment_intent_id?: string;
  member_name?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  home_course_id: string | null;
  location_name: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  member_count?: number;
}

export interface Activity {
  id: string;
  type: 'writeup' | 'upvote' | 'played' | 'post';
  user_id: string;
  writeup_id: string | null;
  post_id?: string | null;
  course_id: string | null;
  target_user_id: string | null;
  created_at: string;
}

export interface ContentFlag {
  id: string;
  user_id: string;
  content_type: 'post' | 'writeup' | 'course';
  content_id: string;
  created_at: string;
  flag_count?: number;
  content_preview?: string;
  author_name?: string;
  reason?: string;
  course_name?: string;
}

export interface HoleAnnotation {
  id: string;
  title: string;
  course_name: string;
  hole_number: number;
  aerial_image_url: string | null;
  annotation_type: 'scroll' | 'interactive';
  created_at: string;
  updated_at: string;
  pin_count?: number;
}

export interface AnnotationPin {
  id: string;
  annotation_id: string;
  position_x: number;
  position_y: number;
  sort_order: number;
  headline: string;
  body_text: string;
  link_url: string;
  scroll_direction: 'top' | 'bottom' | 'left' | 'right';
  created_at: string;
}

export interface PinPhoto {
  id: string;
  pin_id: string;
  photo_url: string;
  sort_order: number;
  caption: string;
  created_at: string;
}

// ── Experiences ──

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
  cancellation_policy: string;
  timezone: string;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
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
  base_price_per_night: number;
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
  price_override: number | null;
  notes: string | null;
}

export interface TeeTimeSlot {
  id: string;
  course_id: string;
  date: string;
  time: string;
  max_players: number;
  price_per_player: number;
  price_override: number | null;
  is_blocked: boolean;
  notes: string | null;
  created_at: string;
  booked_players?: number;
}

export interface ExperiencePackage {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  hero_image: string | null;
  images: string[];
  location_id: string;
  price_per_person: number;
  max_group_size: number;
  min_group_size: number;
  duration_nights: number;
  is_active: boolean;
  is_featured: boolean;
  tags: string[];
  inclusions: string[];
  exclusions: string[];
  cancellation_policy: string;
  created_at: string;
  updated_at: string;
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

export interface ExperienceReservation {
  id: string;
  user_id: string;
  type: 'lodging' | 'tee_time' | 'package';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  package_id: string | null;
  location_id: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  room_type_id: string | null;
  room_count: number;
  course_id: string | null;
  player_count: number | null;
  guest_names: string[];
  total_price: number;
  stripe_payment_intent_id: string | null;
  stripe_refund_id: string | null;
  special_requests: string | null;
  admin_notes: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  hold_expires_at: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
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
  unit_price: number;
  quantity: number;
  subtotal: number;
  tee_time_slot_id: string | null;
  metadata: Record<string, any>;
}
