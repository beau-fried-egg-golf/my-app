import { supabase } from './supabase';
import type {
  Event,
  TicketType,
  AddOnGroup,
  AddOn,
  EventBooking,
  BookingAddOn,
  EventFormField,
  FormResponse,
  EventWaitlistEntry,
  EventStats,
} from './eventTypes';

// ── Events ──

export async function getEvents(filters?: {
  status?: string;
  search?: string;
}): Promise<Event[]> {
  let query = supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data: events } = await query;
  if (!events?.length) return [];

  // Get booking counts (summing quantity) + revenue per event
  const eventIds = events.map(e => e.id);
  const { data: bookings } = await supabase
    .from('event_bookings')
    .select('event_id, status, total_amount, quantity')
    .in('event_id', eventIds)
    .in('status', ['pending', 'confirmed']);

  const countMap = new Map<string, number>();
  const revenueMap = new Map<string, number>();
  for (const b of bookings ?? []) {
    countMap.set(b.event_id, (countMap.get(b.event_id) ?? 0) + (b.quantity ?? 1));
    if (b.status === 'confirmed') {
      revenueMap.set(b.event_id, (revenueMap.get(b.event_id) ?? 0) + b.total_amount);
    }
  }

  let results = events.map(e => ({
    ...e,
    total_booked: countMap.get(e.id) ?? 0,
    total_revenue: revenueMap.get(e.id) ?? 0,
  })) as Event[];

  if (filters?.search) {
    const term = filters.search.toLowerCase();
    results = results.filter(e =>
      e.name.toLowerCase().includes(term) ||
      e.slug.toLowerCase().includes(term) ||
      e.location?.toLowerCase().includes(term),
    );
  }

  return results;
}

export async function getEvent(id: string): Promise<Event | null> {
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

export async function saveEvent(event: Event): Promise<string> {
  const { total_booked, total_revenue, created_at, ...data } = event as any;
  data.updated_at = new Date().toISOString();

  if (!data.id) {
    data.id = crypto.randomUUID();
    data.created_at = data.updated_at;
  }

  const { error } = await supabase.from('events').upsert(data);
  if (error) console.error('saveEvent failed:', error);
  return data.id;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) console.error('deleteEvent failed:', error);
}

// ── Ticket Types ──

export async function getTicketTypes(eventId: string): Promise<TicketType[]> {
  const { data: tickets } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order');

  if (!tickets?.length) return [];

  // Get sold counts (summing quantity)
  const ticketIds = tickets.map(t => t.id);
  const { data: bookings } = await supabase
    .from('event_bookings')
    .select('ticket_type_id, quantity')
    .in('ticket_type_id', ticketIds)
    .in('status', ['pending', 'confirmed']);

  const countMap = new Map<string, number>();
  for (const b of bookings ?? []) {
    countMap.set(b.ticket_type_id, (countMap.get(b.ticket_type_id) ?? 0) + (b.quantity ?? 1));
  }

  return tickets.map(t => ({
    ...t,
    sold_count: countMap.get(t.id) ?? 0,
  })) as TicketType[];
}

export async function saveTicketType(ticket: TicketType): Promise<void> {
  const { sold_count, created_at, ...data } = ticket as any;
  data.updated_at = new Date().toISOString();

  if (!data.id) {
    data.id = crypto.randomUUID();
    data.created_at = data.updated_at;
  }

  const { error } = await supabase.from('ticket_types').upsert(data);
  if (error) console.error('saveTicketType failed:', error);
}

export async function deleteTicketType(id: string): Promise<void> {
  const { error } = await supabase.from('ticket_types').delete().eq('id', id);
  if (error) console.error('deleteTicketType failed:', error);
}

// ── Add-On Groups ──

export async function getAddOnGroups(eventId: string): Promise<AddOnGroup[]> {
  const { data } = await supabase
    .from('add_on_groups')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order');
  return (data ?? []) as AddOnGroup[];
}

export async function saveAddOnGroup(group: AddOnGroup): Promise<void> {
  const { created_at, ...data } = group as any;
  data.updated_at = new Date().toISOString();

  if (!data.id) {
    data.id = crypto.randomUUID();
    data.created_at = data.updated_at;
  }

  const { error } = await supabase.from('add_on_groups').upsert(data);
  if (error) console.error('saveAddOnGroup failed:', error);
}

