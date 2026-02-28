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

  if (req.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  const url = new URL(req.url);
  const slugsParam = url.searchParams.get("slugs");
  const collection = url.searchParams.get("collection");

  if (!slugsParam || !collection) {
    return new Response(
      JSON.stringify({ error: "slugs and collection are required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const slugs = slugsParam.split(",").map((s) => s.trim()).filter(Boolean);
  if (slugs.length === 0) {
    return new Response(JSON.stringify({ counts: {} }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Fetch non-deleted, non-suspended comment counts grouped by article_slug
  const { data: comments, error } = await supabase
    .from("comments")
    .select("article_slug")
    .eq("collection_slug", collection)
    .eq("is_deleted", false)
    .eq("is_suspended", false)
    .in("article_slug", slugs);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const counts: Record<string, number> = {};
  for (const c of comments ?? []) {
    counts[c.article_slug] = (counts[c.article_slug] ?? 0) + 1;
  }

  // Fill in zeros for slugs with no comments
  for (const slug of slugs) {
    if (!(slug in counts)) counts[slug] = 0;
  }

  return new Response(JSON.stringify({ counts }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
