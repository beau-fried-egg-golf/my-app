// ── Events Platform Types ──

export interface Event {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string | null;
  total_capacity: number;
  status: 'draft' | 'published' | 'sold_out' | 'closed' | 'cancelled';
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  waitlist_enabled: boolean;
  image_url: string | null;
  policy_url: string | null;
  faq_url: string | null;
  created_at: string;
  updated_at: string;
  // Computed
  total_booked?: number;
  total_revenue?: number;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number; // cents
  capacity: number | null;
  sort_order: number;
  visibility: 'public' | 'hidden' | 'invite_only';
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  waitlist_enabled: boolean;
  min_per_order: number;
  max_per_order: number;
  created_at: string;
  updated_at: string;
  // Computed
  sold_count?: number;
}

export interface AddOnGroup {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  selection_type: 'any' | 'one_only';
  collapsed_by_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddOn {
  id: string;
  event_id: string;
  add_on_group_id: string | null;
  name: string;
  description: string | null;
  price: number; // cents
  capacity: number | null;
  sort_order: number;
  required: boolean;
  visibility: 'public' | 'hidden';
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  created_at: string;
  updated_at: string;
  // Computed
  sold_count?: number;
}

export interface EventBooking {
  id: string;
  event_id: string;
  ticket_type_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  total_amount: number; // cents
  ticket_price_at_purchase: number; // cents
  notes: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Enriched
  ticket_type_name?: string;
  add_ons?: BookingAddOn[];
  form_responses?: FormResponse[];
}

export interface BookingAddOn {
  id: string;
  booking_id: string;
  add_on_id: string;
  price_at_purchase: number;
  created_at: string;
  // Enriched
  add_on_name?: string;
}

export interface EventFormField {
  id: string;
  event_id: string;
  label: string;
  field_type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number';
  options: string[] | null;
  required: boolean;
  sort_order: number;
  placeholder: string | null;
  created_at: string;
  updated_at: string;
}

export interface FormResponse {
  id: string;
  booking_id: string;
  form_field_id: string;
  value: string | null;
  created_at: string;
  // Enriched
  field_label?: string;
}

export interface EventWaitlistEntry {
  id: string;
  event_id: string;
  ticket_type_id: string | null;
  add_on_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  position: number;
  status: 'waiting' | 'notified' | 'converted' | 'expired' | 'cancelled';
  notified_at: string | null;
  offer_expires_at: string | null;
  notes: string | null;
  stripe_setup_intent_id: string | null;
  stripe_payment_method_id: string | null;
  desired_add_on_ids: string[];
  created_at: string;
  updated_at: string;
  // Enriched
  ticket_type_name?: string;
}

export interface EventStats {
  total_booked: number;
  total_confirmed: number;
  total_pending: number;
  total_cancelled: number;
  total_refunded: number;
  total_revenue: number;
  spots_remaining: number;
  waitlist_count: number;
}
