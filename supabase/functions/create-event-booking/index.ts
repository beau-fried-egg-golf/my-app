import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const {
    event_id,
    ticket_type_id,
    add_on_ids = [],
    add_on_quantities = [],
    first_name,
    last_name,
    email,
    phone,
    notes,
    quantity = 1,
    form_responses = [],
    success_url,
    cancel_url,
  } = await req.json();

  if (!event_id || !ticket_type_id || !first_name || !last_name || !email) {
    return new Response(
      JSON.stringify({ error: "event_id, ticket_type_id, first_name, last_name, and email are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Atomic capacity check + booking creation
  const { data: result, error: rpcError } = await supabase.rpc("attempt_event_booking", {
    p_event_id: event_id,
    p_ticket_type_id: ticket_type_id,
    p_first_name: first_name,
    p_last_name: last_name,
    p_email: email,
    p_phone: phone || null,
    p_notes: notes || null,
    p_add_on_ids: add_on_ids,
    p_quantity: quantity,
    p_add_on_qtys: add_on_quantities,
  });

  if (rpcError) {
    return new Response(
      JSON.stringify({ error: "Booking failed", details: rpcError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (result.error) {
    return new Response(
      JSON.stringify(result),
      { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const bookingId = result.booking_id;
  const totalAmount = result.total_amount;

  // Save form responses
  if (form_responses.length > 0) {
    const responseRows = form_responses.map((fr: { field_id: string; value: string }) => ({
      booking_id: bookingId,
      form_field_id: fr.field_id,
      value: fr.value,
    }));
    await supabase.from("event_form_responses").insert(responseRows);
  }

  // If free booking, confirm directly
  if (totalAmount === 0) {
    await supabase
      .from("event_bookings")
      .update({ status: "confirmed", expires_at: null, updated_at: new Date().toISOString() })
      .eq("id", bookingId);

    return new Response(
      JSON.stringify({ booking_id: bookingId, status: "confirmed", free: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Fetch event + ticket + add-ons for Stripe line items
  const { data: event } = await supabase
    .from("events")
    .select("name, slug")
    .eq("id", event_id)
    .single();

  const { data: ticket } = await supabase
    .from("ticket_types")
    .select("name, price")
    .eq("id", ticket_type_id)
    .single();

  // Build Stripe line items
  const lineItems: string[][] = [];

  // Ticket line item (unit_amount is per-ticket, quantity from request)
  lineItems.push([
    `line_items[0][price_data][currency]`, "usd",
    `line_items[0][price_data][unit_amount]`, String(ticket?.price ?? 0),
    `line_items[0][price_data][product_data][name]`, `${event?.name ?? "Event"} — ${ticket?.name ?? "Ticket"}`,
    `line_items[0][quantity]`, String(quantity),
  ]);

  // Add-on line items
  if (add_on_ids.length > 0) {
    const { data: addOns } = await supabase
      .from("add_ons")
      .select("id, name, price")
      .in("id", add_on_ids);

    (addOns ?? []).forEach((ao: any, idx: number) => {
      const i = idx + 1;
      // Find the add-on's position in add_on_ids to get its quantity
      const aoIdx = add_on_ids.indexOf(ao.id);
      const aoQty = aoIdx >= 0 && aoIdx < add_on_quantities.length ? add_on_quantities[aoIdx] : 1;
      lineItems.push([
        `line_items[${i}][price_data][currency]`, "usd",
        `line_items[${i}][price_data][unit_amount]`, String(ao.price),
        `line_items[${i}][price_data][product_data][name]`, ao.name,
        `line_items[${i}][quantity]`, String(aoQty),
      ]);
    });
  }

  // Build params
  const defaultSuccessUrl = success_url || `${Deno.env.get("WIDGET_BASE_URL") || "https://friedegggc.com"}/embed/${event?.slug}?booking=${bookingId}&status=success`;
  const defaultCancelUrl = cancel_url || `${Deno.env.get("WIDGET_BASE_URL") || "https://friedegggc.com"}/embed/${event?.slug}?booking=${bookingId}&status=cancelled`;

  const params = new URLSearchParams({
    mode: "payment",
    client_reference_id: bookingId,
    customer_email: email,
    success_url: defaultSuccessUrl,
    cancel_url: defaultCancelUrl,
    "metadata[booking_id]": bookingId,
    "metadata[event_id]": event_id,
    "metadata[source]": "events_platform",
    "expires_at": String(Math.floor(Date.now() / 1000) + 30 * 60), // 30 min
  });

  // Add line items
  for (const items of lineItems) {
    for (let i = 0; i < items.length; i += 2) {
      params.append(items[i], items[i + 1]);
    }
  }

  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!stripeRes.ok) {
    const err = await stripeRes.text();
    // Cancel the pending booking since Stripe failed
    await supabase
      .from("event_bookings")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", bookingId);

    return new Response(
      JSON.stringify({ error: "Failed to create checkout session", details: err }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const session = await stripeRes.json();

  // Store Stripe session ID on booking
  await supabase
    .from("event_bookings")
    .update({
      stripe_checkout_session_id: session.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  return new Response(
    JSON.stringify({
      booking_id: bookingId,
      checkout_url: session.url,
      session_id: session.id,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
