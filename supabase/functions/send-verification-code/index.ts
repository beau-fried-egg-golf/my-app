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

  const { user_id } = await req.json();

  if (!user_id) {
    return new Response(
      JSON.stringify({ error: "user_id is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Look up user email from auth
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user_id);
  if (authError || !authUser?.user?.email) {
    return new Response(
      JSON.stringify({ error: "No email found for user" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const email = authUser.user.email;

  // Invalidate any previous unused codes for this user
  await supabase
    .from("email_verification_codes")
    .update({ used: true })
    .eq("user_id", user_id)
    .eq("used", false);

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // Insert new code with 10-minute expiry
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error: insertError } = await supabase
    .from("email_verification_codes")
    .insert({ user_id, code, expires_at: expiresAt });

  if (insertError) {
    return new Response(
      JSON.stringify({ error: "Failed to create verification code", details: insertError }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Send email via Resend
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

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
            <td style="padding:40px;text-align:center;">
              <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;">Verify Your Email</h2>
              <p style="color:#555555;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Enter this code in the app to verify your email address:
              </p>
              <div style="background-color:#f5f5f0;border-radius:8px;padding:20px;margin:0 auto 24px;display:inline-block;">
                <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1a1a1a;">${code}</span>
              </div>
              <p style="color:#999999;font-size:14px;line-height:1.6;margin:0;">
                This code expires in 10 minutes.
              </p>
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
      to: [email],
      subject: "Your Fried Egg Golf Club verification code",
      html,
    }),
  });

  const resendResult = await resendRes.json();

  if (!resendRes.ok) {
    return new Response(
      JSON.stringify({ error: "Resend API error", details: resendResult }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
