import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function decodeHtmlEntities(str: string): string {
  const named: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
    rsquo: "\u2019", lsquo: "\u2018", rdquo: "\u201D", ldquo: "\u201C",
    ndash: "\u2013", mdash: "\u2014", hellip: "\u2026",
    trade: "\u2122", copy: "\u00A9", reg: "\u00AE",
    nbsp: " ", bull: "\u2022", middot: "\u00B7",
    laquo: "\u00AB", raquo: "\u00BB",
    cent: "\u00A2", pound: "\u00A3", euro: "\u20AC", yen: "\u00A5",
  };
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (full, name) => named[name] ?? named[name.toLowerCase()] ?? full);
}

function extractMeta(html: string): {
  title: string;
  description: string;
  image: string;
} {
  function getMetaContent(
    property: string,
    html: string,
  ): string | undefined {
    // Match both property="..." and name="..." attributes
    const re = new RegExp(
      `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']` +
        `|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
      "i",
    );
    const m = html.match(re);
    const raw = m?.[1] ?? m?.[2] ?? undefined;
    return raw ? decodeHtmlEntities(raw) : undefined;
  }

  const title =
    getMetaContent("og:title", html) ??
    getMetaContent("twitter:title", html) ??
    decodeHtmlEntities(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "") ??
    "";

  const description =
    getMetaContent("og:description", html) ??
    getMetaContent("twitter:description", html) ??
    "";

  const image =
    getMetaContent("og:image", html) ??
    getMetaContent("twitter:image", html) ??
    "";

  return { title, description, image };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Missing url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate URL scheme
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return new Response(
        JSON.stringify({ error: "Only http/https URLs are supported" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Twitter/X: use fxtwitter JSON API
    const host = parsed.hostname.replace("www.", "");
    if (host === "twitter.com" || host === "x.com") {
      const tweetPath = parsed.pathname; // e.g. /user/status/123
      const fxRes = await fetch(`https://api.fxtwitter.com${tweetPath}`, {
        headers: { Accept: "application/json" },
      });
      if (fxRes.ok) {
        const fx = await fxRes.json();
        const tweet = fx.tweet;
        if (tweet) {
          const authorName = tweet.author?.name ?? "";
          const authorHandle = tweet.author?.screen_name
            ? `@${tweet.author.screen_name}`
            : "";
          const tweetText = tweet.text ?? "";
          const tweetImage =
            tweet.media?.photos?.[0]?.url ??
            tweet.author?.avatar_url ??
            "";
          return new Response(
            JSON.stringify({
              title: authorName
                ? `${authorName} (${authorHandle})`
                : "Post on X",
              description: tweetText,
              image: tweetImage,
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            },
          );
        }
      }
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    const html = await res.text();
    const meta = extractMeta(html);

    return new Response(JSON.stringify(meta), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
