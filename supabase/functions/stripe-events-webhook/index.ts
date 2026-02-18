import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_EVENTS_WEBHOOK_SECRET = Deno.env.get("STRIPE_EVENTS_WEBHOOK_SECRET")!;

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
): Promise<boolean> {
  const parts = sigHeader.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const signature = parts.find((p) => p.startsWith("v1="))?.slice(3);

  if (!timestamp || !signature) return false;

  const age = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (age > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload),
  );
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expected === signature;
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const sigHeader = req.headers.get("stripe-signature");
  if (!sigHeader) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();

  const valid = await verifyStripeSignature(body, sigHeader, STRIPE_EVENTS_WEBHOOK_SECRET);
  if (!valid) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date().toISOString();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Only handle events-platform bookings
    if (session.metadata?.source !== "events_platform") {
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const bookingId = session.metadata?.booking_id || session.client_reference_id;

    if (bookingId) {
      await supabase
        .from("event_bookings")
        .update({
          status: "confirmed",
          stripe_payment_intent_id: session.payment_intent,
          expires_at: null,
          updated_at: now,
        })
        .eq("id", bookingId);

      // TODO: send confirmation email via send-event-email
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;

    if (session.metadata?.source !== "events_platform") {
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const bookingId = session.metadata?.booking_id || session.client_reference_id;

    if (bookingId) {
      await supabase
        .from("event_bookings")
        .update({
          status: "cancelled",
          updated_at: now,
        })
        .eq("id", bookingId);

      // TODO: trigger waitlist promotion if applicable
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object;
    const paymentIntentId = charge.payment_intent;

    if (paymentIntentId) {
      // Find booking by payment intent
      const { data: booking } = await supabase
        .from("event_bookings")
        .select("id, event_id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .single();

      if (booking) {
        await supabase
          .from("event_bookings")
          .update({
            status: "refunded",
            updated_at: now,
          })
          .eq("id", booking.id);

        // TODO: trigger waitlist promotion
        // TODO: send refund confirmation email
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
