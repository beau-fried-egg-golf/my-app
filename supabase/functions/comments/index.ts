import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  extractBearerToken,
  verifyMemberstackToken,
  MemberstackMember,
} from "../_shared/memberstack-auth.ts";

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function getMemberFullName(member: MemberstackMember): string {
  const cf = member.customFields ?? {};
  // Try common Memberstack custom field names for full name
  const fullName = cf["name"] ?? cf["full-name"] ?? cf["full_name"] ?? cf["fullName"];
  if (fullName && fullName.trim().includes(" ")) return titleCase(fullName.trim());

  // Try first + last name fields
  const first = cf["first-name"] ?? cf["first_name"] ?? cf["firstName"] ?? cf["first name"];
  const last = cf["last-name"] ?? cf["last_name"] ?? cf["lastName"] ?? cf["last name"];
  if (first && last) return titleCase(`${first.trim()} ${last.trim()}`);
  if (first) return titleCase(first.trim());

  // Fall back to full name even if single word
  if (fullName) return titleCase(fullName.trim());

  // Check metaData (Memberstack Admin API sometimes returns name here)
  const md = (member.metaData ?? {}) as Record<string, unknown>;
  if (typeof md["name"] === "string") return titleCase(md["name"]);

  // Last resort: email prefix
  return titleCase(member.auth?.email?.split("@")[0] ?? "Member");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Allowed HTML tags for sanitization
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
]);

/**
 * Basic server-side HTML sanitization.
 * Strips all tags except the allowed set. For <a>, only href and rel attributes are kept.
 */
