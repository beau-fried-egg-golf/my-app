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
      JSON.stringify({ skipped: true, reason: "No email found" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Look up name from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user_id)
    .single();

  const name = profile?.name ?? "there";
  const email = authUser.user.email;

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
            <td style="padding:40px;">
              <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;">Welcome to Fried Egg Golf Club, ${name}!</h2>
              <p style="color:#555555;font-size:16px;line-height:1.6;margin:0 0 16px;">
                Your profile is all set. Here's what you can do now:
              </p>
              <ul style="color:#555555;font-size:16px;line-height:1.8;padding-left:20px;margin:0 0 24px;">
                <li>Write course reviews and share photos</li>
                <li>Track your course passport</li>
                <li>Join groups and meetups nearby</li>
                <li>Connect with other golfers via DMs</li>
              </ul>
              <p style="color:#555555;font-size:16px;line-height:1.6;margin:0;">
                See you on the course!
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
      subject: "Welcome to Fried Egg Golf Club!",
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
    JSON.stringify({ success: true, resend_id: resendResult.id }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
