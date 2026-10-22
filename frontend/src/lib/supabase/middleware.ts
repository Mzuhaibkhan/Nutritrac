import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isTokenNearExpiry(request: NextRequest): boolean {
  const allCookies = request.cookies.getAll();
  // Find Supabase auth cookie (e.g. sb-*-auth-token or access-token)
  const authCookie = allCookies.find(
    (c) => c.name.includes("-auth-token") || c.name.startsWith("sb-")
  );

  if (!authCookie) {
    // If no session cookie exists, skip refresh
    return false;
  }

  try {
    let tokenStr = authCookie.value;
    if (tokenStr.startsWith("base64-")) {
      tokenStr = Buffer.from(tokenStr.replace("base64-", ""), "base64").toString("utf-8");
    }
    if (tokenStr.startsWith("[")) {
      const parsed = JSON.parse(tokenStr);
      tokenStr = parsed[0] || tokenStr;
    } else if (tokenStr.startsWith("{")) {
      const parsed = JSON.parse(tokenStr);
      tokenStr = parsed.access_token || tokenStr;
    }

    // Inspect JWT expiration timestamp without requiring crypto verification in edge middleware
    const parts = tokenStr.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
      if (payload.exp) {
        const nowSec = Math.floor(Date.now() / 1000);
        // Only refresh if expired or within 5 minutes (300 seconds) of expiration
        return payload.exp - nowSec < 300;
      }
    }
  } catch {
    // Fall back to refresh on parse error
    return true;
  }

  return false;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Skip remote Supabase refresh if token is still fresh (>5 mins remaining)
  if (!isTokenNearExpiry(request)) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session when expired or nearing expiry
  await supabase.auth.getUser();

  return supabaseResponse;
}
