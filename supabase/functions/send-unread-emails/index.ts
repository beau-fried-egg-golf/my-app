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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  // Find candidates: email enabled AND (never emailed OR last email > 24 hours ago)
  const { data: candidates, error: candidatesError } = await supabase
    .from("profiles")
    .select("id, name, email_notifications_enabled, last_unread_email_at")
    .eq("email_notifications_enabled", true)
    .or(`last_unread_email_at.is.null,last_unread_email_at.lt.${oneDayAgo}`);

  if (candidatesError || !candidates || candidates.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, checked: 0, error: candidatesError?.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let sent = 0;
  const checked = candidates.length;

  for (const candidate of candidates) {
    // Find all conversations where this user is a participant
    const { data: convos } = await supabase
      .from("conversations")
      .select("id, user1_id, user2_id, user1_last_read_at, user2_last_read_at")
      .or(`user1_id.eq.${candidate.id},user2_id.eq.${candidate.id}`);

    if (!convos || convos.length === 0) continue;

    // Get all messages across conversations
    const convoIds = convos.map((c: { id: string }) => c.id);
    const { data: messages } = await supabase
      .from("messages")
      .select("conversation_id, user_id, created_at")
      .in("conversation_id", convoIds)
      .order("created_at", { ascending: false });

    if (!messages || messages.length === 0) continue;

    // Build a map of last_read_at per conversation for this user
    const lastReadMap = new Map<string, string | null>();
    for (const convo of convos) {
      const lastReadAt = convo.user1_id === candidate.id
        ? convo.user1_last_read_at
        : convo.user2_last_read_at;
      lastReadMap.set(convo.id, lastReadAt);
    }

    // Count individual unread messages across all conversations
    let unreadCount = 0;
    for (const msg of messages) {
      // Only count messages sent by the OTHER user
      if (msg.user_id === candidate.id) continue;
      // Only count if message is at least 5 minutes old (give push/in-app time)
      if (msg.created_at > fiveMinutesAgo) continue;

      const lastReadAt = lastReadMap.get(msg.conversation_id);
      if (!lastReadAt || new Date(msg.created_at) > new Date(lastReadAt)) {
        unreadCount++;
      }
    }

    if (unreadCount === 0) continue;

    // Look up email from auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(candidate.id);
    if (authError || !authUser?.user?.email) continue;

    const name = candidate.name ?? "there";
    const email = authUser.user.email;
    const subject = unreadCount === 1
      ? "You have 1 unread message on Fried Egg"
      : `You have ${unreadCount} unread messages on Fried Egg`;

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
            <td style="background-color:#1a1a1a;padding:24px 40px;text-align:center;">
              <h1 style="color:#ffffff;font-size:24px;margin:0;letter-spacing:2px;">FRIED EGG</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#1a1a1a;font-size:18px;font-weight:600;margin:0 0 12px;">
                Hey ${name},
              </p>
              <p style="color:#555555;font-size:16px;line-height:1.6;margin:0 0 24px;">
                You have <strong>${unreadCount} unread message${unreadCount === 1 ? "" : "s"}</strong> waiting for you on Fried Egg. Open the app to catch up!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f5f5f0;padding:20px 40px;text-align:center;">
              <p style="color:#999999;font-size:13px;margin:0;">
                You can disable these emails in your profile settings.
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
        from: "Fried Egg <onboarding@resend.dev>",
        to: [email],
        subject,
        html,
      }),
    });

    if (resendRes.ok) {
      // Update last_unread_email_at to prevent duplicate sends
      await supabase
        .from("profiles")
        .update({ last_unread_email_at: new Date().toISOString() })
        .eq("id", candidate.id);
      sent++;
    }
  }

  return new Response(
    JSON.stringify({ sent, checked }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
