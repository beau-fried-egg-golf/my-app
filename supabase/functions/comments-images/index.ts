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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const clientMemberId = formData.get("member_id") as string | null;

  const member = await verifyMemberstackToken(token, clientMemberId ?? undefined);
  if (!member) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (!file) {
    return new Response(
      JSON.stringify({ error: "file is required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return new Response(
      JSON.stringify({ error: "File exceeds 5MB limit" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return new Response(
      JSON.stringify({
        error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP",
      }),
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

  // Generate unique storage path
  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${member.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("comment-images")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return new Response(
      JSON.stringify({ error: uploadError.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("comment-images").getPublicUrl(storagePath);

  // Return URL and path — image record will be created when comment is submitted
  return new Response(
    JSON.stringify({
      url: publicUrl,
      storage_path: storagePath,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
