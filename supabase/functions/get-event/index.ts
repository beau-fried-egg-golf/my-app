import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  let slug = url.searchParams.get("slug");

  // Also accept POST body
  if (!slug && req.method === "POST") {
    const body = await req.json();
    slug = body.slug;
  }

  if (!slug) {
    return new Response(
      JSON.stringify({ error: "slug is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Fetch event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (eventError || !event) {
    return new Response(
      JSON.stringify({ error: "Event not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const token = url.searchParams.get("token");

  // Fetch ticket types
  let ticketQuery = supabase
    .from("ticket_types")
    .select("*")
    .eq("event_id", event.id)
    .order("sort_order");

  if (!token) {
    ticketQuery = ticketQuery.eq("visibility", "public");
  }

  const { data: ticketTypes } = await ticketQuery;

  // Fetch add-on groups
  const { data: addOnGroups } = await supabase
    .from("add_on_groups")
    .select("*")
    .eq("event_id", event.id)
    .order("sort_order");

  // Fetch add-ons (only public unless token)
  let addOnQuery = supabase
    .from("add_ons")
    .select("*")
    .eq("event_id", event.id)
    .order("sort_order");

  if (!token) {
    addOnQuery = addOnQuery.eq("visibility", "public");
  }

  const { data: addOns } = await addOnQuery;

  // Fetch form fields
  const { data: formFields } = await supabase
    .from("event_form_fields")
    .select("*")
    .eq("event_id", event.id)
    .order("sort_order");

  // Count bookings for availability (sum quantity)
  const { data: bookings } = await supabase
    .from("event_bookings")
    .select("ticket_type_id, quantity")
    .eq("event_id", event.id)
    .in("status", ["pending", "confirmed"]);

  const bookingCounts = new Map<string, number>();
  let totalBooked = 0;
  for (const b of bookings ?? []) {
    const qty = (b as any).quantity ?? 1;
    bookingCounts.set(b.ticket_type_id, (bookingCounts.get(b.ticket_type_id) ?? 0) + qty);
    totalBooked += qty;
  }

  // Get active booking IDs for add-on counting
  const { data: bookingsWithIds } = await supabase
    .from("event_bookings")
    .select("id, ticket_type_id")
    .eq("event_id", event.id)
    .in("status", ["pending", "confirmed"]);

  const activeBookingIds = (bookingsWithIds ?? []).map((b: any) => b.id);

  let addOnCounts = new Map<string, number>();
  if (activeBookingIds.length > 0) {
    const { data: aoBookings } = await supabase
      .from("event_booking_add_ons")
      .select("add_on_id, quantity")
      .in("booking_id", activeBookingIds);

    for (const ab of aoBookings ?? []) {
      const aoQty = (ab as any).quantity ?? 1;
      addOnCounts.set(ab.add_on_id, (addOnCounts.get(ab.add_on_id) ?? 0) + aoQty);
    }
  }

  // Enrich ticket types with availability and sale status
  const now = new Date();
  const enrichedTickets = (ticketTypes ?? []).map((tt: any) => {
    const saleStarted = !tt.sale_starts_at || new Date(tt.sale_starts_at) <= now;
    const saleEnded = tt.sale_ends_at && new Date(tt.sale_ends_at) < now;
    const saleStatus = saleEnded ? "ended" : saleStarted ? "active" : "not_started";
    return {
      ...tt,
      sold_count: bookingCounts.get(tt.id) ?? 0,
      available: tt.capacity ? tt.capacity - (bookingCounts.get(tt.id) ?? 0) : null,
      on_sale: saleStatus === "active",
      sale_status: saleStatus,
    };
  });

  // Enrich add-ons with availability
  const enrichedAddOns = (addOns ?? []).map((ao: any) => ({
    ...ao,
    sold_count: addOnCounts.get(ao.id) ?? 0,
    available: ao.capacity ? ao.capacity - (addOnCounts.get(ao.id) ?? 0) : null,
  }));

  return new Response(
    JSON.stringify({
      event: {
        ...event,
        timezone: event.timezone ?? "America/New_York",
        total_booked: totalBooked,
        spots_remaining: event.total_capacity - totalBooked,
      },
      ticket_types: enrichedTickets,
      add_on_groups: addOnGroups ?? [],
      add_ons: enrichedAddOns,
      form_fields: formFields ?? [],
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
