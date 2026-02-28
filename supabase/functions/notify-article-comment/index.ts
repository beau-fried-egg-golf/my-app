import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  const { comment_id } = await req.json();

  if (!comment_id) {
    return new Response(
      JSON.stringify({ error: "comment_id is required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Look up the comment
  const { data: comment } = await supabase
    .from("comments")
    .select("id, article_slug, member_id, member_name")
    .eq("id", comment_id)
    .single();

  if (!comment) {
    return new Response(
      JSON.stringify({ skipped: true, reason: "Comment not found" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Find the commenter's Supabase profile (if they have a linked account)
  const { data: commenterProfile } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("memberstack_id", comment.member_id)
    .single();

  // Find all OTHER unique commenters on the same article
  const { data: allComments } = await supabase
    .from("comments")
    .select("member_id")
    .eq("article_slug", comment.article_slug)
    .eq("is_deleted", false)
    .neq("member_id", comment.member_id);

  if (!allComments || allComments.length === 0) {
    return new Response(
      JSON.stringify({ skipped: true, reason: "No other commenters" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Get unique member IDs of other commenters
  const otherMemberIds = [...new Set(allComments.map((c: { member_id: string }) => c.member_id))];

  // Find which of these have linked Supabase profiles
  const { data: recipientProfiles } = await supabase
    .from("profiles")
    .select("id, memberstack_id")
    .in("memberstack_id", otherMemberIds);

  if (!recipientProfiles || recipientProfiles.length === 0) {
    return new Response(
      JSON.stringify({ skipped: true, reason: "No linked profiles found" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Dedup: Check if same commenter already notified on this article within 5 min
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: recentNotifs } = await supabase
    .from("notifications")
    .select("user_id")
    .eq("type", "article_comment")
    .eq("article_slug", comment.article_slug)
    .eq("actor_id", commenterProfile?.id ?? "")
    .gte("created_at", fiveMinAgo);

  const recentlyNotifiedIds = new Set(
    (recentNotifs ?? []).map((n: { user_id: string }) => n.user_id),
  );

  // Create activity row
  if (commenterProfile) {
    await supabase.from("activities").insert({
      id: crypto.randomUUID(),
      type: "article_comment",
      user_id: commenterProfile.id,
      content: comment.member_name,
      created_at: new Date().toISOString(),
    });
  }

  // For each recipient: insert notification + send push
  const now = new Date().toISOString();
  let sent = 0;

  for (const recipient of recipientProfiles) {
    // Skip if already notified recently
    if (recentlyNotifiedIds.has(recipient.id)) continue;
    // Skip self
    if (commenterProfile && recipient.id === commenterProfile.id) continue;

    // Insert notification
    await supabase.from("notifications").insert({
      id: crypto.randomUUID(),
      user_id: recipient.id,
      type: "article_comment",
      actor_id: commenterProfile?.id ?? null,
      article_slug: comment.article_slug,
      is_read: false,
      created_at: now,
    });

    // Send push notification
    await supabase.functions.invoke("send-push", {
      body: {
        recipient_id: recipient.id,
        title: comment.member_name,
        body: "commented on an article you commented on",
        data: {
          article_slug: comment.article_slug,
          type: "article_comment",
        },
        push_type: "article_comment",
      },
    });

    sent++;
  }

  return new Response(
    JSON.stringify({
      success: true,
      recipients: recipientProfiles.length,
      sent,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
