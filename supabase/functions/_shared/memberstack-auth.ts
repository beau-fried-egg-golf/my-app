/**
 * Memberstack authentication helper for edge functions.
 * Verifies members via the Memberstack Admin API.
 */

export interface MemberstackMember {
  id: string;
  auth: { email: string };
  customFields?: Record<string, string>;
  profileImage?: string;
  metaData?: Record<string, unknown>;
}

/**
 * Extract Bearer token from the Authorization header.
 */
export function extractBearerToken(req: Request): string | null {
  const auth = req.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

/**
 * Decode a JWT payload without verifying the signature.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/**
 * Verify a Memberstack member by looking them up in the Admin API.
 * Tries to extract the member ID from the JWT token first,
 * falls back to the provided fallbackMemberId if decode fails.
 */
export async function verifyMemberstackToken(
  token: string,
  fallbackMemberId?: string,
): Promise<MemberstackMember | null> {
  const secretKey = Deno.env.get("MEMBERSTACK_SECRET_KEY");
  if (!secretKey) {
    console.error("MEMBERSTACK_SECRET_KEY not set");
    return null;
  }

  // Try to extract member ID from the JWT
  let memberId: string | undefined;
  const payload = decodeJwtPayload(token);
  if (payload) {
    memberId = (
      payload.sub ??
      payload.id ??
      payload.memberId ??
      payload.member_id
    ) as string | undefined;
  }

  // Fall back to the member ID provided by the client
  if (!memberId && fallbackMemberId) {
    memberId = fallbackMemberId;
  }

  if (!memberId) {
    console.error(
      "No member ID found. JWT keys:",
      payload ? Object.keys(payload) : "decode failed",
    );
    return null;
  }

  // Verify member exists via Memberstack Admin API
  try {
    const res = await fetch(
      `https://admin.memberstack.com/members/${memberId}`,
      { headers: { "X-API-KEY": secretKey } },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("Memberstack Admin API returned", res.status, body);
      return null;
    }

    const data = await res.json();
    return data?.data ?? null;
  } catch (err) {
    console.error("Memberstack Admin API call failed:", err);
    return null;
  }
}
