import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_MEMBERSHIP_WEBHOOK_SECRET = Deno.env.get("STRIPE_MEMBERSHIP_WEBHOOK_SECRET")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
): Promise<boolean> {
  const parts = sigHeader.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const signature = parts.find((p) => p.startsWith("v1="))?.slice(3);

  if (!timestamp || !signature) return false;

  // Reject events older than 5 minutes
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

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// Look up the profile user ID by stripe_customer_id or by email (via Stripe customer fetch)
async function findProfileUserId(
  supabase: ReturnType<typeof createClient>,
  stripeCustomerId: string,
): Promise<string | null> {
  // First try: direct lookup by stripe_customer_id (fast, indexed)
  const { data: profileByStripe } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();

  if (profileByStripe) return profileByStripe.id;

  // Second try: fetch customer email from Stripe, then look up by email
  try {
    const resp = await fetch(`https://api.stripe.com/v1/customers/${stripeCustomerId}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    });
    if (!resp.ok) return null;
    const customer = await resp.json();
    const email = customer.email;
    if (!email) return null;

    const { data: userId } = await supabase.rpc("get_user_id_by_email", {
      lookup_email: email,
    });

    return userId ?? null;
  } catch {
    return null;
  }
}

function mapSubscriptionStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    default:
      return "inactive";
  }
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

  const valid = await verifyStripeSignature(body, sigHeader, STRIPE_MEMBERSHIP_WEBHOOK_SECRET);
  if (!valid) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);
  const supabase = getSupabase();

  try {
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.resumed"
    ) {
      const subscription = event.data.object;
      const stripeCustomerId = subscription.customer;
      const userId = await findProfileUserId(supabase, stripeCustomerId);

      if (!userId) {
        console.log(`No matching profile for Stripe customer ${stripeCustomerId} — skipping`);
        return new Response(JSON.stringify({ received: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const status = mapSubscriptionStatus(subscription.status);
      const tier = (status === "active" || status === "trialing") ? "standard" : "free";

      await supabase
        .from("profiles")
        .update({
          subscription_tier: tier,
          subscription_status: status,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: subscription.id,
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
        })
        .eq("id", userId);
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const stripeCustomerId = subscription.customer;
      const userId = await findProfileUserId(supabase, stripeCustomerId);

      if (userId) {
        await supabase
          .from("profiles")
          .update({
            subscription_tier: "free",
            subscription_status: "canceled",
            stripe_subscription_id: subscription.id,
            current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          })
          .eq("id", userId);
      }
    } else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const stripeCustomerId = invoice.customer;
      const userId = await findProfileUserId(supabase, stripeCustomerId);

      if (userId) {
        await supabase
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("id", userId);
      }
    }
  } catch (err) {
    console.error("Error processing membership webhook:", err);
    // Still return 200 so Stripe doesn't retry
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
