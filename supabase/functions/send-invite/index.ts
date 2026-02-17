import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

  const { to_email, sender_name, note } = await req.json();

  if (!to_email || !sender_name) {
    return new Response(
      JSON.stringify({ error: "to_email and sender_name are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const noteSection = note
    ? `<p style="color:#555555;font-size:16px;line-height:1.6;margin:0 0 24px;padding:16px;background-color:#f5f5f0;border-radius:6px;font-style:italic;">"${note}"</p>`
    : "";

  const html = `
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
              <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;">You've been invited!</h2>
              <p style="color:#555555;font-size:16px;line-height:1.6;margin:0 0 16px;">
                ${sender_name} thinks you'd enjoy Fried Egg Golf Club — the social app for golfers who love the game.
              </p>
              ${noteSection}
              <p style="color:#555555;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Track your course passport, write reviews, join meetups, and connect with golfers near you.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background-color:#1a1a1a;border-radius:6px;padding:14px 32px;">
                    <a href="https://apps.apple.com/app/fried-egg-golf-club/id6742488393" style="color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;">Download the App</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f5f5f0;padding:24px 40px;text-align:center;">
              <p style="color:#999999;font-size:13px;margin:0;">
                Fried Egg Golf Club &mdash; the social app for golfers
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Fried Egg Golf Club <onboarding@resend.dev>",
      to: [to_email],
      subject: `${sender_name} invited you to Fried Egg Golf Club`,
      html,
    }),
  });

  const resendResult = await resendRes.json();

  if (!resendRes.ok) {
    return new Response(
      JSON.stringify({ error: "Failed to send invite", details: resendResult }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
