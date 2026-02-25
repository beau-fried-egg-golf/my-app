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

  const { user_id, code } = await req.json();

  if (!user_id || !code) {
    return new Response(
      JSON.stringify({ success: false, error: "user_id and code are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Look up matching unused, non-expired code
  const { data: codeRow, error: queryError } = await supabase
    .from("email_verification_codes")
    .select("*")
    .eq("user_id", user_id)
    .eq("code", code)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (queryError || !codeRow) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid or expired code" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Mark code as used
  await supabase
    .from("email_verification_codes")
    .update({ used: true })
    .eq("id", codeRow.id);

  // Mark profile as email verified
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ email_verified: true })
    .eq("id", user_id);

  if (updateError) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to update profile" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
