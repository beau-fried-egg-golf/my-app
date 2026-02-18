import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildEmailHtml(subject: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:#1a1a1a;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;font-size:28px;margin:0;letter-spacing:2px;">FRIED EGG GOLF CLUB</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              ${bodyContent}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f5f5f0;padding:24px 40px;text-align:center;">
              <p style="color:#999999;font-size:13px;margin:0;">
                Fried Egg Golf Club &mdash; Events
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const { type, booking_id, waitlist_id, event_id } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Fetch event details
  const { data: event } = await supabase
    .from("events")
    .select("name, date, time, location, slug")
    .eq("id", event_id)
    .single();

  if (!event) {
    return new Response(
      JSON.stringify({ error: "Event not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const eventDate = new Date(event.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  let toEmail = "";
  let subject = "";
  let bodyContent = "";

  if (type === "booking_confirmation" && booking_id) {
    const { data: booking } = await supabase
      .from("event_bookings")
      .select("first_name, last_name, email, total_amount")
      .eq("id", booking_id)
      .single();

    if (!booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    toEmail = booking.email;
    subject = `Booking Confirmed — ${event.name}`;
    const total = booking.total_amount > 0
      ? `$${(booking.total_amount / 100).toFixed(2)}`
      : "Free";

    bodyContent = `
      <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;">You're In!</h2>
      <p style="color:#555555;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hi ${booking.first_name}, your booking for <strong>${event.name}</strong> has been confirmed.
      </p>
      <table style="width:100%;margin:16px 0;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#888;font-size:14px;">Event</td>
          <td style="padding:8px 0;font-size:14px;font-weight:600;text-align:right;">${event.name}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#888;font-size:14px;">Date</td>
          <td style="padding:8px 0;font-size:14px;text-align:right;">${eventDate}</td>
        </tr>
        ${event.location ? `<tr>
          <td style="padding:8px 0;color:#888;font-size:14px;">Location</td>
          <td style="padding:8px 0;font-size:14px;text-align:right;">${event.location}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:8px 0;color:#888;font-size:14px;">Total</td>
          <td style="padding:8px 0;font-size:14px;font-weight:600;text-align:right;">${total}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#888;font-size:14px;">Booking ID</td>
          <td style="padding:8px 0;font-size:12px;font-family:monospace;text-align:right;">${booking_id.slice(0, 8)}</td>
        </tr>
      </table>
    `;
  } else if (type === "waitlist_confirmation" && waitlist_id) {
    const { data: entry } = await supabase
      .from("event_waitlist_entries")
      .select("first_name, email, position")
      .eq("id", waitlist_id)
      .single();

    if (!entry) {
      return new Response(JSON.stringify({ error: "Waitlist entry not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    toEmail = entry.email;
    subject = `Waitlist Confirmed — ${event.name}`;
    bodyContent = `
      <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;">You're on the Waitlist</h2>
      <p style="color:#555555;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hi ${entry.first_name}, you're #${entry.position} on the waitlist for <strong>${event.name}</strong> on ${eventDate}.
      </p>
      <p style="color:#555555;font-size:16px;line-height:1.6;margin:0 0 16px;">
        We'll email you if a spot opens up.
      </p>
    `;
  } else if (type === "waitlist_spot_available" && waitlist_id) {
    const { data: entry } = await supabase
      .from("event_waitlist_entries")
      .select("first_name, email, offer_expires_at")
      .eq("id", waitlist_id)
      .single();

    if (!entry) {
      return new Response(JSON.stringify({ error: "Waitlist entry not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    toEmail = entry.email;
    subject = `A Spot Opened Up — ${event.name}`;
    const expiryDate = entry.offer_expires_at
      ? new Date(entry.offer_expires_at).toLocaleString("en-US", {
          month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
        })
      : "soon";

    bodyContent = `
      <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;">A Spot Just Opened Up!</h2>
      <p style="color:#555555;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hi ${entry.first_name}, great news — a spot is now available for <strong>${event.name}</strong>.
      </p>
      <p style="color:#555555;font-size:16px;line-height:1.6;margin:0 0 24px;">
        This offer expires ${expiryDate}. Claim your spot now:
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="background-color:#1a1a1a;border-radius:6px;padding:14px 32px;">
            <a href="${Deno.env.get("WIDGET_BASE_URL") || "https://friedegggc.com"}/embed/${event.slug}" style="color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;">Claim Your Spot</a>
          </td>
        </tr>
      </table>
    `;
  } else if (type === "booking_cancellation" && booking_id) {
    const { data: booking } = await supabase
      .from("event_bookings")
      .select("first_name, email")
      .eq("id", booking_id)
      .single();

    if (!booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    toEmail = booking.email;
    subject = `Booking Cancelled — ${event.name}`;
    bodyContent = `
      <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;">Booking Cancelled</h2>
      <p style="color:#555555;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hi ${booking.first_name}, your booking for <strong>${event.name}</strong> on ${eventDate} has been cancelled.
      </p>
      <p style="color:#555555;font-size:16px;line-height:1.6;margin:0 0 16px;">
        If you were charged, a refund will be processed shortly.
      </p>
    `;
  } else {
    return new Response(
      JSON.stringify({ error: "Invalid email type or missing ID" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const html = buildEmailHtml(subject, bodyContent);

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Fried Egg Golf Club <onboarding@resend.dev>",
      to: [toEmail],
      subject,
      html,
    }),
  });

  const result = await resendRes.json();

  if (!resendRes.ok) {
    return new Response(
      JSON.stringify({ error: "Failed to send email", details: result }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
