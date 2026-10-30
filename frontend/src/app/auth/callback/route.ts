import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("redirect") || "/dashboard";

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const origin = host ? `${proto}://${host}` : new URL(request.url).origin;

  return NextResponse.redirect(`${origin}${next}`);
}
