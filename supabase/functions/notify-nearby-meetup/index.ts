import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const { meetup_id, course_id, meetup_name, creator_id } = await req.json();

  if (!meetup_id || !course_id || !meetup_name || !creator_id) {
    return new Response(
      JSON.stringify({ error: "meetup_id, course_id, meetup_name, and creator_id are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Get meetup course coordinates
  const { data: meetupCourse, error: courseError } = await supabase
    .from("courses")
    .select("latitude, longitude")
    .eq("id", course_id)
    .single();

  if (courseError || !meetupCourse) {
    return new Response(
      JSON.stringify({ error: "Meetup course not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Get all users with a home course, push token, and nearby enabled (excluding creator)
  const { data: candidates } = await supabase
    .from("profiles")
    .select("id, home_course_id, expo_push_token, push_nearby_enabled, push_nearby_radius_miles")
    .not("expo_push_token", "is", null)
    .not("home_course_id", "is", null)
    .eq("push_nearby_enabled", true)
    .neq("id", creator_id);

  if (!candidates || candidates.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Get all home course coordinates
  const homeCourseIds = [...new Set(candidates.map(c => c.home_course_id))];
  const { data: homeCourses } = await supabase
    .from("courses")
    .select("id, latitude, longitude")
    .in("id", homeCourseIds);

  const courseMap = new Map(
    (homeCourses ?? []).map(c => [c.id, { lat: c.latitude, lon: c.longitude }]),
  );

  // Filter candidates within their configured radius
  const messages: { to: string; title: string; body: string; data: Record<string, string>; sound: string }[] = [];

  for (const candidate of candidates) {
    const homeCourse = courseMap.get(candidate.home_course_id);
    if (!homeCourse) continue;

    const distance = haversineDistance(
      homeCourse.lat, homeCourse.lon,
      meetupCourse.latitude, meetupCourse.longitude,
    );

    const radius = candidate.push_nearby_radius_miles ?? 50;
    if (distance <= radius) {
      messages.push({
        to: candidate.expo_push_token,
        title: "Meetup Near You",
        body: `${meetup_name} was just created near your home course!`,
        data: { meetup_id },
        sound: "default",
      });
    }
  }

  if (messages.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Send batch via Expo Push API (max 100 per request)
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });
    sent += batch.length;
  }

  return new Response(JSON.stringify({ sent }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
