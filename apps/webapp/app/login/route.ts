import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../lib/token";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t");
  if (!t) return NextResponse.redirect(new URL("/expired", req.url));
  const payload = verifyToken(t);
  if (!payload) return NextResponse.redirect(new URL("/expired", req.url));

  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set("socially_session", t, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 12, // 12 days
  });
  return res;
}
