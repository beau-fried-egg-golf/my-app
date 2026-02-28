import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  extractBearerToken,
  verifyMemberstackToken,
} from "../_shared/memberstack-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_EMOJIS = new Set(["👍", "🔥", "😂", "❤️"]);

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

  const token = extractBearerToken(req);
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Authorization required" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const { comment_id, emoji, member_id: clientMemberId } = await req.json();

  const member = await verifyMemberstackToken(token, clientMemberId);
  if (!member) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (!comment_id || !emoji) {
    return new Response(
      JSON.stringify({ error: "comment_id and emoji are required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (!ALLOWED_EMOJIS.has(emoji)) {
    return new Response(
      JSON.stringify({ error: "Invalid emoji" }),
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

  // Check if reaction already exists (toggle behavior)
  const memberId = clientMemberId || member.id;
  const { data: existing } = await supabase
    .from("comment_reactions")
    .select("id")
    .eq("comment_id", comment_id)
    .eq("member_id", memberId)
    .eq("emoji", emoji)
    .single();

  if (existing) {
    // Remove existing reaction
    await supabase.from("comment_reactions").delete().eq("id", existing.id);
  } else {
    // Add new reaction — build full name from custom fields
    const cf = member.customFields ?? {};
    const fullName = cf["name"] ?? cf["full-name"] ?? cf["full_name"] ?? cf["fullName"];
    const first = cf["first-name"] ?? cf["first_name"] ?? cf["firstName"] ?? cf["first name"];
    const last = cf["last-name"] ?? cf["last_name"] ?? cf["lastName"] ?? cf["last name"];
    let memberName = fullName?.trim() ?? "";
    if (!memberName && first) memberName = last ? `${first.trim()} ${last.trim()}` : first.trim();
    if (!memberName) memberName = member.auth?.email?.split("@")[0] ?? "Member";
    memberName = memberName.replace(/\b\w/g, (c: string) => c.toUpperCase());

    await supabase.from("comment_reactions").insert({
      comment_id,
      member_id: clientMemberId || member.id,
      member_name: memberName,
      emoji,
    });
  }

  // Return updated reactions for this comment
  const { data: reactions } = await supabase
    .from("comment_reactions")
    .select("*")
    .eq("comment_id", comment_id)
    .order("created_at");

  return new Response(
    JSON.stringify({ reactions: reactions ?? [] }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
