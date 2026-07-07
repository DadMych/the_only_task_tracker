import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/board", "/api/tasks", "/api/activity", "/api/uploads"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!isProtected) return NextResponse.next();

  const session = request.cookies.get("tfp_session")?.value;
  if (session === "owner" || session === "boss") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/board/:path*",
    "/api/tasks/:path*",
    "/api/activity/:path*",
    "/api/uploads/:path*",
  ],
};