export async function deleteAddOnGroup(id: string): Promise<void> {
  const { error } = await supabase.from('add_on_groups').delete().eq('id', id);
  if (error) console.error('deleteAddOnGroup failed:', error);
}

// ── Add-Ons ──

export async function getAddOns(eventId: string): Promise<AddOn[]> {
  const { data: addOns } = await supabase
    .from('add_ons')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order');

  if (!addOns?.length) return [];

  // Get sold counts (summing quantity)
  const addOnIds = addOns.map(a => a.id);
  const { data: bookingAddOns } = await supabase
    .from('event_booking_add_ons')
    .select('add_on_id, booking_id, quantity')
    .in('add_on_id', addOnIds);

  if (!bookingAddOns?.length) {
    return addOns.map(a => ({ ...a, sold_count: 0 })) as AddOn[];
  }

  // Filter to active bookings only
  const bookingIds = [...new Set(bookingAddOns.map(ba => ba.booking_id))];
  const { data: activeBookings } = await supabase
    .from('event_bookings')
    .select('id')
    .in('id', bookingIds)
    .in('status', ['pending', 'confirmed']);

  const activeIds = new Set((activeBookings ?? []).map(b => b.id));
  const countMap = new Map<string, number>();
  for (const ba of bookingAddOns) {
    if (activeIds.has(ba.booking_id)) {
      countMap.set(ba.add_on_id, (countMap.get(ba.add_on_id) ?? 0) + ((ba as any).quantity ?? 1));
    }
  }

  return addOns.map(a => ({
    ...a,
    sold_count: countMap.get(a.id) ?? 0,
  })) as AddOn[];
}

export async function saveAddOn(addOn: AddOn): Promise<void> {
  const { sold_count, created_at, ...data } = addOn as any;
  data.updated_at = new Date().toISOString();

  if (!data.id) {
    data.id = crypto.randomUUID();
    data.created_at = data.updated_at;
  }

  const { error } = await supabase.from('add_ons').upsert(data);
  if (error) console.error('saveAddOn failed:', error);
}

export async function deleteAddOn(id: string): Promise<void> {
  const { error } = await supabase.from('add_ons').delete().eq('id', id);
  if (error) console.error('deleteAddOn failed:', error);
}

// ── Form Fields ──

export async function getFormFields(eventId: string): Promise<EventFormField[]> {
  const { data } = await supabase
    .from('event_form_fields')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order');
  return (data ?? []) as EventFormField[];
}

export async function saveFormField(field: EventFormField): Promise<void> {
  const { created_at, ...data } = field as any;
  data.updated_at = new Date().toISOString();

  if (!data.id) {
    data.id = crypto.randomUUID();
    data.created_at = data.updated_at;
  }

  const { error } = await supabase.from('event_form_fields').upsert(data);
  if (error) console.error('saveFormField failed:', error);
}

export async function deleteFormField(id: string): Promise<void> {
  const { error } = await supabase.from('event_form_fields').delete().eq('id', id);
  if (error) console.error('deleteFormField failed:', error);
}

// ── Bookings ──

export async function getBookings(eventId: string, filters?: {
  status?: string;
  ticket_type_id?: string;
  search?: string;
}): Promise<EventBooking[]> {
  let query = supabase
    .from('event_bookings')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.ticket_type_id) {
    query = query.eq('ticket_type_id', filters.ticket_type_id);
  }

  const { data: bookings } = await query;
  if (!bookings?.length) return [];

  // Enrich with ticket type names
  const ticketIds = [...new Set(bookings.map(b => b.ticket_type_id))];
  const { data: tickets } = await supabase
    .from('ticket_types')
    .select('id, name')
    .in('id', ticketIds);

  const ticketMap = new Map((tickets ?? []).map(t => [t.id, t.name]));

  let results = bookings.map(b => ({
    ...b,
    ticket_type_name: ticketMap.get(b.ticket_type_id) ?? 'Unknown',
  })) as EventBooking[];

  if (filters?.search) {
    const term = filters.search.toLowerCase();
    results = results.filter(b =>
      b.first_name.toLowerCase().includes(term) ||
      b.last_name.toLowerCase().includes(term) ||
      b.email.toLowerCase().includes(term),
    );
  }

  return results;
}

