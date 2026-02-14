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

  const { member_id } = await req.json();
  if (!member_id) {
    return new Response(JSON.stringify({ error: "member_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Look up the member record
  const { data: member, error: lookupError } = await supabase
    .from("meetup_members")
    .select("id, stripe_payment_intent_id, payment_status")
    .eq("id", member_id)
    .single();

  if (lookupError || !member) {
    return new Response(JSON.stringify({ error: "Member not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!member.stripe_payment_intent_id) {
    return new Response(JSON.stringify({ error: "No payment intent found for this member" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Issue refund via Stripe API
  const refundRes = await fetch("https://api.stripe.com/v1/refunds", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `payment_intent=${member.stripe_payment_intent_id}`,
  });

  if (!refundRes.ok) {
    const err = await refundRes.text();
    return new Response(JSON.stringify({ error: "Stripe refund failed", details: err }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Mark as refunded then delete
  await supabase
    .from("meetup_members")
    .update({ payment_status: "refunded" })
    .eq("id", member_id);

  await supabase
    .from("meetup_members")
    .delete()
    .eq("id", member_id);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
