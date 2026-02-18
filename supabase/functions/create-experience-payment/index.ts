import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

  const { reservation_id, amount_cents, description } = await req.json();

  if (!reservation_id || !amount_cents) {
    return new Response(
      JSON.stringify({ error: "reservation_id and amount_cents are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Create a PaymentIntent (not Checkout Session) for in-app payment via Payment Sheet
  const params = new URLSearchParams({
    amount: String(amount_cents),
    currency: "usd",
    "automatic_payment_methods[enabled]": "true",
    "metadata[reservation_id]": reservation_id,
    description: description || "FEGC Experience Booking",
  });

  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(
      JSON.stringify({ error: "Failed to create payment intent", details: err }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const paymentIntent = await res.json();

  return new Response(
    JSON.stringify({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
