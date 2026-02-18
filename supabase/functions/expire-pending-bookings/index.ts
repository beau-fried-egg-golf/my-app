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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date().toISOString();

  // Find expired pending bookings
  const { data: expiredBookings } = await supabase
    .from("event_bookings")
    .select("id, event_id")
    .eq("status", "pending")
    .lt("expires_at", now);

  if (!expiredBookings?.length) {
    return new Response(
      JSON.stringify({ expired: 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Cancel expired bookings
  const expiredIds = expiredBookings.map(b => b.id);
  await supabase
    .from("event_bookings")
    .update({ status: "cancelled", updated_at: now })
    .in("id", expiredIds);

  // Collect unique event IDs to trigger waitlist promotion
  const eventIds = [...new Set(expiredBookings.map(b => b.event_id))];

  // Check which events have waitlist enabled
  const { data: events } = await supabase
    .from("events")
    .select("id, waitlist_enabled")
    .in("id", eventIds)
    .eq("waitlist_enabled", true);

  // Trigger waitlist promotion for each event with waitlist
  for (const event of events ?? []) {
    try {
      await supabase.functions.invoke("promote-event-waitlist", {
        body: { event_id: event.id },
      });
    } catch (err) {
      console.error(`Failed to promote waitlist for event ${event.id}:`, err);
    }
  }

  // Also expire waitlist offers that have passed their deadline
  const { data: expiredOffers } = await supabase
    .from("event_waitlist_entries")
    .select("id, event_id")
    .eq("status", "notified")
    .lt("offer_expires_at", now);

  if (expiredOffers?.length) {
    const expiredOfferIds = expiredOffers.map(o => o.id);
    await supabase
      .from("event_waitlist_entries")
      .update({ status: "expired", updated_at: now })
      .in("id", expiredOfferIds);

    // Promote next person for each affected event
    const offerEventIds = [...new Set(expiredOffers.map(o => o.event_id))];
    for (const eventId of offerEventIds) {
      try {
        await supabase.functions.invoke("promote-event-waitlist", {
          body: { event_id: eventId },
        });
      } catch (err) {
        console.error(`Failed to promote waitlist for event ${eventId}:`, err);
      }
    }
  }

  return new Response(
    JSON.stringify({
      expired_bookings: expiredIds.length,
      expired_offers: expiredOffers?.length ?? 0,
      events_promoted: eventIds.length,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