export async function getBooking(id: string): Promise<EventBooking | null> {
  const { data: booking } = await supabase
    .from('event_bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (!booking) return null;

  // Get ticket type name
  const { data: ticket } = await supabase
    .from('ticket_types')
    .select('name')
    .eq('id', booking.ticket_type_id)
    .single();

  // Get add-ons
  const { data: bookingAddOns } = await supabase
    .from('event_booking_add_ons')
    .select('*')
    .eq('booking_id', id);

  let enrichedAddOns: BookingAddOn[] = [];
  if (bookingAddOns?.length) {
    const addOnIds = bookingAddOns.map(ba => ba.add_on_id);
    const { data: addOns } = await supabase
      .from('add_ons')
      .select('id, name')
      .in('id', addOnIds);

    const addOnMap = new Map((addOns ?? []).map(a => [a.id, a.name]));
    enrichedAddOns = bookingAddOns.map(ba => ({
      ...ba,
      add_on_name: addOnMap.get(ba.add_on_id) ?? 'Unknown',
    })) as BookingAddOn[];
  }

  // Get form responses
  const { data: responses } = await supabase
    .from('event_form_responses')
    .select('*')
    .eq('booking_id', id);

  let enrichedResponses: FormResponse[] = [];
  if (responses?.length) {
    const fieldIds = responses.map(r => r.form_field_id);
    const { data: fields } = await supabase
      .from('event_form_fields')
      .select('id, label')
      .in('id', fieldIds);

    const fieldMap = new Map((fields ?? []).map(f => [f.id, f.label]));
    enrichedResponses = responses.map(r => ({
      ...r,
      field_label: fieldMap.get(r.form_field_id) ?? 'Unknown',
    })) as FormResponse[];
  }

  return {
    ...booking,
    ticket_type_name: ticket?.name ?? 'Unknown',
    add_ons: enrichedAddOns,
    form_responses: enrichedResponses,
  } as EventBooking;
}

export async function cancelBooking(id: string): Promise<void> {
  const { error } = await supabase
    .from('event_bookings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('cancelBooking failed:', error);
}

export async function refundBooking(id: string): Promise<{ error?: string }> {
  // Get booking to find payment intent
  const { data: booking } = await supabase
    .from('event_bookings')
    .select('stripe_payment_intent_id, total_amount')
    .eq('id', id)
    .single();

  if (!booking?.stripe_payment_intent_id) {
    // No payment to refund, just mark as refunded
    await supabase
      .from('event_bookings')
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', id);
    return {};
  }

  // Call existing stripe-refund edge function
  const { data, error } = await supabase.functions.invoke('stripe-refund', {
    body: { payment_intent_id: booking.stripe_payment_intent_id },
  });

  if (error) {
    return { error: error.message };
  }

  await supabase
    .from('event_bookings')
    .update({ status: 'refunded', updated_at: new Date().toISOString() })
    .eq('id', id);

  return {};
}

// ── Waitlist ──

export async function getWaitlist(eventId: string): Promise<EventWaitlistEntry[]> {
  const { data: entries } = await supabase
    .from('event_waitlist_entries')
    .select('*')
    .eq('event_id', eventId)
    .order('position');

  if (!entries?.length) return [];

  // Enrich with ticket type names
  const ticketIds = [...new Set(entries.map(e => e.ticket_type_id).filter(Boolean))];
  let ticketMap = new Map<string, string>();
  if (ticketIds.length) {
    const { data: tickets } = await supabase
      .from('ticket_types')
      .select('id, name')
      .in('id', ticketIds);
    ticketMap = new Map((tickets ?? []).map(t => [t.id, t.name]));
  }

  return entries.map(e => ({
    ...e,
    ticket_type_name: e.ticket_type_id ? ticketMap.get(e.ticket_type_id) ?? undefined : undefined,
  })) as EventWaitlistEntry[];
}

export async function removeWaitlistEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('event_waitlist_entries')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('removeWaitlistEntry failed:', error);
}

// ── Stats ──

export async function getEventStats(eventId: string): Promise<EventStats> {
  const { data: event } = await supabase
    .from('events')
    .select('total_capacity')
    .eq('id', eventId)
    .single();

  const { data: bookings } = await supabase
    .from('event_bookings')
    .select('status, total_amount, quantity')
    .eq('event_id', eventId);

  const { data: waitlist } = await supabase
    .from('event_waitlist_entries')
    .select('id')
    .eq('event_id', eventId)
    .eq('status', 'waiting');

  let confirmed = 0, pending = 0, cancelled = 0, refunded = 0, revenue = 0;
  for (const b of bookings ?? []) {
    const qty = b.quantity ?? 1;
    switch (b.status) {
      case 'confirmed': confirmed += qty; revenue += b.total_amount; break;
      case 'pending': pending += qty; break;
      case 'cancelled': cancelled += qty; break;
      case 'refunded': refunded += qty; break;
    }
  }

  const totalBooked = confirmed + pending;

  return {
    total_booked: totalBooked,
    total_confirmed: confirmed,
    total_pending: pending,
    total_cancelled: cancelled,
    total_refunded: refunded,
    total_revenue: revenue,
    spots_remaining: (event?.total_capacity ?? 0) - totalBooked,
    waitlist_count: waitlist?.length ?? 0,
  };
}

// ── CSV Export ──

export function exportBookingsCsv(
  bookings: EventBooking[],
  formFields: EventFormField[],
): string {
  const headers = [
    'First Name', 'Last Name', 'Email', 'Phone',
    'Ticket Type', 'Quantity', 'Status', 'Total ($)',
    'Notes', 'Created At',
    ...formFields.map(f => f.label),
  ];

  const rows = bookings.map(b => {
    const formValues = formFields.map(f => {
      const response = b.form_responses?.find(r => r.form_field_id === f.id);
      return response?.value ?? '';
    });

    return [
      b.first_name,
      b.last_name,
      b.email,
      b.phone ?? '',
      b.ticket_type_name ?? '',
      String(b.quantity ?? 1),
      b.status,
      (b.total_amount / 100).toFixed(2),
      b.notes ?? '',
      new Date(b.created_at).toLocaleDateString(),
      ...formValues,
    ];
  });

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [
    headers.map(escape).join(','),
    ...rows.map(r => r.map(escape).join(',')),
  ].join('\n');
}

// ── Duplicate Event ──

export async function duplicateEvent(eventId: string): Promise<string | null> {
  const event = await getEvent(eventId);
  if (!event) return null;

  const now = new Date().toISOString();
  const newEventId = crypto.randomUUID();

  // Copy event
  const { id, created_at, updated_at, slug, ...eventData } = event as any;
  await supabase.from('events').insert({
    ...eventData,
    id: newEventId,
    name: `${event.name} (Copy)`,
    slug: `${event.slug}-copy-${Date.now()}`,
    status: 'draft',
    created_at: now,
    updated_at: now,
  });

  // Copy ticket types
  const ticketTypes = await getTicketTypes(eventId);
  for (const tt of ticketTypes) {
    const { id: ttId, event_id, sold_count, created_at: ttCa, updated_at: ttUa, ...ttData } = tt as any;
    await supabase.from('ticket_types').insert({
      ...ttData,
      id: crypto.randomUUID(),
      event_id: newEventId,
      created_at: now,
      updated_at: now,
    });
  }

  // Copy add-on groups
  const groups = await getAddOnGroups(eventId);
  const groupIdMap = new Map<string, string>();
  for (const g of groups) {
    const newGroupId = crypto.randomUUID();
    groupIdMap.set(g.id, newGroupId);
    const { id: gId, event_id, created_at: gCa, updated_at: gUa, ...gData } = g as any;
    await supabase.from('add_on_groups').insert({
      ...gData,
      id: newGroupId,
      event_id: newEventId,
      created_at: now,
      updated_at: now,
    });
  }

  // Copy add-ons
  const addOns = await getAddOns(eventId);
  for (const ao of addOns) {
    const { id: aoId, event_id, add_on_group_id, sold_count, created_at: aoCa, updated_at: aoUa, ...aoData } = ao as any;
    await supabase.from('add_ons').insert({
      ...aoData,
      id: crypto.randomUUID(),
      event_id: newEventId,
      add_on_group_id: add_on_group_id ? groupIdMap.get(add_on_group_id) ?? null : null,
      created_at: now,
      updated_at: now,
    });
  }

  // Copy form fields
  const fields = await getFormFields(eventId);
  for (const f of fields) {
    const { id: fId, event_id, created_at: fCa, updated_at: fUa, ...fData } = f as any;
    await supabase.from('event_form_fields').insert({
      ...fData,
      id: crypto.randomUUID(),
      event_id: newEventId,
      created_at: now,
      updated_at: now,
    });
  }

  return newEventId;
}
