import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

  const { reservation_id, amount_cents } = await req.json();

  if (!reservation_id) {
    return new Response(
      JSON.stringify({ error: "reservation_id is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Look up the reservation to get the payment intent ID
  const { data: reservation, error: fetchError } = await supabase
    .from("reservations")
    .select("stripe_payment_intent_id, total_price, status")
    .eq("id", reservation_id)
    .single();

  if (fetchError || !reservation) {
    return new Response(
      JSON.stringify({ error: "Reservation not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!reservation.stripe_payment_intent_id) {
    return new Response(
      JSON.stringify({ error: "No payment found for this reservation" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Create refund (partial if amount_cents provided, otherwise full)
  const refundParams = new URLSearchParams({
    payment_intent: reservation.stripe_payment_intent_id,
  });

  if (amount_cents) {
    refundParams.set("amount", String(amount_cents));
  }

  const refundRes = await fetch("https://api.stripe.com/v1/refunds", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: refundParams.toString(),
  });

  if (!refundRes.ok) {
    const err = await refundRes.text();
    return new Response(
      JSON.stringify({ error: "Refund failed", details: err }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const refund = await refundRes.json();

  // Update reservation with refund info
  await supabase
    .from("reservations")
    .update({
      stripe_refund_id: refund.id,
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reservation_id);

  return new Response(
    JSON.stringify({ refund_id: refund.id, status: refund.status }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
