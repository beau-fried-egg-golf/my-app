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

  const { recipient_id, title, body, data, push_type } = await req.json();

  if (!recipient_id || !title || !body || !push_type) {
    return new Response(
      JSON.stringify({ error: "recipient_id, title, body, and push_type are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Look up recipient's push token and preferences
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("expo_push_token, push_dm_enabled, push_notifications_enabled, push_nearby_enabled")
    .eq("id", recipient_id)
    .single();

  if (profileError || !profile || !profile.expo_push_token) {
    return new Response(
      JSON.stringify({ skipped: true, reason: "No push token" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Check user preferences
  const prefMap: Record<string, boolean> = {
    dm: profile.push_dm_enabled ?? true,
    notification: profile.push_notifications_enabled ?? true,
    nearby_meetup: profile.push_nearby_enabled ?? true,
  };

  if (!prefMap[push_type]) {
    return new Response(
      JSON.stringify({ skipped: true, reason: "User disabled this push type" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Compute total unread count for badge
  const [{ count: unreadNotifications }, { data: convos }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", recipient_id)
      .eq("is_read", false),
    supabase
      .from("conversations")
      .select("user1_id, user2_id, user1_last_read_at, user2_last_read_at, updated_at")
      .or(`user1_id.eq.${recipient_id},user2_id.eq.${recipient_id}`),
  ]);
  const unreadDMs = (convos ?? []).filter(c => {
    const lastReadAt = c.user1_id === recipient_id ? c.user1_last_read_at : c.user2_last_read_at;
    return !lastReadAt || new Date(c.updated_at) > new Date(lastReadAt);
  }).length;
  const badge = (unreadNotifications ?? 0) + unreadDMs;

  // Send via Expo Push API
  const pushRes = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: profile.expo_push_token,
      title,
      body,
      data: data ?? {},
      sound: "default",
      badge,
    }),
  });

  const pushResult = await pushRes.json();

  return new Response(JSON.stringify({ success: true, result: pushResult }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
