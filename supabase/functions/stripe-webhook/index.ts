import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

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

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const sigHeader = req.headers.get("stripe-signature");
  if (!sigHeader) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();

  const valid = await verifyStripeSignature(body, sigHeader, STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const memberId = session.client_reference_id;

    if (memberId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      const { error: updateError } = await supabase
        .from("meetup_members")
        .update({ payment_status: "paid", stripe_payment_intent_id: session.payment_intent })
        .eq("id", memberId);

      if (!updateError) {
        // Look up the member to get user_id, meetup_id, spots
        const { data: member } = await supabase
          .from("meetup_members")
          .select("user_id, meetup_id, spots")
          .eq("id", memberId)
          .single();

        if (member) {
          // Look up the meetup for course_id, host_id, name
          const { data: meetup } = await supabase
            .from("meetups")
            .select("course_id, host_id, name")
            .eq("id", member.meetup_id)
            .single();

          // Update member_count on the meetup
          const spots = member.spots ?? 1;
          await supabase.rpc("increment_member_count", {
            row_id: member.meetup_id,
            amount: spots,
          }).then(({ error: rpcError }) => {
            // Fallback: if RPC doesn't exist, do a manual update
            if (rpcError) {
              return supabase
                .from("meetups")
                .select("member_count")
                .eq("id", member.meetup_id)
                .single()
                .then(({ data: current }) => {
                  return supabase
                    .from("meetups")
                    .update({ member_count: (current?.member_count ?? 0) + spots })
                    .eq("id", member.meetup_id);
                });
            }
          });

          // Insert activity (meetup_signup)
          await supabase.from("activities").insert({
            type: "meetup_signup",
            user_id: member.user_id,
            meetup_id: member.meetup_id,
            course_id: meetup?.course_id || null,
          });

          // Notify host if exists and different from the signing-up user
          if (meetup && meetup.host_id && meetup.host_id !== member.user_id) {
            // Get the user's name for the push notification
            const { data: profile } = await supabase
              .from("profiles")
              .select("name")
              .eq("id", member.user_id)
              .single();

            await supabase.from("notifications").insert({
              user_id: meetup.host_id,
              type: "meetup_signup",
              actor_id: member.user_id,
              meetup_id: member.meetup_id,
            });

            // Send push notification to host
            const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
            const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                recipient_id: meetup.host_id,
                title: "New Signup",
                body: `${profile?.name ?? "Someone"} signed up for ${meetup.name}`,
                data: { meetup_id: member.meetup_id },
                push_type: "notification",
              }),
            });
          }
        }
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
