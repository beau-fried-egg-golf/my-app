export interface EventData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string | null;
  total_capacity: number;
  status: string;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  waitlist_enabled: boolean;
  image_url: string | null;
  policy_url: string | null;
  faq_url: string | null;
  total_booked: number;
  spots_remaining: number;
}

export interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  capacity: number | null;
  sort_order: number;
  visibility: string;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  waitlist_enabled: boolean;
  min_per_order: number;
  max_per_order: number;
  sold_count: number;
  available: number | null;
}

export interface AddOnGroup {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  selection_type: 'any' | 'one_only';
  collapsed_by_default: boolean;
}

export interface AddOn {
  id: string;
  add_on_group_id: string | null;
  name: string;
  description: string | null;
  price: number;
  capacity: number | null;
  sort_order: number;
  required: boolean;
  sold_count: number;
  available: number | null;
}

export interface FormField {
  id: string;
  label: string;
  field_type: string;
  options: string[] | null;
  required: boolean;
  sort_order: number;
  placeholder: string | null;
}

export interface GetEventResponse {
  event: EventData;
  ticket_types: TicketType[];
  add_on_groups: AddOnGroup[];
  add_ons: AddOn[];
  form_fields: FormField[];
}
