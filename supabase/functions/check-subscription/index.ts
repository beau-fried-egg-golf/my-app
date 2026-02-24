import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { user_id } = await req.json();
  if (!user_id) {
    return new Response(JSON.stringify({ error: "user_id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Get the user's email from auth.users
  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(user_id);
  if (userError || !user?.email) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Search Stripe for a customer with this email
  const searchResp = await fetch(
    `https://api.stripe.com/v1/customers/search?query=${encodeURIComponent(`email:"${user.email}"`)}`,
    { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } },
  );

  if (!searchResp.ok) {
    console.error("Stripe customer search failed:", await searchResp.text());
    return new Response(JSON.stringify({ error: "Stripe search failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const searchData = await searchResp.json();
  const customers = searchData.data ?? [];

  if (customers.length === 0) {
    return new Response(JSON.stringify({ subscription: "none" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check each customer for an active subscription
  for (const customer of customers) {
    const subsResp = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${customer.id}&status=active&limit=1`,
      { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } },
    );

    if (!subsResp.ok) continue;
    const subsData = await subsResp.json();
    const activeSubs = subsData.data ?? [];

    if (activeSubs.length > 0) {
      const sub = activeSubs[0];

      await supabase
        .from("profiles")
        .update({
          subscription_tier: "standard",
          subscription_status: "active",
          stripe_customer_id: customer.id,
          stripe_subscription_id: sub.id,
          current_period_end: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null,
        })
        .eq("id", user_id);

      return new Response(JSON.stringify({ subscription: "standard", synced: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Also check for trialing subscriptions
    const trialResp = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${customer.id}&status=trialing&limit=1`,
      { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } },
    );

    if (!trialResp.ok) continue;
    const trialData = await trialResp.json();
    const trialSubs = trialData.data ?? [];

    if (trialSubs.length > 0) {
      const sub = trialSubs[0];

      await supabase
        .from("profiles")
        .update({
          subscription_tier: "standard",
          subscription_status: "trialing",
          stripe_customer_id: customer.id,
          stripe_subscription_id: sub.id,
          current_period_end: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null,
        })
        .eq("id", user_id);

      return new Response(JSON.stringify({ subscription: "standard", synced: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ subscription: "none" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
