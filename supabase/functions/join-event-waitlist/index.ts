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

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const {
    event_id,
    ticket_type_id,
    first_name,
    last_name,
    email,
    phone,
    desired_add_on_ids = [],
  } = await req.json();

  if (!event_id || !first_name || !last_name || !email) {
    return new Response(
      JSON.stringify({ error: "event_id, first_name, last_name, and email are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Check event exists and waitlist is enabled
  const { data: event } = await supabase
    .from("events")
    .select("id, waitlist_enabled, name")
    .eq("id", event_id)
    .single();

  if (!event) {
    return new Response(
      JSON.stringify({ error: "Event not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!event.waitlist_enabled) {
    return new Response(
      JSON.stringify({ error: "Waitlist not enabled for this event" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Check for duplicate email on waitlist
  const { data: existing } = await supabase
    .from("event_waitlist_entries")
    .select("id")
    .eq("event_id", event_id)
    .eq("email", email)
    .in("status", ["waiting", "notified"])
    .maybeSingle();

  if (existing) {
    return new Response(
      JSON.stringify({ error: "You're already on the waitlist for this event" }),
      { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Get next position
  const { data: maxEntry } = await supabase
    .from("event_waitlist_entries")
    .select("position")
    .eq("event_id", event_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (maxEntry?.position ?? 0) + 1;

  // Insert waitlist entry
  const { data: entry, error: insertError } = await supabase
    .from("event_waitlist_entries")
    .insert({
      event_id,
      ticket_type_id: ticket_type_id || null,
      email,
      first_name,
      last_name,
      phone: phone || null,
      position: nextPosition,
      status: "waiting",
      desired_add_on_ids,
    })
    .select("id, position")
    .single();

  if (insertError) {
    return new Response(
      JSON.stringify({ error: "Failed to join waitlist", details: insertError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // TODO: Create Stripe SetupIntent for payment method capture
  // For now, waitlist entries don't require payment method upfront

  return new Response(
    JSON.stringify({
      waitlist_entry_id: entry.id,
      position: entry.position,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
