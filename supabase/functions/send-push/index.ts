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
    }),
  });

  const pushResult = await pushRes.json();

  return new Response(JSON.stringify({ success: true, result: pushResult }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
