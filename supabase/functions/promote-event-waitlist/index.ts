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

  const { event_id } = await req.json();

  if (!event_id) {
    return new Response(
      JSON.stringify({ error: "event_id is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date().toISOString();

  // Find next waiting entry by position
  const { data: nextEntry } = await supabase
    .from("event_waitlist_entries")
    .select("*")
    .eq("event_id", event_id)
    .eq("status", "waiting")
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!nextEntry) {
    return new Response(
      JSON.stringify({ message: "No waiting entries to promote" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // If they have a saved payment method, charge them directly
  if (nextEntry.stripe_payment_method_id) {
    // TODO: Create PaymentIntent with saved payment method
    // For now, send notification instead
  }

  // Notify them via email with a claim link
  const offerExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  await supabase
    .from("event_waitlist_entries")
    .update({
      status: "notified",
      notified_at: now,
      offer_expires_at: offerExpiry,
      updated_at: now,
    })
    .eq("id", nextEntry.id);

  // Send notification email
  try {
    await supabase.functions.invoke("send-event-email", {
      body: {
        type: "waitlist_spot_available",
        waitlist_id: nextEntry.id,
        event_id,
      },
    });
  } catch (err) {
    console.error("Failed to send waitlist notification email:", err);
  }

  return new Response(
    JSON.stringify({
      promoted: true,
      waitlist_entry_id: nextEntry.id,
      email: nextEntry.email,
      offer_expires_at: offerExpiry,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
