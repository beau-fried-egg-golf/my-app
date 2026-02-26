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

  const { post_id, poster_name } = await req.json();

  if (!post_id || !poster_name) {
    return new Response(
      JSON.stringify({ error: "post_id and poster_name are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Find The Fried Egg profile
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, name");

  const friedEgg = (allProfiles ?? []).find(
    (p: { name: string }) => p.name.toLowerCase().includes("fried egg"),
  );

  if (!friedEgg) {
    return new Response(
      JSON.stringify({ skipped: true, reason: "Fried Egg profile not found" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Get all followers of The Fried Egg
  const { data: followers } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", friedEgg.id);

  if (!followers || followers.length === 0) {
    return new Response(
      JSON.stringify({ skipped: true, reason: "No followers" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Create in-app notification rows for each follower
  const notifRows = followers.map((f: { follower_id: string }) => ({
    id: crypto.randomUUID(),
    user_id: f.follower_id,
    type: "fe_content",
    actor_id: friedEgg.id,
    post_id,
    is_read: false,
    created_at: new Date().toISOString(),
  }));

  await supabase.from("notifications").insert(notifRows);

  // Send push to each follower via send-push
  const results = await Promise.allSettled(
    followers.map((f: { follower_id: string }) =>
      supabase.functions.invoke("send-push", {
        body: {
          recipient_id: f.follower_id,
          title: poster_name,
          body: "New post from The Fried Egg",
          data: { post_id, type: "fe_content" },
          push_type: "fe_content",
        },
      }),
    ),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;

  return new Response(
    JSON.stringify({ success: true, followers: followers.length, sent }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