function sanitizeHtml(html: string): string {
  // Remove script/style tags and their content
  let clean = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");

  // Process remaining tags
  clean = clean.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, tag, attrs) => {
    const lowerTag = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(lowerTag)) return "";

    if (lowerTag === "a") {
      // Only keep href and rel attributes
      const hrefMatch = attrs.match(/href\s*=\s*"([^"]*)"/i) ||
        attrs.match(/href\s*=\s*'([^']*)'/i);
      const href = hrefMatch ? hrefMatch[1] : "";
      if (!href) return "";
      // Prevent javascript: URLs
      if (href.trim().toLowerCase().startsWith("javascript:")) return "";
      return match.startsWith("</")
        ? "</a>"
        : `<a href="${href}" rel="nofollow noopener" target="_blank">`;
    }

    // Self-closing tags
    if (lowerTag === "br") return "<br>";

    return match.startsWith("</") ? `</${lowerTag}>` : `<${lowerTag}>`;
  });

  return clean;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url = new URL(req.url);

  // ── GET: Fetch comments for an article ──
  if (req.method === "GET") {
    const articleSlug = url.searchParams.get("article_slug");
    const collection = url.searchParams.get("collection");

    if (!articleSlug || !collection) {
      return jsonResponse(
        { error: "article_slug and collection are required" },
        400,
      );
    }

    // Check collection is enabled
    const { data: collectionData } = await supabase
      .from("comment_collections")
      .select("is_enabled")
      .eq("collection_slug", collection)
      .single();

    if (!collectionData || !collectionData.is_enabled) {
      return jsonResponse({ comments: [], comments_enabled: false, total: 0 });
    }

    // Fetch non-deleted comments
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("*")
      .eq("article_slug", articleSlug)
      .eq("collection_slug", collection)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (commentsError) {
      return jsonResponse({ error: commentsError.message }, 500);
    }

    const commentIds = (comments ?? []).map((c: { id: string }) => c.id);

    // Parallel fetch reactions + images
    const [reactionsRes, imagesRes] = commentIds.length > 0
      ? await Promise.all([
        supabase
          .from("comment_reactions")
          .select("*")
          .in("comment_id", commentIds),
        supabase
          .from("comment_images")
          .select("*")
          .in("comment_id", commentIds)
          .order("position"),
      ])
      : [{ data: [] }, { data: [] }];

    // Group by comment_id
    const reactionsByComment = new Map<string, unknown[]>();
    for (const r of reactionsRes.data ?? []) {
      const list = reactionsByComment.get(r.comment_id) ?? [];
      list.push(r);
      reactionsByComment.set(r.comment_id, list);
    }

    const imagesByComment = new Map<string, unknown[]>();
    for (const img of imagesRes.data ?? []) {
      const list = imagesByComment.get(img.comment_id) ?? [];
      list.push(img);
      imagesByComment.set(img.comment_id, list);
    }

    const enriched = (comments ?? []).map((c: Record<string, unknown>) => {
      const comment = { ...c };
      // For suspended comments, hide body content
      if (c.is_suspended) {
        comment.body_html = "";
        comment.body_json = null;
        comment.body_text = "[This comment has been suspended]";
      }
      return {
        ...comment,
        reactions: reactionsByComment.get(c.id as string) ?? [],
        images: imagesByComment.get(c.id as string) ?? [],
      };
    });

    return jsonResponse({
      comments: enriched,
      comments_enabled: true,
      total: enriched.length,
    });
  }

  // ── POST: Create a new comment ──
  if (req.method === "POST") {
    const token = extractBearerToken(req);
    if (!token) {
      return jsonResponse({ error: "Authorization required" }, 401);
    }

    const {
      article_slug,
      collection,
      body_html,
      body_json,
      body_text,
      parent_id,
      images,
      member_id: clientMemberId,
    } = await req.json();

    const member = await verifyMemberstackToken(token, clientMemberId);
    if (!member) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }

    if (!article_slug || !collection || !body_text) {
      return jsonResponse(
        { error: "article_slug, collection, and body_text are required" },
        400,
      );
    }

    if (body_text.length > 5000) {
      return jsonResponse(
        { error: "Comment exceeds 5000 character limit" },
        400,
      );
    }

    // Check collection enabled
    const { data: collectionData } = await supabase
      .from("comment_collections")
      .select("is_enabled")
      .eq("collection_slug", collection)
      .single();

    if (!collectionData || !collectionData.is_enabled) {
      return jsonResponse(
        { error: "Comments are not enabled for this collection" },
        403,
      );
    }

    // If reply, validate parent exists
    if (parent_id) {
      const { data: parent } = await supabase
        .from("comments")
        .select("id, is_deleted")
        .eq("id", parent_id)
        .single();

      if (!parent || parent.is_deleted) {
        return jsonResponse({ error: "Parent comment not found" }, 404);
      }
    }

    const sanitizedHtml = body_html ? sanitizeHtml(body_html) : "";

    // Use the client-provided member_id so client-side ownership checks match
    const storedMemberId = clientMemberId || member.id;

    const { data: created, error: insertError } = await supabase
      .from("comments")
      .insert({
        article_slug,
        collection_slug: collection,
        member_id: storedMemberId,
        member_name: getMemberFullName(member),
        member_avatar_url: member.profileImage ?? null,
        parent_id: parent_id ?? null,
        body_html: sanitizedHtml,
        body_json: body_json ?? null,
        body_text,
      })
      .select()
      .single();

    if (insertError) {
      return jsonResponse({ error: insertError.message }, 500);
    }

    // Link uploaded images to the comment
    if (images && Array.isArray(images) && images.length > 0 && created) {
      const imageRows = images.slice(0, 5).map(
        (img: { url: string; storage_path: string }, i: number) => ({
          comment_id: created.id,
          url: img.url,
          storage_path: img.storage_path,
          position: i,
        }),
      );
      await supabase.from("comment_images").insert(imageRows);
    }

    // Trigger notifications to other commenters (fire and forget)
    if (created) {
      supabase.functions
        .invoke("notify-article-comment", {
          body: { comment_id: created.id },
        })
        .catch(() => {});
    }

    return jsonResponse({ comment: created }, 201);
  }

  // ── PATCH: Edit a comment ──
  if (req.method === "PATCH") {
    const token = extractBearerToken(req);
    if (!token) {
      return jsonResponse({ error: "Authorization required" }, 401);
    }

    const { comment_id, body_html, body_json, body_text, member_id: clientMemberId } = await req.json();

    const member = await verifyMemberstackToken(token, clientMemberId);
    if (!member) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }

    if (!comment_id || !body_text) {
      return jsonResponse(
        { error: "comment_id and body_text are required" },
        400,
      );
    }

    if (body_text.length > 5000) {
      return jsonResponse(
        { error: "Comment exceeds 5000 character limit" },
        400,
      );
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from("comments")
      .select("id, member_id, body_html, body_text")
      .eq("id", comment_id)
      .single();

    if (!existing) {
      return jsonResponse({ error: "Comment not found" }, 404);
    }
    if (existing.member_id !== member.id && existing.member_id !== clientMemberId) {
      return jsonResponse({ error: "Not your comment" }, 403);
    }

    // Save current body to edit history
    await supabase.from("comment_edit_history").insert({
      comment_id,
      body_html: existing.body_html,
      body_text: existing.body_text,
    });

    const sanitizedHtml = body_html ? sanitizeHtml(body_html) : "";

    const { data: updated, error: updateError } = await supabase
      .from("comments")
      .update({
        body_html: sanitizedHtml,
        body_json: body_json ?? null,
        body_text,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", comment_id)
      .select()
      .single();

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 500);
    }

    return jsonResponse({ comment: updated });
  }

  // ── DELETE: Soft delete a comment ──
  if (req.method === "DELETE") {
    const token = extractBearerToken(req);
    if (!token) {
      return jsonResponse({ error: "Authorization required" }, 401);
    }

    const deleteUrl = new URL(req.url);
    const comment_id = deleteUrl.searchParams.get("comment_id");
    const clientMemberId = deleteUrl.searchParams.get("member_id") || undefined;

    const member = await verifyMemberstackToken(token, clientMemberId);
    if (!member) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }

    if (!comment_id) {
      return jsonResponse({ error: "comment_id is required" }, 400);
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from("comments")
      .select("id, member_id")
      .eq("id", comment_id)
      .single();

    if (!existing) {
      return jsonResponse({ error: "Comment not found" }, 404);
    }
    if (existing.member_id !== member.id && existing.member_id !== clientMemberId) {
      return jsonResponse({ error: "Not your comment" }, 403);
    }

    const { error: deleteError } = await supabase
      .from("comments")
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", comment_id);

    if (deleteError) {
      return jsonResponse({ error: deleteError.message }, 500);
    }

    return jsonResponse({ success: true });
  }

  return new Response("Method not allowed", {
    status: 405,
    headers: corsHeaders,
  });
});
